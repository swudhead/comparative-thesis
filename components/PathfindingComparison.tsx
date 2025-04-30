import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView from './MapView';
import ControlPanel from './ControlPanel';
import Toolbar from './Toolbar';
import AlgorithmInfoModal from './AlgorithmInfoModal';
import StatusIndicators from './StatusIndicators';
import { algorithm, dijkstraPathfinding, getPerformanceMetrics } from '../utils/algorithms';

type PathResult = {
  coordinates: number[][];
  algorithm: string;
  time: string;
  distance: string;
  nodes: number;
  visitedNodes?: number[][];
};

const PathfindingComparison = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<algorithm | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [algorithmInfo, setAlgorithmInfo] = useState<algorithm | null>(null);
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<
  Record<string, { time: string; distance: string; nodes: number }> | null
  >(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | 'none'>('none');

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

  // Reset path and comparison results when selection changes
  useEffect(() => {
    if (pathResult) {
      setPathResult(null);
      setComparisonResults(null);
    }
  }, [startPoint, endPoint, selectedAlgorithm]);

  // Handle point selection mode toggle
  const toggleSelectionMode = (mode: 'start' | 'end') => {
    if (selectionMode === mode) {
      console.log(`Cancelling ${mode} selection mode`);
      setSelectionMode('none');
    } else {
      console.log(`Entering ${mode} selection mode`);
      setSelectionMode(mode);
    }
  };

  // Handle tap on map (no cancellation)
  const handleMapTap = (event: any) => {
    console.log("Map tapped in PathfindingComparison:", JSON.stringify(event, null, 2));
    // Do nothing to prevent cancelling selection mode
  };

  // Handle point selection
  const handlePointSelection = (pointType: 'start' | 'end', coordinates: { lat: number; lng: number }) => {
    console.log(`Selected ${pointType} point:`, coordinates);
    if (pointType === 'start') {
      setStartPoint(coordinates);
      Alert.alert('Success', `Start point set at (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})`);
    } else {
      setEndPoint(coordinates);
      Alert.alert('Success', `End point set at (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})`);
    }
    setSelectionMode('none');
  };

  // Clear selected points
  const clearPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setPathResult(null);
    setComparisonResults(null);
  };

  // Function to fetch directions using Dijkstra's algorithm
  const fetchDirections = useCallback(async () => {
    if (!selectedAlgorithm || !startPoint || !endPoint) return;

    setIsComputing(true);
    setErrorMsg(null);

    try {
      console.log('Fetching directions with:', {
        algorithm: selectedAlgorithm.id,
        origin: [startPoint.lng, startPoint.lat],
        destination: [endPoint.lng, endPoint.lat],
      });

      let pathResult: PathResult;
      if (selectedAlgorithm.id === 'dijkstra') {
        // Use Dijkstra's algorithm
        const result = await dijkstraPathfinding(
          { lat: startPoint.lat, lng: startPoint.lng },
          { lat: endPoint.lat, lng: endPoint.lng }
        );
        pathResult = {
          coordinates: result.path,
          algorithm: selectedAlgorithm.id,
          time: `${(result.time / 1000).toFixed(2)}s`, // Convert ms to seconds
                                      distance: `${(result.distance / 1000).toFixed(1)}km`, // Convert meters to km
                                      nodes: result.nodesVisited,
                                      visitedNodes: result.visitedNodes,
        };
      } else {
        // Mock straight-line path for other algorithms
        const distance = Math.sqrt(
          Math.pow(endPoint.lng - startPoint.lng, 2) +
          Math.pow(endPoint.lat - startPoint.lat, 2)
        ) * 111000; // Approximate meters
        const mockPath = Array(10)
        .fill(0)
        .map((_, i) => {
          const t = i / 9;
          return [
            startPoint.lng + t * (endPoint.lng - startPoint.lng),
             startPoint.lat + t * (endPoint.lat - startPoint.lat),
          ];
        });
        pathResult = {
          coordinates: mockPath,
          algorithm: selectedAlgorithm.id,
          time: `${(distance / 100000 + Math.random() * 0.5).toFixed(2)}s`,
                                      distance: `${(distance / 1000).toFixed(1)}km`,
                                      nodes: Math.floor(50 + Math.random() * 50),
                                      visitedNodes: [],
        };
      }

      console.log("Setting path result:", pathResult);
      setPathResult(pathResult);

      // Generate comparison results
      const distance = parseFloat(pathResult.distance);
      setComparisonResults({
        dijkstra: {
          time: pathResult.algorithm === 'dijkstra' ? pathResult.time : `${(distance / 100000 + 0.6).toFixed(2)}s`,
                           distance: `${distance.toFixed(1)}km`,
                           nodes: pathResult.algorithm === 'dijkstra' ? pathResult.nodes : Math.floor(120 + Math.random() * 40),
        },
        'a-star': getPerformanceMetrics('a-star', distance),
                           'd-star': getPerformanceMetrics('d-star', distance),
                           'd-star-lite': getPerformanceMetrics('d-star-lite', distance),
      });

      setIsComputing(false);
    } catch (error: any) {
      setErrorMsg(`Error fetching directions: ${error.message || 'Unknown error'}`);
      setIsComputing(false);
    }
  }, [selectedAlgorithm, startPoint, endPoint]);

  // Handle start pathfinding action
  const handleStartPathfinding = () => {
    if (!selectedAlgorithm) {
      setErrorMsg('Please select an algorithm.');
      return;
    }

    if (!startPoint || !endPoint) {
      setErrorMsg('Please select both start and end points.');
      return;
    }

    fetchDirections();
  };

  // Handle swap points
  const handleSwapPoints = () => {
    if (startPoint && endPoint) {
      const temp = startPoint;
      setStartPoint(endPoint);
      setEndPoint(temp);
    }
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
    selectionMode={selectionMode}
    onTapMap={handleMapTap}
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
    comparisonResults={comparisonResults}
    onAlgorithmSelect={handleAlgorithmSelect}
    onAlgorithmInfo={handleOpenAlgorithmInfo}
    onStartPathfinding={handleStartPathfinding}
    onSelectStartPoint={() => toggleSelectionMode('start')}
    onSelectEndPoint={() => toggleSelectionMode('end')}
    onClearPoints={clearPoints}
    onSwapPoints={handleSwapPoints}
    selectionMode={selectionMode}
    />

    {/* Algorithm Info Modal */}
    <AlgorithmInfoModal visible={modalVisible} algorithm={algorithmInfo} onClose={() => setModalVisible(false)} />

    {/* Status Indicators */}
    <StatusIndicators mapLoaded={mapLoaded} errorMsg={errorMsg} selectedAlgorithm={selectedAlgorithm} />

    <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default PathfindingComparison;
