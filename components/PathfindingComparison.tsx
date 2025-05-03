// PathfindingComparison.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import MapView from './MapView';
import ControlPanel from './ControlPanel';
import { dijkstraPathfinding, gbfsPathfinding, bellmanFordPathfinding, algorithm } from '../utils/algorithms';

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
  travelTime?: string;
  distance: string;
  nodes: number;
  visitedNodes: number[][];
  edgesExplored?: number;
  pathNodeCount?: number;
}

interface ComparisonResult {
  time: string;
  distance: string;
  nodes: number;
  edgesExplored: number;
  pathNodeCount: number;
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
  const [comparisonResults, setComparisonResults] = useState<Record<string, ComparisonResult> | null>(null);
  const [showVisitedNodes, setShowVisitedNodes] = useState(false);

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
    setShowVisitedNodes(false);
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
    setShowVisitedNodes(false);
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
    setShowVisitedNodes(false);

    try {
      // Compute pathfinding for all algorithms
      const algorithmsToRun = [
        { id: 'dijkstra', func: () => dijkstraPathfinding(graph, startPoint, endPoint, 'dijkstra') },
                                      { id: 'a-star', func: () => dijkstraPathfinding(graph, startPoint, endPoint, 'a-star') },
                                      { id: 'gbfs', func: () => gbfsPathfinding(graph, startPoint, endPoint) },
                                      { id: 'bellman-ford', func: () => bellmanFordPathfinding(graph, startPoint, endPoint) },
      ];

      const results: Record<string, { result: any; travelTime: string }> = {};

      for (const algo of algorithmsToRun) {
        const result = await algo.func();
        const totalDistance = result.distance * 1000; // Convert km to meters
        const speed = 4.17; // meters per second (15 km/h)
  const travelTime = totalDistance / speed; // Estimated travel time in seconds

  results[algo.id] = {
    result,
    travelTime: `${travelTime.toFixed(2)}s`,
  };
      }

      // Set pathResult for the selected algorithm
      const selectedResult = results[selectedAlgorithm.id].result;
      const selectedTravelTime = results[selectedAlgorithm.id].travelTime;

      const pathResult: PathResult = {
        coordinates: selectedResult.path,
        algorithm: selectedAlgorithm.id,
        time: `${(selectedResult.time / 1000).toFixed(2)}s`,
                                      travelTime: selectedTravelTime,
                                      distance: `${selectedResult.distance.toFixed(1)}km`,
                                      nodes: selectedResult.nodesVisited,
                                      visitedNodes: selectedResult.visitedNodes,
                                      edgesExplored: selectedResult.edgesExplored,
                                      pathNodeCount: selectedResult.pathNodeCount,
      };

      // Build comparisonResults with actual metrics for all algorithms
      const newComparisonResults: Record<string, ComparisonResult> = {
        dijkstra: {
          time: `${(results['dijkstra'].result.time / 1000).toFixed(2)}s`,
                                      distance: `${results['dijkstra'].result.distance.toFixed(1)}km`,
                                      nodes: results['dijkstra'].result.nodesVisited,
                                      edgesExplored: results['dijkstra'].result.edgesExplored,
                                      pathNodeCount: results['dijkstra'].result.pathNodeCount,
        },
        'a-star': {
          time: `${(results['a-star'].result.time / 1000).toFixed(2)}s`,
                                      distance: `${results['a-star'].result.distance.toFixed(1)}km`,
                                      nodes: results['a-star'].result.nodesVisited,
                                      edgesExplored: results['a-star'].result.edgesExplored,
                                      pathNodeCount: results['a-star'].result.pathNodeCount,
        },
        gbfs: {
          time: `${(results['gbfs'].result.time / 1000).toFixed(2)}s`,
                                      distance: `${results['gbfs'].result.distance.toFixed(1)}km`,
                                      nodes: results['gbfs'].result.nodesVisited,
                                      edgesExplored: results['gbfs'].result.edgesExplored,
                                      pathNodeCount: results['gbfs'].result.pathNodeCount,
        },
        'bellman-ford': {
          time: `${(results['bellman-ford'].result.time / 1000).toFixed(2)}s`,
                                      distance: `${results['bellman-ford'].result.distance.toFixed(1)}km`,
                                      nodes: results['bellman-ford'].result.nodesVisited,
                                      edgesExplored: results['bellman-ford'].result.edgesExplored,
                                      pathNodeCount: results['bellman-ford'].result.pathNodeCount,
        },
      };

      setPathResult(pathResult);
      setComparisonResults(newComparisonResults);
      setIsComputing(false);

      console.log('Final pathResult set:', pathResult);
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
    setShowVisitedNodes(false);
    lastPathfindingInputs.current = null;
  }, []);

  const onAlgorithmInfo = useCallback((algorithm: algorithm) => {
    const descriptions: { [key: string]: string } = {
      dijkstra: "Dijkstra's algorithm guarantees the shortest path in a weighted graph but explores more nodes than A*.",
      'a-star': 'A* uses heuristics to optimize pathfinding, making it faster than Dijkstra in many cases.',
      gbfs: 'Greedy Best-First Search prioritizes nodes closest to the destination (by straight-line distance), often finding a path quickly but not necessarily the shortest.',
                                      'bellman-ford': 'Bellman-Ford finds the shortest path and can handle negative weights, but is slower than Dijkstra.',
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
    showVisitedNodes={showVisitedNodes}
    />
    <ControlPanel
    key={comparisonResults ? JSON.stringify(comparisonResults) : 'no-results'}
    mapLoaded={mapLoaded}
    selectedAlgorithm={selectedAlgorithm}
    startPoint={startPoint}
    endPoint={endPoint}
    isComputing={isComputing}
    comparisonResults={comparisonResults}
    travelTime={pathResult?.travelTime}
    showVisitedNodes={showVisitedNodes}
    onShowVisitedNodesChange={setShowVisitedNodes}
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
