import React, { useState, useRef } from 'react';
import { View, Text, SafeAreaView, Button, StyleSheet, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import axios from 'axios';

MapboxGL.setAccessToken('sk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXdkMnMyZjBybWIybXM5enRsdjl1dGQifQ.LkJ0GLCo5X8TAgpEiPJSMg');

const MapScreen = () => {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [mode, setMode] = useState(null); // 'start' or 'end'
  const mapRef = useRef(null);

  const bounds = {
    ne: [123.2212, 13.6535],
    sw: [123.1456, 13.5904]
  };

  const handleMapPress = async (e) => {
    const coords = e.geometry.coordinates;
    if (mode === 'start') {
      setStartPoint(coords);
    } else if (mode === 'end') {
      setEndPoint(coords);
    }
  };

  const fetchRoute = async () => {
    if (!startPoint || !endPoint) {
      Alert.alert('Missing Points', 'Set both start and end points.');
      return;
    }

    try {
      const res = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${startPoint[0]},${startPoint[1]};${endPoint[0]},${endPoint[1]}?geometries=geojson&access_token=${MapboxGL.accessToken}`
      );
      const coords = res.data.routes[0].geometry.coordinates;
      setRouteCoords(coords);
    } catch (err) {
      console.error('Route error:', err);
      Alert.alert('Route Error', 'Could not calculate route.');
    }
  };

  const resetMap = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRouteCoords([]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <MapboxGL.MapView
    ref={mapRef}
    style={styles.map}
    styleURL="mapbox://styles/kazkee/cm9tf7d3l00e201sp8ja63cb7"
    onPress={handleMapPress}
    onDidFinishRenderingMapFully={() => {
      mapRef.current?.fitBounds(bounds.sw, bounds.ne, 0, 50);
    }}
    >
    <MapboxGL.Camera
    centerCoordinate={[123.19549, 13.62617]}
    zoomLevel={13.3}
    maxZoomLevel={16}
    minZoomLevel={11}
    bounds={{ ne: bounds.ne, sw: bounds.sw }}
    />

    {/* Start Marker */}
    {startPoint && (
      <MapboxGL.PointAnnotation id="start" coordinate={startPoint}>
      <View style={styles.markerGreen} />
      </MapboxGL.PointAnnotation>
    )}

    {/* End Marker */}
    {endPoint && (
      <MapboxGL.PointAnnotation id="end" coordinate={endPoint}>
      <View style={styles.markerRed} />
      </MapboxGL.PointAnnotation>
    )}

    {/* Route Line */}
    {routeCoords.length > 0 && (
      <MapboxGL.ShapeSource
      id="routeSource"
      shape={{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeCoords
        }
      }}
      >
      <MapboxGL.LineLayer
      id="routeLine"
      style={{
        lineColor: '#007cbf',
        lineWidth: 4
      }}
      />
      </MapboxGL.ShapeSource>
    )}
    </MapboxGL.MapView>

    {/* Controls */}
    <View style={styles.controls}>
    <Button title="Set Start Point" onPress={() => setMode('start')} />
    <Button title="Set End Point" onPress={() => setMode('end')} />
    <Button title="Find Route" onPress={fetchRoute} />
    <Button title="Reset" onPress={resetMap} />
    <Text style={styles.info}>
    {startPoint && `Start: ${startPoint[0].toFixed(4)}, ${startPoint[1].toFixed(4)}\n`}
    {endPoint && `End: ${endPoint[0].toFixed(4)}, ${endPoint[1].toFixed(4)}`}
    </Text>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    zIndex: 10
  },
  markerGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'green'
  },
  markerRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red'
  },
  info: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500'
  }
});

export default MapScreen;
