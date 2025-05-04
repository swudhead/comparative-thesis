// MapView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { nodesGeoJSON } from '../utils/nodes';
import { edgesGeoJSON } from '../utils/edges';

MapboxGL.setAccessToken('pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtYTUxajkwZzBjOWgyanF1YW5jcjRkYzIifQ.MN-J9CnKqnkhl8qxkGCL2A');

interface Node {
  osmid: string;
  lat: number;
  lng: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface Graph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge[]>;
  blockedNodes?: string[]; // Add blockedNodes as an optional property
}

type MapViewProps = {
  onMapLoaded: () => void;
  onError: (error: string) => void;
  startPoint: { lat: number; lng: number } | null;
  endPoint: { lat: number; lng: number } | null;
  pathResult: {
    coordinates: number[][];
    algorithm: string;
    visitedNodes?: number[][];
  } | null;
  onPointSelected: (pointType: 'start' | 'end', coordinates: { lat: number; lng: number }, edgeCoordinates?: number[][]) => void;
  selectionMode: 'start' | 'end' | 'none';
  onTapMap: (event: any) => void;
  onGraphUpdate: (graph: Graph) => void;
  onBlockEdge?: (source: string, target: string) => void;
  graphLoading?: boolean;
  onBlockNode?: (nodeId: string) => void;
  isBlockingNode?: boolean;
  showVisitedNodes: boolean;
};

const validateColor = (color: string): string => {
  const hexPattern = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
  if (!hexPattern.test(color)) {
    console.warn(`Invalid color value: ${color}. Defaulting to #000000.`);
    return '#000000';
  }
  return color;
};

const areMapsEqual = <K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean => {
  if (map1.size !== map2.size) return false;
  for (const [key, value] of map1) {
    if (!map2.has(key) || map2.get(key) !== value) return false;
  }
  return true;
};

