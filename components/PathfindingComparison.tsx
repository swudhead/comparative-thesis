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
  const [startEdge, setStartEdge] = useState<number[][] | null>(null);
  const [endEdge, setEndEdge] = useState<number[][] | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<
  Record<string, { time: string; distance: string; nodes: number }> | null
  >(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | 'none'>('none');

  const handleAlgorithmSelect = (algorithm: algorithm) => {
    setSelectedAlgorithm(algorithm);
    console.log(`Selected algorithm: ${algorithm.name}`);
  };

  const handleOpenAlgorithmInfo = (algorithm: algorithm) => {
    setAlgorithmInfo(algorithm);
    setModalVisible(true);
  };

  useEffect(() => {
    if (pathResult) {
      setPathResult(null);
      setComparisonResults(null);
    }
  }, [startPoint, endPoint, selectedAlgorithm]);

  const toggleSelectionMode = (mode: 'start' | 'end') => {
    if (selectionMode === mode) {
      console.log(`Cancelling ${mode} selection mode`);
      setSelectionMode('none');
    } else {
      console.log(`Entering ${mode} selection mode`);
      setSelectionMode(mode);
    }
  };

  const handleMapTap = (event: any) => {
    console.log('Map tapped in PathfindingComparison:', JSON.stringify(event, null, 2));
  };

  const handlePointSelection = (
    pointType: 'start' | 'end',
    coordinates: { lat: number; lng: number },
    edgeCoordinates?: number[][]
  ) => {
    console.log(`Selected ${pointType} point:`, coordinates);
    if (pointType === 'start') {
      setStartPoint(coordinates);
      setStartEdge(edgeCoordinates || null);
      Alert.alert('Success', `Start point set at (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})`);
    } else {
      setEndPoint(coordinates);
      setEndEdge(edgeCoordinates || null);
      Alert.alert('Success', `End point set at (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})`);
    }
    setSelectionMode('none');
  };

  const clearPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setStartEdge(null);
    setEndEdge(null);
    setPathResult(null);
    setComparisonResults(null);
  };

  const fetchDirections = useCallback(async () => {
    if (!startPoint || !endPoint) {
      setErrorMsg('Please select both start and end points.');
      return;
    }

    if (!selectedAlgorithm) {
      setErrorMsg('Please select an algorithm.');
      return;
    }

    setIsComputing(true);
    setErrorMsg(null);

    try {
      let pathResult: PathResult;

      // Handle edge-based pathfinding
      const useSelectedEdges = startEdge || endEdge;

      if (useSelectedEdges) {
        let coordinates: number[][] = [];

        if (startEdge && endEdge) {
          const startEdgeEnd = startEdge[1];
          const endEdgeStart = endEdge[0];

          if (startEdgeEnd[0] === endEdgeStart[0] && startEdgeEnd[1] === endEdgeStart[1]) {
            coordinates = [...startEdge, endEdge[1]];
          } else {
            const bridgeResult = await dijkstraPathfinding(
              { lat: startEdgeEnd[1], lng: startEdgeEnd[0] },
              { lat: endEdgeStart[1], lng: endEdgeStart[0] }
            );
            coordinates = [...startEdge, ...bridgeResult.path.slice(1), endEdge[1]];
          }
        } else if (startEdge) {
          const bridgeResult = await dijkstraPathfinding(
            { lat: startEdge[1][1], lng: startEdge[1][0] },
            { lat: endPoint.lat, lng: endPoint.lng }
          );
          coordinates = [...startEdge, ...bridgeResult.path.slice(1)];
        } else if (endEdge) {
          const bridgeResult = await dijkstraPathfinding(
            { lat: startPoint.lat, lng: startPoint.lng },
            { lat: endEdge[0][1], lng: endEdge[0][0] }
          );
          coordinates = [...bridgeResult.path, endEdge[1]];
        }

        // Calculate distance and time
        let totalDistance = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
          const dx = (coordinates[i + 1][0] - coordinates[i][0]) * 111000;
          const dy = (coordinates[i + 1][1] - coordinates[i][1]) * 111000;
          totalDistance += Math.sqrt(dx * dx + dy * dy);
        }

        const speed = 5.56; // 20 km/h in m/s
        const time = totalDistance / speed;

        pathResult = {
          coordinates,
          algorithm: `${selectedAlgorithm.id}-with-edges`,
          time: `${time.toFixed(2)}s`,
                                      distance: `${(totalDistance / 1000).toFixed(1)}km`,
                                      nodes: coordinates.length,
                                      visitedNodes: [],
        };
      } else {
        // Standard pathfinding
        console.log('Fetching directions with:', {
          algorithm: selectedAlgorithm.id,
          origin: [startPoint.lng, startPoint.lat],
          destination: [endPoint.lng, endPoint.lat],
        });

        if (selectedAlgorithm.id === 'dijkstra') {
          const result = await dijkstraPathfinding(
            { lat: startPoint.lat, lng: startPoint.lng },
            { lat: endPoint.lat, lng: endPoint.lng }
          );
          console.log('Dijkstra result:', result); // Debug log
          pathResult = {
            coordinates: result.path,
            algorithm: selectedAlgorithm.id,
            time: `${(result.time / 1000).toFixed(2)}s`,
                                      distance: `${result.distance.toFixed(1)}km`, // Distance is already in kilometers
                                      nodes: result.nodesVisited,
                                      visitedNodes: result.visitedNodes,
          };
        } else {
          const distance = Math.sqrt(
            Math.pow(endPoint.lng - startPoint.lng, 2) +
            Math.pow(endPoint.lat - startPoint.lat, 2)
          ) * 111000;
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
      }

      console.log('Setting path result:', pathResult);
      setPathResult(pathResult);

      // Set comparison results with correct distance and nodes
      const distance = parseFloat(pathResult.distance.replace('km', '')); // Convert "6.9km" to 6.9
      console.log('Parsed distance for comparisonResults:', distance); // Debug log
      setComparisonResults({
        dijkstra: {
          time: pathResult.algorithm === 'dijkstra' ? pathResult.time : getPerformanceMetrics('dijkstra', distance).time,
                           distance: `${distance.toFixed(1)}km`,
                           nodes: pathResult.algorithm === 'dijkstra' ? pathResult.nodes : getPerformanceMetrics('dijkstra', distance).nodes,
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
  }, [selectedAlgorithm, startPoint, endPoint, startEdge, endEdge]);

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

  const handleSwapPoints = () => {
    if (startPoint && endPoint) {
      const tempPoint = startPoint;
      const tempEdge = startEdge;
      setStartPoint(endPoint);
      setEndPoint(tempPoint);
      setStartEdge(endEdge);
      setEndEdge(tempEdge);
    }
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
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

    <Toolbar title="Naga City Transportation Network" />

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

    <AlgorithmInfoModal visible={modalVisible} algorithm={algorithmInfo} onClose={() => setModalVisible(false)} />

    <StatusIndicators mapLoaded={mapLoaded} errorMsg={errorMsg} selectedAlgorithm={selectedAlgorithm} />

    <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default PathfindingComparison;
