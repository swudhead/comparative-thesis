import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
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
};

const validateColor = (color: string): string => {
  const hexPattern = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
  if (hexPattern.test(color)) {
    return color;
  }
  console.warn(`Invalid color value: ${color}. Using fallback color #000000.`);
  return '#000000';
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
}) => {
  const [camera, setCamera] = useState({
    zoomLevel: 14,
    centerCoordinate: [123.19549, 13.62617], // Naga City coordinates
  });
  const [graph, setGraph] = useState<Graph>({ nodes: new Map(), edges: new Map() });
  const [nodesFetched, setNodesFetched] = useState(false);
  const [edgesFetched, setEdgesFetched] = useState(false);
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [showVisitedNodes, setShowVisitedNodes] = useState(true);

  const stableOnError = useCallback((error: string) => {
    onError(error);
  }, [onError]);

  useEffect(() => {
    const loadNodes = () => {
      const nodesMap = new Map<string, Node>();

      if (!nodesGeoJSON || !Array.isArray(nodesGeoJSON.features)) {
        stableOnError('Invalid nodesGeoJSON: No features array found.');
        return;
      }

      for (const feature of nodesGeoJSON.features) {
        if (feature.properties.osmid && feature.geometry.type === 'Point') {
          const osmid = feature.properties.osmid.toString();
          const [lng, lat] = feature.geometry.coordinates;
          nodesMap.set(osmid, { osmid, lat, lng });
        } else {
          console.warn('Skipping invalid node:', feature);
        }
      }

      if (nodesMap.size === 0) {
        stableOnError('No valid nodes found in nodesGeoJSON.');
        return;
      }

      setGraph((prev) => {
        if (areMapsEqual(prev.nodes, nodesMap)) {
          return prev;
        }
        console.log(`Loaded ${nodesMap.size} nodes from nodesGeoJSON`);
        return { ...prev, nodes: nodesMap };
      });
      setNodesFetched(true);
    };

    loadNodes();
  }, []);

  useEffect(() => {
    if (!nodesFetched) return;

    const loadEdges = () => {
      const edgesMap = new Map<string, Edge[]>();

      if (!edgesGeoJSON || !Array.isArray(edgesGeoJSON.features)) {
        stableOnError('Invalid edgesGeoJSON: No features array found.');
        return;
      }

      let totalEdges = 0;
      for (const feature of edgesGeoJSON.features) {
        const props = feature.properties || {};
        const { u, v, length } = props;
        if (u && v && length !== undefined && u !== v) {
          const source = u.toString();
          const target = v.toString();
          const weight = parseFloat(length);

          if (isNaN(weight)) {
            console.warn(`Invalid length for edge ${u}-${v}: ${length}`);
            continue;
          }

          if (weight <= 0) {
            console.warn(`Skipping edge ${u}-${v} with non-positive weight: ${weight}`);
            continue;
          }

          if (graph.nodes.has(source) && graph.nodes.has(target)) {
            if (!edgesMap.has(source)) edgesMap.set(source, []);
            edgesMap.get(source)!.push({ source, target, weight });
            totalEdges++;

            if (!edgesMap.has(target)) edgesMap.set(target, []);
            edgesMap.get(target)!.push({ source: target, target: source, weight });
            totalEdges++;
          } else {
            console.warn(`Edge ${u}-${v} references invalid nodes. Skipping.`);
          }
        } else {
          console.warn('Skipping edge with missing properties or self-loop:', props);
        }
      }

      if (edgesMap.size === 0) {
        stableOnError('No valid edges found in edgesGeoJSON.');
        return;
      }

      console.log(`Loaded ${edgesMap.size} edge sets and ${totalEdges} total edges from edgesGeoJSON`);
      setGraph((prev) => {
        if (areMapsEqual(prev.edges, edgesMap)) {
          return prev;
        }
        return { ...prev, edges: edgesMap };
      });
      setEdgesFetched(true);
    };

    loadEdges();
  }, [nodesFetched, graph.nodes]);

  const stableGraph = useMemo(() => graph, [graph.nodes.size, graph.edges.size]);

  useEffect(() => {
    if (nodesFetched && edgesFetched) {
      console.log(`Graph updated: ${stableGraph.nodes.size} nodes, ${stableGraph.edges.size} edge sets`);
      onGraphUpdate(stableGraph);
    }
  }, [nodesFetched, edgesFetched, stableGraph, onGraphUpdate]);

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

      setCamera({
        zoomLevel: newZoom,
        centerCoordinate: [centerLng, centerLat],
      });
    }
  }, [startPoint, endPoint]);

  useEffect(() => {
    console.log('MapView received pathResult:', pathResult);
    if (pathResult?.visitedNodes && pathResult.visitedNodes.length > 0) {
      const visitedIds: string[] = [];
      const unmatchedNodes: number[][] = [];
      pathResult.visitedNodes.forEach(([lng, lat], index) => {
        let matched = false;
        for (const [osmid, node] of graph.nodes.entries()) {
          if (Math.abs(node.lng - lng) < 0.00001 && Math.abs(node.lat - lat) < 0.00001) {
            visitedIds.push(osmid);
            matched = true;
            break;
          }
        }
        if (!matched) {
          unmatchedNodes.push([lng, lat]);
        }
      });
      setVisitedNodeIds(visitedIds);
      console.log(`Visited Nodes Mapping:`);
      console.log(`- Total visited nodes from pathResult: ${pathResult.visitedNodes.length}`);
      console.log(`- Successfully mapped to osmids: ${visitedIds.length}`);
      console.log(`- Unmatched nodes: ${unmatchedNodes.length}`);
      if (unmatchedNodes.length > 0) {
        console.log(`- First few unmatched nodes:`, unmatchedNodes.slice(0, 5));
      }
      console.log(`- First few visited osmids:`, visitedIds.slice(0, 5));
    } else {
      setVisitedNodeIds([]);
      console.log(`Visited Nodes Mapping: No visited nodes to map.`);
      if (pathResult) {
        console.log('pathResult details:', pathResult);
      }
    }
  }, [pathResult, graph.nodes]);

  const getPathColor = (algorithm: string) => {
    const color = {
      dijkstra: '#FF9800', // Orange
      'a-star': '#4CAF50', // Green
      bfs: '#FF00FF', // Magenta
      'bellman-ford': '#00FFFF', // Cyan
    }[algorithm] || '#2196F3'; // Default blue
    return validateColor(color);
  };

  const handleFeaturePress = (event: any, source: 'nodes' | 'edges') => {
    if (!event?.features?.length) {
      stableOnError(`No ${source} found at this location.`);
      return;
    }

    const feature = event.features[0];

    if (source === 'nodes' && feature?.geometry?.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates;
      if (selectionMode === 'start') {
        onPointSelected('start', { lat, lng });
      } else if (selectionMode === 'end') {
        onPointSelected('end', { lat, lng });
      }
    } else if (source === 'edges') {
      const sourceProp = feature.properties.u;
      const targetProp = feature.properties.v;
      if (!sourceProp || !targetProp) {
        stableOnError('Selected edge is missing node information.');
        return;
      }

      const sourceNode = graph.nodes.get(sourceProp.toString());
      const targetNode = graph.nodes.get(targetProp.toString());
      if (!sourceNode || !targetNode) {
        stableOnError('Selected edge references invalid nodes.');
        return;
      }

      const edgeCoordinates = [
        [sourceNode.lng, sourceNode.lat],
        [targetNode.lng, targetNode.lat],
      ];

      const tapPoint = { lat: event.coordinates.latitude, lng: event.coordinates.longitude };
      const sourceDistance = Math.sqrt(
        Math.pow(sourceNode.lng - tapPoint.lng, 2) + Math.pow(sourceNode.lat - tapPoint.lat, 2)
      );
      const targetDistance = Math.sqrt(
        Math.pow(targetNode.lng - tapPoint.lng, 2) + Math.pow(targetNode.lat - tapPoint.lat, 2)
      );

      const nearest = sourceDistance < targetDistance ? sourceNode : targetNode;
      const lng = nearest.lng;
      const lat = nearest.lat;

      if (selectionMode === 'start') {
        onPointSelected('start', { lat, lng }, edgeCoordinates);
      } else if (selectionMode === 'end') {
        onPointSelected('end', { lat, lng }, edgeCoordinates);
      }
    }
  };

  const onTapMapHandler = (event: any) => {
    onTapMap(event);
  };

  useEffect(() => {
    if (pathResult && pathResult.coordinates) {
      pathResult.coordinates.forEach((coord, index) => {
        if (!Array.isArray(coord) || coord.length !== 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
          stableOnError(`Invalid path coordinate at index ${index}.`);
        }
      });
    }
  }, [pathResult, stableOnError]);

  const circleRadius = visitedNodeIds.length > 0
  ? [
    'match',
    ['get', 'osmid'],
    ...visitedNodeIds.flatMap((id) => [id, selectionMode === 'none' ? 5 : 10]),
    selectionMode === 'none' ? 3 : 8,
  ]
  : selectionMode === 'none' ? 3 : 8;

  const circleColor = showVisitedNodes && visitedNodeIds.length > 0
  ? [
    'match',
    ['get', 'osmid'],
    ...visitedNodeIds.flatMap((id) => [id, validateColor('#FFFF00')]),
    validateColor(
      selectionMode === 'none' ? '#2196F3' : selectionMode === 'start' ? '#4CAF50' : '#F44336'
    ),
  ]
  : validateColor(
    selectionMode === 'none' ? '#2196F3' : selectionMode === 'start' ? '#4CAF50' : '#F44336'
  );

  return (
    <View style={StyleSheet.absoluteFill}>
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
      circleRadius,
      circleStrokeWidth: selectionMode === 'none' ? 1 : 2,
      circleStrokeColor: '#fff',
      visibility: 'visible',
      circleColor,
    }}
    minZoomLevel={10}
    filter={['==', ['geometry-type'], 'Point']}
    hitbox={{ width: 30, height: 30 }}
    />
    </MapboxGL.ShapeSource>

    <MapboxGL.ShapeSource
    id="edges"
    shape={edgesGeoJSON}
    onPress={(event) => handleFeaturePress(event, 'edges')}
    >
    <MapboxGL.LineLayer
    id="edges-layer"
    style={{
      lineColor: validateColor(selectionMode === 'none' ? '#1976D2' : selectionMode === 'start' ? '#4CAF50' : '#F44336'),
          lineWidth: selectionMode === 'none' ? 2 : 4,
          visibility: 'visible',
    }}
    minZoomLevel={10}
    hitbox={{ width: 20, height: 20 }}
    />
    </MapboxGL.ShapeSource>

    {pathResult && pathResult.coordinates && pathResult.coordinates.length > 0 && (
      <MapboxGL.ShapeSource
      id="pathSource"
      shape={{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: pathResult.coordinates,
        },
      }}
      >
      <MapboxGL.LineLayer
      id="pathLayer"
      style={{
        lineColor: getPathColor(pathResult.algorithm),
                                                                                   lineWidth: 4,
                                                                                   lineCap: 'round',
                                                                                   lineJoin: 'round',
                                                                                   visibility: 'visible',
                                                                                   lineOpacity: 1.0,
      }}
      aboveLayerID="edges-layer"
      onError={(error: any) => stableOnError('Failed to render path layer.')}
      />
      </MapboxGL.ShapeSource>
    )}

    {startPoint && (
      <MapboxGL.PointAnnotation id="startPoint" coordinate={[startPoint.lng, startPoint.lat]} title="Start">
      <View style={[styles.mapMarker, styles.startMarker]}>
      <Text style={styles.markerText}>S</Text>
      </View>
      </MapboxGL.PointAnnotation>
    )}

    {endPoint && (
      <MapboxGL.PointAnnotation id="endPoint" coordinate={[endPoint.lng, endPoint.lat]} title="End">
      <View style={[styles.mapMarker, styles.endMarker]}>
      <Text style={styles.markerText}>E</Text>
      </View>
      </MapboxGL.PointAnnotation>
    )}

    {selectionMode !== 'none' && (
      <View style={styles.selectionIndicator}>
      <Text style={styles.selectionText}>
      {selectionMode === 'start' ? 'Select start point' : 'Select end point'}
      </Text>
      </View>
    )}
    </MapboxGL.MapView>

    {pathResult?.visitedNodes && pathResult.visitedNodes.length > 0 && (
      <View style={styles.toggleContainer}>
      <Text style={styles.toggleText}>Show Visited Nodes</Text>
      <Switch
      value={showVisitedNodes}
      onValueChange={(value) => setShowVisitedNodes(value)}
      thumbColor={showVisitedNodes ? '#2196F3' : '#ccc'}
      trackColor={{ false: '#767577', true: '#81b0ff' }}
      />
      </View>
    )}
    </View>
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
  toggleContainer: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
                                 padding: 10,
                                 borderRadius: 10,
                                 flexDirection: 'row',
                                 alignItems: 'center',
  },
  toggleText: {
    marginRight: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MapView;
