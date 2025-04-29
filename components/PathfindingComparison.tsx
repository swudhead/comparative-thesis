import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView from './MapView';
import ControlPanel from './ControlPanel';
import Toolbar from './Toolbar';
import AlgorithmInfoModal from './AlgorithmInfoModal';
import StatusIndicators from './StatusIndicators';
import { algorithm, algorithmColors } from '../utils/algorithms';

type PathResult = {
  coordinates: number[][];
  algorithm: string;
  time: string;
  distance: string;
  nodes: number;
};

const PathfindingComparison = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<algorithm | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [algorithmInfo, setAlgorithmInfo] = useState<algorithm | null>(null);
  const [startPoint, setStartPoint] = useState<{lat: number, lng: number} | null>(null);
  const [endPoint, setEndPoint] = useState<{lat: number, lng: number} | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<Record<string, { time: string, distance: string, nodes: number }> | null>(null);

  // Handle algorithm selection
  const handleAlgorithmSelect = (algorithm: algorithm) => {
    setSelectedAlgorithm(algorithm);
    console.log(`Selected algorithm: ${algorithm.name}`);
  };

  // Open algorithm info modal
  const handleOpenAlgorithmInfo = (algorithm: algorithm) => {
    setAlgorithmInfo(algorithm);
    setModalVisible(true);
  };

  // Handle start and end point selection
  const handlePointSelection = (pointType: 'start' | 'end', coordinates: {lat: number, lng: number}) => {
    if (pointType === 'start') {
      setStartPoint(coordinates);
    } else {
      setEndPoint(coordinates);
    }
  };

  // Mock function to simulate algorithm computation
  const runPathfindingSimulation = () => {
    if (!selectedAlgorithm || !startPoint || !endPoint) return;
    
    setIsComputing(true);

    // Simulate computation delay
    setTimeout(() => {
      // Generate path coordinates between start and end points
      const generatePath = (start: {lat: number, lng: number}, end: {lat: number, lng: number}, count = 10) => {
        const path = [];
        const latStep = (end.lat - start.lat) / count;
        const lngStep = (end.lng - start.lng) / count;
        
        for (let i = 0; i <= count; i++) {
          // Add some randomness to make it look more realistic
          const jitter = i > 0 && i < count ? (Math.random() - 0.5) * 0.0005 : 0;
          path.push([
            start.lng + lngStep * i + jitter, 
            start.lat + latStep * i + jitter
          ]);
        }
        return path;
      };

      const mockResults = {
        'dijkstra': { time: '1.45s', distance: '2.3km', nodes: 142 },
        'a-star': { time: '0.82s', distance: '2.4km', nodes: 87 },
        'd-star': { time: '2.31s', distance: '2.3km', nodes: 142 },
        'd-star-lite': { time: '3.27s', distance: '2.3km', nodes: 142 }
      };
      
      setComparisonResults(mockResults);
      
      // Create path result for the selected algorithm
      setPathResult({
        coordinates: generatePath(startPoint, endPoint),
        algorithm: selectedAlgorithm.id,
        time: mockResults[selectedAlgorithm.id].time,
        distance: mockResults[selectedAlgorithm.id].distance,
        nodes: mockResults[selectedAlgorithm.id].nodes
      });
      
      setIsComputing(false);
    }, 2000);
  };

  // Handle start pathfinding action
  const handleStartPathfinding = () => {
    if (!selectedAlgorithm || !startPoint || !endPoint) {
      setErrorMsg('Please select both start and end points and an algorithm.');
      return;
    }
    
    setErrorMsg(null);
    runPathfindingSimulation();
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
      {/* MapView Component */}
      <MapView
        onMapLoaded={() => setMapLoaded(true)}
        onError={(error) => setErrorMsg(error)}
        startPoint={startPoint}
        endPoint={endPoint}
        pathResult={pathResult}
        onPointSelected={handlePointSelection}
      />

      {/* Toolbar Component */}
      <Toolbar title="Naga City Transportation Network" />

      {/* Control Panel Component */}
      <ControlPanel
        mapLoaded={mapLoaded}
        selectedAlgorithm={selectedAlgorithm}
        startPoint={startPoint}
        endPoint={endPoint}
        isComputing={isComputing}
        comparisonResults={comparisonResults ? comparisonResults[selectedAlgorithm?.id || ''] : null}
        onAlgorithmSelect={handleAlgorithmSelect}
        onAlgorithmInfo={handleOpenAlgorithmInfo}
        onStartPointSet={() => handlePointSelection('start', { lat: 13.62617, lng: 123.19549 })}
        onEndPointSet={() => handlePointSelection('end', { lat: 13.63617, lng: 123.20549 })}
        onStartPathfinding={handleStartPathfinding}
      />

      {/* Algorithm Info Modal */}
      <AlgorithmInfoModal
        visible={modalVisible}
        algorithm={algorithmInfo}
        onClose={() => setModalVisible(false)}
      />

      {/* Status Indicators */}
      <StatusIndicators
        mapLoaded={mapLoaded}
        errorMsg={errorMsg}
        selectedAlgorithm={selectedAlgorithm}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default PathfindingComparison;