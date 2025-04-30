import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

// Set access token
MapboxGL.setAccessToken('pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXd1cWNnajA5ZDQybHNnaHcycjlkbjUifQ.oCwTlpov4vnih1yvkqLrZA');

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
  onPointSelected: (pointType: 'start' | 'end', coordinates: { lat: number; lng: number }) => void;
  selectionMode: 'start' | 'end' | 'none';
  onTapMap: (event: any) => void;
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
}) => {
  const [camera, setCamera] = useState({
    zoomLevel: 14,
    centerCoordinate: [123.19549, 13.62617], // Naga City coordinates
  });

  // State to cache node data for edge snapping
  const [nodes, setNodes] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const [nodesFetched, setNodesFetched] = useState(false); // Track if nodes have been fetched

  // Memoize onError to prevent unnecessary re-renders
  const stableOnError = useCallback((error: string) => {
    onError(error);
  }, [onError]);

  // Fetch nodes for edge snapping (run once on mount)
  useEffect(() => {
    if (nodesFetched) {
      console.log('Nodes already fetched, skipping fetch.');
      return;
    }

    const fetchNodes = async () => {
      const accessToken = 'pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXd1cWNnajA5ZDQybHNnaHcycjlkbjUifQ.oCwTlpov4vnih1yvkqLrZA';
      const nodeTileset = 'kazkee.04ydv29e';
      const radius = 15000;
      const centerLng = 123.19549;
      const centerLat = 13.62617;

      const nodesMap = new Map<string, { lat: number; lng: number }>();
      const queryPoints = [{ lng: centerLng, lat: centerLat }];

      for (const point of queryPoints) {
        const nodeUrl = `https://api.mapbox.com/v4/${nodeTileset}/tilequery/${point.lng},${point.lat}.json?radius=${radius}&layers=naga_nodes_for_mapbox-dkbn5x&access_token=${accessToken}`;
        try {
          const response = await fetch(nodeUrl);
          const data = await response.json();

          if (!response.ok) {
            console.error('Failed to fetch nodes:', data.message || response.statusText);
            continue;
          }

          if (!data.features || data.features.length === 0) {
            console.log('No nodes found at this location.');
            continue;
          }

          for (const feature of data.features) {
            if (feature.properties.osmid && feature.geometry.type === 'Point') {
              const osmid = feature.properties.osmid.toString();
              if (!nodesMap.has(osmid)) {
                const [lng, lat] = feature.geometry.coordinates;
                nodesMap.set(osmid, { lat, lng });
                console.log(`Added node ${osmid}:`, { lat, lng });
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch nodes for edge snapping:', error);
        }
      }

      if (nodesMap.size === 0) {
        stableOnError('No nodes found in the area. Please try a different location.');
      }

      setNodes(nodesMap);
      setNodesFetched(true); // Mark nodes as fetched
    };

    fetchNodes();
  }, [stableOnError, nodesFetched]);

  // Update camera when points are selected
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

  // Get color for path based on algorithm
  const getPathColor = (algorithm: string) => {
    switch (algorithm) {
      case 'dijkstra':
        return '#FF9800';
      case 'a-star':
        return '#4CAF50';
      case 'd-star':
        return '#9C27B0';
      case 'd-star-lite':
        return '#2196F3';
      default:
        return '#2196F3';
    }
  };

  // Handle feature selection (nodes or edges)
  const handleFeaturePress = (event: any, source: 'nodes' | 'edges') => {
    console.log(`${source} press event:`, JSON.stringify(event, null, 2));
    if (!event?.features?.length) {
      console.log(`No features found in ${source} press event`);
      stableOnError(`No ${source} found at this location. Please select a different point.`);
      return;
    }

    const feature = event.features[0];
    let lng: number, lat: number;

    if (source === 'nodes' && feature?.geometry?.type === 'Point' && feature.geometry.coordinates) {
      [lng, lat] = feature.geometry.coordinates;
    } else if (source === 'edges') {
      const sourceProp = feature.properties.u || feature.properties.source || feature.properties.Source || feature.properties.from || feature.properties.From;
      const targetProp = feature.properties.v || feature.properties.target || feature.properties.Target || feature.properties.to || feature.properties.To;

      if (!sourceProp || !targetProp) {
        console.log('Edge missing u/v properties:', feature.properties);
        stableOnError('Selected edge is missing node information. Please select a different edge or node.');
        return;
      }

      const sourceNode = nodes.get(sourceProp.toString());
      const targetNode = nodes.get(targetProp.toString());

      if (!sourceNode || !targetNode) {
        console.log('Edge nodes not found - source:', sourceProp, 'target:', targetProp);
        stableOnError('Selected edge references nodes that are not available. Please select a different edge or node.');
        return;
      }

      const tapPoint = { lat: event.coordinates.latitude, lng: event.coordinates.longitude };
      const sourceDistance = Math.sqrt(
        Math.pow(sourceNode.lng - tapPoint.lng, 2) + Math.pow(sourceNode.lat - tapPoint.lat, 2)
      );
      const targetDistance = Math.sqrt(
        Math.pow(targetNode.lng - tapPoint.lng, 2) + Math.pow(targetNode.lat - tapPoint.lat, 2)
      );

      const nearest = sourceDistance < targetDistance ? sourceNode : targetNode;
      lng = nearest.lng;
      lat = nearest.lat;
    } else {
      console.log(`Invalid feature or coordinates in ${source} press event`);
      stableOnError('Invalid feature selected. Please select a different edge or node.');
      return;
    }

    console.log(`Feature selected from ${source}: lat=${lat}, lng=${lng}, selectionMode=${selectionMode}`);

    if (selectionMode === 'start') {
      onPointSelected('start', { lat, lng });
    } else if (selectionMode === 'end') {
      onPointSelected('end', { lat, lng });
    } else {
      console.log(`Feature tapped from ${source} but not in selection mode`);
    }
  };

  // Handle map taps
  const onTapMapHandler = (event: any) => {
    console.log("Map tapped in MapView:", JSON.stringify(event, null, 2));
    onTapMap(event);
  };

  useEffect(() => {
    console.log("Path result updated:", pathResult);
    if (pathResult && pathResult.coordinates) {
      console.log("Path coordinates to render:", pathResult.coordinates);
    }
    if (pathResult && pathResult.visitedNodes) {
      console.log("Visited nodes to render:", pathResult.visitedNodes);
    }
  }, [pathResult]);

  return (
    <MapboxGL.MapView
    style={StyleSheet.absoluteFill}
    styleURL={MapboxGL.StyleURL.Street}
    onDidFailLoadingMap={(error) => {
      console.error("Map failed to load:", error);
      stableOnError(`Map failed to load: ${error.message}`);
    }}
    onDidFinishLoadingMap={() => {
      console.log("Map loaded successfully");
      onMapLoaded();
    }}
    onDidFinishRenderingMapFully={() => console.log("Map fully rendered")}
    logoEnabled={true}
    attributionEnabled={true}
    compassEnabled={true}
    onPress={(event) => {
      console.log("MapView onPress:", JSON.stringify(event, null, 2));
      onTapMapHandler(event);
    }}
    >
    <MapboxGL.Camera
    zoomLevel={camera.zoomLevel}
    centerCoordinate={camera.centerCoordinate}
    animationDuration={500}
    />

    {/* Edge tileset */}
    <MapboxGL.VectorSource
    id="edges"
    url="mapbox://kazkee.70pt2eky"
    onPress={(event) => handleFeaturePress(event, 'edges')}
    >
    <MapboxGL.LineLayer
    id="edges-layer"
    sourceLayerID="naga_edges_for_mapbox-5b6ynz"
    style={{
      lineColor: selectionMode === 'none' ? '#1976D2' : selectionMode === 'start' ? '#4CAF50' : '#F44336',
      lineWidth: selectionMode === 'none' ? 2 : 4,
      visibility: 'visible',
    }}
    minZoomLevel={10}
    hitbox={{ width: 20, height: 20 }}
    onPress={(event) => handleFeaturePress(event, 'edges')}
    />
    </MapboxGL.VectorSource>

    {/* Node tileset */}
    <MapboxGL.VectorSource
    id="nodes"
    url="mapbox://kazkee.04ydv29e"
    onPress={(event) => handleFeaturePress(event, 'nodes')}
    >
    <MapboxGL.CircleLayer
    id="nodes-layer"
    sourceLayerID="naga_nodes_for_mapbox-dkbn5x"
    style={{
      circleColor: selectionMode === 'none' ? '#2196F3' : selectionMode === 'start' ? '#4CAF50' : '#F44336',
      circleRadius: selectionMode === 'none' ? 3 : 8,
      circleStrokeWidth: selectionMode === 'none' ? 1 : 2,
      circleStrokeColor: '#fff',
      visibility: 'visible',
    }}
    minZoomLevel={10}
    filter={['==', ['geometry-type'], 'Point']}
    hitbox={{ width: 30, height: 30 }}
    onPress={(event) => handleFeaturePress(event, 'nodes')}
    />
    </MapboxGL.VectorSource>

    {/* Visited nodes layer */}
    {pathResult?.visitedNodes && pathResult.visitedNodes.length > 0 && (
      <MapboxGL.ShapeSource
      id="visitedNodesSource"
      shape={{
        type: 'FeatureCollection',
        features: pathResult.visitedNodes.map((coord, index) => {
          console.log(`Rendering visited node ${index}:`, coord);
          return {
            type: 'Feature',
            properties: { id: index },
            geometry: {
              type: 'Point',
              coordinates: coord,
            },
          };
        }),
      }}
      >
      <MapboxGL.CircleLayer
      id="visitedNodesLayer"
      style={{
        circleColor: '#888888',
        circleRadius: 4,
        circleOpacity: 0.6,
        circleStrokeWidth: 1,
        circleStrokeColor: '#fff',
        visibility: 'visible',
      }}
      minZoomLevel={10}
      />
      </MapboxGL.ShapeSource>
    )}

    {/* Path layer */}
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
                                                                                   visibility: 'visible', // Ensure visibility
      }}
      />
      </MapboxGL.ShapeSource>
    )}

    {/* Start point marker */}
    {startPoint && (
      <MapboxGL.PointAnnotation id="startPoint" coordinate={[startPoint.lng, startPoint.lat]} title="Start">
      <View style={[styles.mapMarker, styles.startMarker]}>
      <Text style={styles.markerText}>S</Text>
      </View>
      </MapboxGL.PointAnnotation>
    )}

    {/* End point marker */}
    {endPoint && (
      <MapboxGL.PointAnnotation id="endPoint" coordinate={[endPoint.lng, endPoint.lat]} title="End">
      <View style={[styles.mapMarker, styles.endMarker]}>
      <Text style={styles.markerText}>E</Text>
      </View>
      </MapboxGL.PointAnnotation>
    )}

    {/* Selection mode indicator */}
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
});

export default MapView;