const MapView: React.FC<MapViewProps> = ({
  onMapLoaded,
  onError,
  startPoint,
  endPoint,
  pathResult,
  onPointSelected,
  selectionMode,
  onTapMap,
  onGraphUpdate,
  onBlockEdge,
  graphLoading,
  onBlockNode,
  isBlockingNode,
  showVisitedNodes,
}) => {
  const [camera, setCamera] = useState({
    zoomLevel: 14,
    centerCoordinate: [123.19549, 13.62617],
    animationDuration: 500
  });
  const [graph, setGraph] = useState<Graph>({ nodes: new Map(), edges: new Map() });
  const [nodesFetched, setNodesFetched] = useState(false);
  const [edgesFetched, setEdgesFetched] = useState(false);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [highlightedEdge, setHighlightedEdge] = useState<[string, string] | null>(null);
  const [blockedEdges, setBlockedEdges] = useState<{ source: string, target: string }[]>([]);
  const [blockedNodes, setBlockedNodes] = useState<string[]>([]);

  const stableOnError = useCallback((error: string) => {
    onError(error);
  }, [onError]);

  useEffect(() => {
    const loadNodes = () => {
      const nodesMap = new Map<string, Node>();

      if (!nodesGeoJSON?.features) {
        stableOnError('Invalid nodesGeoJSON data');
        return;
      }

      for (const feature of nodesGeoJSON.features) {
        if (feature.properties?.osmid && feature.geometry?.type === 'Point') {
          const osmid = feature.properties.osmid.toString();
          const [lng, lat] = feature.geometry.coordinates;
          nodesMap.set(osmid, { osmid, lat, lng });
        }
      }

      setGraph(prev => areMapsEqual(prev.nodes, nodesMap) ? prev : { ...prev, nodes: nodesMap });
      setNodesFetched(true);
    };

    loadNodes();
  }, [stableOnError]);

  useEffect(() => {
    if (!nodesFetched) return;

    const loadEdges = () => {
      const edgesMap = new Map<string, Edge[]>();

      if (!edgesGeoJSON?.features) {
        stableOnError('Invalid edgesGeoJSON data');
        return;
      }

      for (const feature of edgesGeoJSON.features) {
        const { u, v, length } = feature.properties || {};
        if (u && v && length && u !== v) {
          const weight = parseFloat(length);
          if (!isNaN(weight)) {
            const source = u.toString();
            const target = v.toString();
            
            if (graph.nodes.has(source) && graph.nodes.has(target)) {
              if (!edgesMap.has(source)) edgesMap.set(source, []);
              edgesMap.get(source)?.push({ source, target, weight });
              
              if (!edgesMap.has(target)) edgesMap.set(target, []);
              edgesMap.get(target)?.push({ source: target, target: source, weight });
            }
          }
        }
      }

      setGraph(prev => areMapsEqual(prev.edges, edgesMap) ? prev : { ...prev, edges: edgesMap });
      setEdgesFetched(true);
    };

    loadEdges();
  }, [nodesFetched, graph.nodes]);

  const stableGraph = useMemo(() => graph, [graph.nodes.size, graph.edges.size]);

  useEffect(() => {
    if (nodesFetched && edgesFetched) {
      onGraphUpdate(graph);
    }
  }, [nodesFetched, edgesFetched, graph, onGraphUpdate]);

  useEffect(() => {
    if (startPoint && endPoint) {
      const centerLat = (startPoint.lat + endPoint.lat) / 2;
      const centerLng = (startPoint.lng + endPoint.lng) / 2;
      const latDiff = Math.abs(startPoint.lat - endPoint.lat);
      const lngDiff = Math.abs(startPoint.lng - endPoint.lng);
      const maxDiff = Math.max(latDiff, lngDiff);

      let newZoom = 14;
      if (maxDiff > 0.05) newZoom = 12;
      else if (maxDiff > 0.02) newZoom = 13;

      setCamera(prev => ({
        ...prev,
        zoomLevel: newZoom,
        centerCoordinate: [centerLng, centerLat]
      }));
    }
  }, [startPoint, endPoint]);

  // Map visited nodes to osmids using closest-node matching
  useEffect(() => {
    if (pathResult?.visitedNodes && pathResult.visitedNodes.length > 0) {
      const visitedIds: string[] = [];
      pathResult.visitedNodes.forEach(([lng, lat]) => {
        for (const [osmid, node] of graph.nodes.entries()) {
          if (Math.abs(node.lng - lng) < 0.00001 && Math.abs(node.lat - lat) < 0.00001) {
            visitedIds.push(osmid);
            break;
          }
        }
      });
      setVisitedNodeIds(visitedIds);
      console.log(`Mapped ${visitedIds.length} visited nodes to osmids`);
    } else {
      setVisitedNodeIds([]);
    }
  }, [pathResult, graph.nodes]);

  useEffect(() => {
    if (pathResult?.algorithm === 'd-star-lite' && blockedEdges.length > 0) {
      onGraphUpdate({ ...graph, blockedEdges });
    }
  }, [pathResult, blockedEdges, graph, onGraphUpdate]);

  useEffect(() => {
    if (pathResult?.algorithm === 'd-star-lite' && blockedNodes.length > 0) {
      onGraphUpdate({ ...graph, blockedNodes });
    }
  }, [pathResult, blockedNodes, graph, onGraphUpdate]);

  const getPathColor = (algorithm: string) => {
    const color = {
      dijkstra: '#FF9800',
      'a-star': '#4CAF50',
      'd-star': '#9C27B0',
      'd-star-lite': '#3F51B5',
      'gbfs': '#FF5722',
      'bellman-ford': '#FF9800',
    }[algorithm] || '#2196F3';
    return validateColor(color);
  };

  const handleFeaturePress = useCallback((event: any, source: 'nodes' | 'edges') => {
    if (!event?.features?.length) return;

    const feature = event.features[0];
    if (source === 'nodes') {
      const [lng, lat] = feature.geometry.coordinates;
      if (selectionMode === 'start') {
        onPointSelected('start', { lat, lng });
      } else if (selectionMode === 'end') {
        onPointSelected('end', { lat, lng });
      }
    } else if (source === 'edges') {
      const { u, v } = feature.properties;
      if (!u || !v) return;

      const sourceNode = graph.nodes.get(u.toString());
      const targetNode = graph.nodes.get(v.toString());
      if (!sourceNode || !targetNode || 
          blockedNodes.includes(sourceNode.osmid) || 
          blockedNodes.includes(targetNode.osmid)) {
        return; // Skip if either node is blocked
      }

      const edgeCoordinates = [
        [sourceNode.lng, sourceNode.lat],
        [targetNode.lng, targetNode.lat]
      ];

      const tapPoint = event.coordinates;
      const sourceDist = Math.hypot(
        sourceNode.lng - tapPoint.longitude,
        sourceNode.lat - tapPoint.latitude
      );
      const targetDist = Math.hypot(
        targetNode.lng - tapPoint.longitude,
        targetNode.lat - tapPoint.latitude
      );

      const nearest = sourceDist < targetDist ? sourceNode : targetNode;
      if (selectionMode === 'start') {
        onPointSelected('start', { lat: nearest.lat, lng: nearest.lng }, edgeCoordinates);
      } else if (selectionMode === 'end') {
        onPointSelected('end', { lat: nearest.lat, lng: nearest.lng }, edgeCoordinates);
      }

      setHighlightedEdge([u.toString(), v.toString()]);
      setTimeout(() => setHighlightedEdge(null), 2000);
    }
  }, [selectionMode, graph.nodes, onPointSelected, blockedNodes]);

  const handleEdgeLongPress = useCallback((event: any) => {
    if (!onBlockEdge || !event?.features?.length) return;
    const { u, v } = event.features[0].properties;
    onBlockEdge(u.toString(), v.toString());
    setBlockedEdges(prev => [...prev, { source: u.toString(), target: v.toString() }]);
    Alert.alert('Edge Blocked', `Blocked connection between nodes ${u} and ${v}`);
  }, [onBlockEdge]);

  const handleNodeLongPress = useCallback((event: any) => {
    if (!event?.features?.length) return;

    const feature = event.features[0];
    const osmid = feature.properties?.osmid;
    if (!osmid) return;

    setBlockedNodes(prev => [...prev, osmid]);
    Alert.alert('Node Blocked', `Blocked node with ID: ${osmid}`);
  }, []);

  const handleNodeTap = useCallback((event: any) => {
    if (!isBlockingNode || !event?.features?.length) return;

    const feature = event.features[0];
    const osmid = feature.properties?.osmid;
    if (!osmid) return;

    if (onBlockNode) {
      onBlockNode(osmid);
    }
  }, [isBlockingNode, onBlockNode]);

  useEffect(() => {
    if (isBlockingNode) {
      Alert.alert('Blocking Mode', 'Tap on a node to block it.');
    }
  }, [isBlockingNode]);

  const onTapMapHandler = useCallback((event: any) => {
    if (selectionMode === 'none') {
      onTapMap(event);
    }
  }, [pathResult, stableOnError]);

  return (
    <MapboxGL.MapView
    style={StyleSheet.absoluteFill}
    styleURL={MapboxGL.StyleURL.Street}
    onDidFailLoadingMap={(error) => stableOnError(`Map failed to load: ${error.message}`)}
    onDidFinishLoadingMap={onMapLoaded}
    logoEnabled={true}
    attributionEnabled={true}
    compassEnabled={true}
    onPress={onTapMapHandler}
    >
    <MapboxGL.Camera
    zoomLevel={camera.zoomLevel}
    centerCoordinate={camera.centerCoordinate}
    animationDuration={500}
    />

    <MapboxGL.ShapeSource
    id="nodes"
    shape={nodesGeoJSON}
    onPress={(event) => handleFeaturePress(event, 'nodes')}
    >
    <MapboxGL.CircleLayer
    id="nodes-layer"
    style={{
      circleRadius: selectionMode === 'none' ? 3 : 8,
      circleStrokeWidth: selectionMode === 'none' ? 1 : 2,
      circleStrokeColor: '#fff',
      visibility: 'visible',
      circleColor: visitedNodeIds.length > 0
      ? [
        'match',
        ['get', 'osmid'],
        ...visitedNodeIds.flatMap((id) => [id, validateColor('#FF0000')]),
          validateColor(
            selectionMode === 'none' ? '#2196F3' : selectionMode === 'start' ? '#4CAF50' : '#F44336'
          ),
      ]
      : validateColor(
        selectionMode === 'none' ? '#2196F3' : selectionMode === 'start' ? '#4CAF50' : '#F44336'
      ),
    }}
    minZoomLevel={10}
    filter={['==', ['geometry-type'], 'Point']}
    hitbox={{ width: 30, height: 30 }}
    />
    </MapboxGL.ShapeSource>

        <MapboxGL.ShapeSource
          id="edges"
          shape={edgesGeoJSON as GeoJSON.FeatureCollection}
          onPress={(event: { features?: any[] }) => handleFeaturePress(event, 'edges')}
          onLongPress={onBlockEdge ? (event: { features?: any[] }) => handleEdgeLongPress(event) : undefined}
        >
          <MapboxGL.LineLayer
        id="edges-layer"
        style={{
          lineColor: [
            'case',
            ['all',
          ['==', ['get', 'u'], highlightedEdge?.[0] ?? ''],
          ['==', ['get', 'v'], highlightedEdge?.[1] ?? '']
            ],
            '#FF0000',
            validateColor(
          selectionMode === 'none' ? '#1976D2' : 
          selectionMode === 'start' ? '#4CAF50' : '#F44336'
            )
          ],
          lineWidth: selectionMode === 'none' ? 2 : 4,
        }}
        minZoomLevel={10}
          />
        </MapboxGL.ShapeSource>

        {blockedEdges?.length > 0 && (
          <MapboxGL.ShapeSource
        id="blockedEdges"
        shape={{
          type: 'FeatureCollection',
          features: blockedEdges.map(({ source, target }) => {
            const srcNode = graph.nodes.get(source);
            const tgtNode = graph.nodes.get(target);
            if (!srcNode || !tgtNode) return null;

            return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [srcNode.lng, srcNode.lat],
              [tgtNode.lng, tgtNode.lat],
            ],
          },
          properties: {},
            };
          }).filter(Boolean) as GeoJSON.Feature[],
        }}
          >
        <MapboxGL.LineLayer
          id="blockedEdgesLayer"
          style={{
            lineColor: '#FF0000',
            lineWidth: 3,
            lineDasharray: [2, 2],
          }}
        />
          </MapboxGL.ShapeSource>
        )}

        {pathResult?.coordinates && pathResult.coordinates.length > 0 && (
          <MapboxGL.ShapeSource
        id="pathSource"
        shape={{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: pathResult.coordinates,
          },
        } as GeoJSON.Feature}
          >
        <MapboxGL.LineLayer
          id="pathLayer"
          style={{
            lineColor: getPathColor(pathResult.algorithm),
            lineWidth: 4,
            lineCap: 'round',
            lineJoin: 'round',
            lineOpacity: 1.0,
          }}
          aboveLayerID="edges-layer"
        />
          </MapboxGL.ShapeSource>
        )}

        {startPoint && (
          <MapboxGL.PointAnnotation id="startPoint" coordinate={[startPoint.lng, startPoint.lat]}>
        <View style={[styles.mapMarker, styles.startMarker]}>
          <Text style={styles.markerText}>S</Text>
        </View>
          </MapboxGL.PointAnnotation>
        )}

        {endPoint && (
          <MapboxGL.PointAnnotation id="endPoint" coordinate={[endPoint.lng, endPoint.lat]}>
        <View style={[styles.mapMarker, styles.endMarker]}>
          <Text style={styles.markerText}>E</Text>
        </View>
          </MapboxGL.PointAnnotation>
        )}

        {!pathResult && startPoint && endPoint && (
          <>
        <MapboxGL.PointAnnotation coordinate={[startPoint.lng, startPoint.lat]} id="debugStartPoint">
          <View style={styles.debugMarker} />
        </MapboxGL.PointAnnotation>
        <MapboxGL.PointAnnotation coordinate={[endPoint.lng, endPoint.lat]} id="debugEndPoint">
          <View style={styles.debugMarker} />
        </MapboxGL.PointAnnotation>
          </>
        )}

    {selectionMode !== 'none' && (
      <View style={styles.selectionIndicator}>
      <Text style={styles.selectionText}>
      {selectionMode === 'start' ? 'Select start point' : 'Select end point'}
      </Text>
      </View>
    )}
    </MapboxGL.MapView>
  );
};

const styles = StyleSheet.create({
  mapMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startMarker: { backgroundColor: '#4CAF50' },
  endMarker: { backgroundColor: '#F44336' },
  markerText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  selectionIndicator: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
  },
  selectionText: { color: 'white', fontWeight: 'bold' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  debugMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'red',
  },
});

export default MapView;

<MapView
  onMapLoaded={() => console.log('Map loaded')}
  onError={(error) => console.error('Map error:', error)}
  startPoint={{ lat: 13.62617, lng: 123.19549 }}
  endPoint={{ lat: 13.63000, lng: 123.20000 }}
  pathResult={{
    coordinates: [
      [123.19549, 13.62617],
      [123.20000, 13.63000],
    ],
    algorithm: 'dijkstra',
  }}
  onPointSelected={(type, coordinates) => console.log(`${type} point selected:`, coordinates)}
  selectionMode="start"
  onTapMap={(event) => console.log('Map tapped:', event)}
  onGraphUpdate={(graph) => console.log('Graph updated:', graph)}
  onBlockEdge={(source, target) => console.log(`Blocked edge: ${source} -> ${target}`)}
  graphLoading={false}
/>