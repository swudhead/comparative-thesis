import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import MapView from './MapView';
import ControlPanel from './ControlPanel';
import { dijkstraPathfinding, algorithm, getPerformanceMetrics } from '../utils/algorithms';

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

interface PathResult {
  coordinates: number[][];
  algorithm: string;
  time: string;
  distance: string;
  nodes: number;
  visitedNodes: number[][];
}

const PathfindingComparison: React.FC = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [graph, setGraph] = useState<Graph>({ nodes: new Map(), edges: new Map() });
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [startEdge, setStartEdge] = useState<number[][] | null>(null);
  const [endEdge, setEndEdge] = useState<number[][] | null>(null);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<algorithm | null>(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | 'none'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<Record<string, { time: string; distance: string; nodes: number }> | null>(null);

  const lastPathfindingInputs = useRef<string | null>(null);

  const onMapLoaded = useCallback(() => {
    setMapLoaded(true);
  }, []);

  const onError = useCallback((error: string) => {
    setErrorMsg(error);
  }, []);

  const onGraphUpdate = useCallback((newGraph: Graph) => {
    setGraph(newGraph);
  }, []);

  const onPointSelected = useCallback(
    (pointType: 'start' | 'end', coordinates: { lat: number; lng: number }, edgeCoordinates?: number[][]) => {
      if (pointType === 'start') {
        setStartPoint(coordinates);
        setStartEdge(edgeCoordinates || null);
      } else {
        setEndPoint(coordinates);
        setEndEdge(edgeCoordinates || null);
      }
      setSelectionMode('none');
    },
    []
  );

  const onSelectStartPoint = useCallback(() => {
    setSelectionMode(selectionMode === 'start' ? 'none' : 'start');
  }, [selectionMode]);

  const onSelectEndPoint = useCallback(() => {
    setSelectionMode(selectionMode === 'end' ? 'none' : 'end');
  }, [selectionMode]);

  const onClearPoints = useCallback(() => {
    setStartPoint(null);
    setEndPoint(null);
    setStartEdge(null);
    setEndEdge(null);
    setPathResult(null);
    setComparisonResults(null);
    setSelectionMode('none');
    setErrorMsg(null);
    lastPathfindingInputs.current = null;
  }, []);

  const onSwapPoints = useCallback(() => {
    setStartPoint(endPoint);
    setEndPoint(startPoint);
    setStartEdge(endEdge);
    setEndEdge(startEdge);
    setPathResult(null);
    setComparisonResults(null);
    setErrorMsg(null);
    lastPathfindingInputs.current = null;
  }, [startPoint, endPoint, startEdge, endEdge]);

  const onTapMap = useCallback((event: any) => {
    if (selectionMode === 'none') {
      setErrorMsg('Tap "Set Start" or "Set End" to select a point.');
    }
  }, [selectionMode]);

  const fetchDirections = useCallback(async () => {
    if (!startPoint || !endPoint) {
      setErrorMsg('Please select both start and end points.');
      return;
    }
    if (!selectedAlgorithm) {
      setErrorMsg('Please select an algorithm.');
      return;
    }
    if (!graph || !graph.nodes || !graph.edges || graph.nodes.size === 0 || graph.edges.size === 0) {
      setErrorMsg('Graph data not loaded.');
      return;
    }

    const inputKey = `${startPoint.lat},${startPoint.lng}-${endPoint.lat},${endPoint.lng}-${selectedAlgorithm.id}`;
    if (lastPathfindingInputs.current === inputKey) {
      console.log('Skipping redundant pathfinding call for:', inputKey);
      return;
    }
    lastPathfindingInputs.current = inputKey;

    setIsComputing(true);
    setErrorMsg(null);

    try {
      let pathResult: PathResult;

      const useSelectedEdges = startEdge || endEdge;
      if (useSelectedEdges) {
        let coordinates: number[][] = [];
        let totalDistance = 0;

        if (startEdge && endEdge) {
          const startEdgeEnd = startEdge[1];
          const endEdgeStart = endEdge[0];
          if (startEdgeEnd[0] === endEdgeStart[0] && startEdgeEnd[1] === endEdgeStart[1]) {
            coordinates = [...startEdge, endEdge[1]];
          } else {
            const bridgeResult = await dijkstraPathfinding(
              graph,
              { lat: startEdgeEnd[1], lng: startEdgeEnd[0] },
              { lat: endEdgeStart[1], lng: endEdgeStart[0] },
              selectedAlgorithm.id
            );
            coordinates = [...startEdge, ...bridgeResult.path.slice(1), endEdge[1]];
            totalDistance = bridgeResult.distance * 1000;
          }
        } else if (startEdge) {
          const bridgeResult = await dijkstraPathfinding(
            graph,
            { lat: startEdge[1][1], lng: startEdge[1][0] },
            { lat: endPoint.lat, lng: endPoint.lng },
            selectedAlgorithm.id
          );
          coordinates = [...startEdge, ...bridgeResult.path.slice(1)];
          totalDistance = bridgeResult.distance * 1000;
        } else if (endEdge) {
          const bridgeResult = await dijkstraPathfinding(
            graph,
            { lat: startPoint.lat, lng: startPoint.lng },
            { lat: endEdge[0][1], lng: endEdge[0][0] },
            selectedAlgorithm.id
          );
          coordinates = [...bridgeResult.path, endEdge[1]];
          totalDistance = bridgeResult.distance * 1000;
        }

        if (totalDistance === 0) {
          for (let i = 0; i < coordinates.length - 1; i++) {
            const dx = (coordinates[i + 1][0] - coordinates[i][0]) * 111000;
            const dy = (coordinates[i + 1][1] - coordinates[i][1]) * 111000;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
          }
        }

        const speed = 5.56;
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
        if (selectedAlgorithm.id === 'dijkstra' || selectedAlgorithm.id === 'a-star') {
          const result = await dijkstraPathfinding(graph, startPoint, endPoint, selectedAlgorithm.id);
          pathResult = {
            coordinates: result.path,
            algorithm: selectedAlgorithm.id,
            time: `${(result.time / 1000).toFixed(2)}s`,
                                      distance: `${result.distance.toFixed(1)}km`,
                                      nodes: result.nodesVisited,
                                      visitedNodes: result.visitedNodes || [],
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

      setPathResult(pathResult);
      setComparisonResults({
        dijkstra: {
          time: pathResult.algorithm === 'dijkstra' ? pathResult.time : getPerformanceMetrics('dijkstra', parseFloat(pathResult.distance)).time,
                           distance: pathResult.distance,
                           nodes: pathResult.algorithm === 'dijkstra' ? pathResult.nodes : getPerformanceMetrics('dijkstra', parseFloat(pathResult.distance)).nodes,
        },
        'a-star': getPerformanceMetrics('a-star', parseFloat(pathResult.distance)),
                           'd-star': getPerformanceMetrics('d-star', parseFloat(pathResult.distance)),
                           'd-star-lite': getPerformanceMetrics('d-star-lite', parseFloat(pathResult.distance)),
      });

      setIsComputing(false);
    } catch (error: any) {
      setErrorMsg(`Error computing path: ${error.message || 'Unknown error'}`);
      setIsComputing(false);
    }
  }, [selectedAlgorithm, startPoint, endPoint, startEdge, endEdge, graph]);

  const onAlgorithmSelect = useCallback((algorithm: algorithm) => {
    setSelectedAlgorithm(algorithm);
    setPathResult(null);
    setComparisonResults(null);
    setErrorMsg(null);
    lastPathfindingInputs.current = null;
  }, []);

  const onAlgorithmInfo = useCallback((algorithm: algorithm) => {
    const descriptions: { [key: string]: string } = {
      dijkstra: "Dijkstra's algorithm guarantees the shortest path in a weighted graph but explores all possible nodes.",
      'a-star': 'A* uses heuristics to optimize pathfinding, making it faster than Dijkstra in many cases.',
      'd-star': 'D* is designed for dynamic environments where the map may change during pathfinding.',
      'd-star-lite': 'D* Lite is an optimized version of D*, efficient for dynamic path updates.',
    };
    Alert.alert(algorithm.name, descriptions[algorithm.id] || 'No description available.');
  }, []);

  useEffect(() => {
    if (errorMsg) {
      Alert.alert('Error', errorMsg);
    }
  }, [errorMsg]);

  return (
    <View style={styles.container}>
    <MapView
    onMapLoaded={onMapLoaded}
    onError={onError}
    startPoint={startPoint}
    endPoint={endPoint}
    pathResult={pathResult}
    onPointSelected={onPointSelected}
    selectionMode={selectionMode}
    onTapMap={onTapMap}
    onGraphUpdate={onGraphUpdate}
    />
    <ControlPanel
    mapLoaded={mapLoaded}
    selectedAlgorithm={selectedAlgorithm}
    startPoint={startPoint}
    endPoint={endPoint}
    isComputing={isComputing}
    comparisonResults={comparisonResults}
    onAlgorithmSelect={onAlgorithmSelect}
    onAlgorithmInfo={onAlgorithmInfo}
    onSelectStartPoint={onSelectStartPoint}
    onSelectEndPoint={onSelectEndPoint}
    onStartPathfinding={fetchDirections}
    onClearPoints={onClearPoints}
    onSwapPoints={onSwapPoints}
    selectionMode={selectionMode}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PathfindingComparison;
