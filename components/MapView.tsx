import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

// Set access token
MapboxGL.setAccessToken('pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXd1cWNnajA5ZDQybHNnaHcycjlkbjUifQ.oCwTlpov4vnih1yvkqLrZA');

type MapViewProps = {
  onMapLoaded: () => void;
  onError: (error: string) => void;
  startPoint: {lat: number, lng: number} | null;
  endPoint: {lat: number, lng: number} | null;
  pathResult: {
    coordinates: number[][];
    algorithm: string;
  } | null;
  onPointSelected: (pointType: 'start' | 'end', coordinates: {lat: number, lng: number}) => void;
};

const MapView: React.FC<MapViewProps> = ({
  onMapLoaded,
  onError,
  startPoint,
  endPoint,
  pathResult,
  onPointSelected
}) => {
  const [selectedNodes, setSelectedNodes] = useState<number[][]>([]);

  // Get color for path based on algorithm
  const getPathColor = (algorithm: string) => {
    switch(algorithm) {
      case 'dijkstra': return '#FF9800';
      case 'a-star': return '#4CAF50';
      case 'd-star': return '#9C27B0';
      case 'd-star-lite': return '#2196F3';
      default: return '#2196F3';
    }
  };

  // Handle node selection on map
  const handleNodePress = (feature: any) => {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) return;
    
    const coordinates = feature.geometry.coordinates;
    const lat = coordinates[1];
    const lng = coordinates[0];
    
    // If we don't have a start point yet, set it
    if (!startPoint) {
      onPointSelected('start', { lat, lng });
    } 
    // If we don't have an end point yet, set it
    else if (!endPoint) {
      onPointSelected('end', { lat, lng });
    }
    // If we have both, update start and clear end
    else {
      onPointSelected('start', { lat, lng });
      onPointSelected('end', null);
    }
  };

  return (
    <MapboxGL.MapView
      style={StyleSheet.absoluteFill}
      styleURL={MapboxGL.StyleURL.Street}
      onDidFailLoadingMap={(error) => onError(`Map failed to load: ${error.message}`)}
      onDidFinishLoadingMap={() => onMapLoaded()}
      onDidFinishRenderingMapFully={() => console.log("Map fully rendered")}
      logoEnabled={true}
      attributionEnabled={true}
      compassEnabled={true}
    >
      <MapboxGL.Camera
        zoomLevel={14}
        centerCoordinate={[123.19549, 13.62617]}
        animationDuration={0}
      />

      {/* Edge tileset */}
      <MapboxGL.VectorSource
        id="edges"
        url="mapbox://kazkee.70pt2eky"
      >
        <MapboxGL.LineLayer
          id="edges-layer"
          sourceLayerID="naga_edges_for_mapbox-5b6ynz"
          style={{
            lineColor: '#1976D2',
            lineWidth: 2,
            visibility: 'visible',
          }}
          minZoomLevel={10}
        />
      </MapboxGL.VectorSource>

      {/* Node tileset */}
      <MapboxGL.VectorSource
        id="nodes"
        url="mapbox://kazkee.04ydv29e"
        onPress={handleNodePress}
      >
        <MapboxGL.CircleLayer
          id="nodes-layer"
          sourceLayerID="naga_nodes_for_mapbox-dkbn5x"
          style={{
            circleColor: '#2196F3',
            circleRadius: 3,
            circleStrokeWidth: 1,
            circleStrokeColor: '#fff',
            visibility: 'visible',
          }}
          minZoomLevel={10}
        />
      </MapboxGL.VectorSource>

      {/* Path layer - shown when path is calculated */}
      {pathResult && (
        <MapboxGL.ShapeSource
          id="pathSource"
          shape={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: pathResult.coordinates
            }
          }}
        >
          <MapboxGL.LineLayer
            id="pathLayer"
            style={{
              lineColor: getPathColor(pathResult.algorithm),
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapboxGL.ShapeSource>
      )}

      {/* Start point marker */}
      {startPoint && (
        <MapboxGL.PointAnnotation
          id="startPoint"
          coordinate={[startPoint.lng, startPoint.lat]}
          title="Start"
        >
          <View style={[styles.mapMarker, styles.startMarker]} />
        </MapboxGL.PointAnnotation>
      )}

      {/* End point marker */}
      {endPoint && (
        <MapboxGL.PointAnnotation
          id="endPoint"
          coordinate={[endPoint.lng, endPoint.lat]}
          title="End"
        >
          <View style={[styles.mapMarker, styles.endMarker]} />
        </MapboxGL.PointAnnotation>
      )}
    </MapboxGL.MapView>
  );
};

const styles = StyleSheet.create({
  mapMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  startMarker: {
    backgroundColor: '#4CAF50',
  },
  endMarker: {
    backgroundColor: '#F44336',
  },
});

export default MapView;