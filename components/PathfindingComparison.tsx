// PathfindingComparison.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Alert, Button } from 'react-native';
import MapView from './MapView';
import ControlPanel from './ControlPanel';
import { haversineDistance, dStarLitePathfinding, findNearestNode, dijkstraPathfinding, getPerformanceMetrics, algorithms, Algorithm, isGraphConnected, gbfsPathfinding, bellmanFordPathfinding } from '../utils/algorithms';

interface Node {
  osmid: string;
  lat: number;
  lng: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  blocked?: boolean;
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
  const [graphVersion, setGraphVersion] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [graph, setGraph] = useState<Graph>({ nodes: new Map(), edges: new Map() });
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [startEdge, setStartEdge] = useState<number[][] | null>(null);
  const [endEdge, setEndEdge] = useState<number[][] | null>(null);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | 'none'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<Record<string, ComparisonResult> | null>(null);
  const [blockedEdges, setBlockedEdges] = useState<{source: string, target: string}[]>([]);
  const [blockedNodes, setBlockedNodes] = useState<string[]>([]);
  const [isBlockingNode, setIsBlockingNode] = useState(false);
  const [showVisitedNodes, setShowVisitedNodes] = useState(false);

  const lastPathfindingInputs = useRef<string | null>(null);

  // Event handlers
  const onMapLoaded = useCallback(() => setMapLoaded(true), []);
  const onError = useCallback((error: string) => setErrorMsg(error), []);
  
  const onGraphUpdate = useCallback((newGraph: Graph) => {
    // Filter out blocked nodes
    const filteredNodes = new Map(newGraph.nodes);
    blockedNodes.forEach(id => filteredNodes.delete(id));

    // Filter out edges connected to blocked nodes
    const filteredEdges = new Map(newGraph.edges);
    blockedNodes.forEach(id => filteredEdges.delete(id));
    filteredEdges.forEach((edges, source) => {
      filteredEdges.set(
        source,
        edges.filter(edge => !blockedNodes.includes(edge.target))
      );
    });

    setGraph({ nodes: filteredNodes, edges: filteredEdges });
    setGraphVersion(v => v + 1);
  }, [blockedNodes]);

  const triggerRecomputation = useCallback(() => {
    setGraphVersion((v) => v + 1); // Increment graphVersion to force recomputation
    console.log('Graph version incremented to trigger recomputation');
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

      // Trigger recomputation when start or end points are updated
      triggerRecomputation();
    },
    [triggerRecomputation]
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
    setBlockedEdges([]);
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

  const onBlockEdge = useCallback((source: string, target: string) => {
    setBlockedEdges((prev) => {
      const isAlreadyBlocked = prev.some((edge) => edge.source === source && edge.target === target);
      if (isAlreadyBlocked) {
        // Unblock the edge if it's already blocked
        return prev.filter((edge) => !(edge.source === source && edge.target === target));
      } else {
        // Block the edge
        return [...prev, { source, target }];
      }
    });
    triggerRecomputation(); // Trigger recomputation after blocking/unblocking an edge
  }, [triggerRecomputation]);

  const onBlockNode = useCallback((nodeId: string) => {
    setBlockedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId) 
        : [...prev, nodeId]
    );
    Alert.alert(
      blockedNodes.includes(nodeId) ? 'Node Unblocked' : 'Node Blocked',
      `Node ${nodeId} has been ${blockedNodes.includes(nodeId) ? 'unblocked' : 'blocked'}`
    );
  }, [blockedNodes]);

  const toggleBlockingMode = useCallback(() => {
    setIsBlockingNode(prev => !prev);
  }, []);

  useEffect(() => {
    // Trigger recalculation when blockedEdges changes
    if (startPoint && endPoint && selectedAlgorithm) {
      fetchDirections();
    }
  }, [blockedEdges]); // Add blockedEdges as a dependency

  // Pathfinding logic
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
      const algorithmsToRun = [
        { id: 'dijkstra', func: () => dijkstraPathfinding(graph, startPoint, endPoint, 'dijkstra') },
        { id: 'a-star', func: () => dijkstraPathfinding(graph, startPoint, endPoint, 'a-star') },
        { id: 'gbfs', func: () => gbfsPathfinding(graph, startPoint, endPoint) },
        { id: 'bellman-ford', func: () => bellmanFordPathfinding(graph, startPoint, endPoint) },
        { id: 'd-star-lite', func: () => dStarLitePathfinding(graph, startPoint, endPoint, blockedEdges) }
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
        'd-star-lite': {
          time: `${(results['d-star-lite'].result.time / 1000).toFixed(2)}s`,
          distance: `${results['d-star-lite'].result.distance.toFixed(1)}km`,
          nodes: results['d-star-lite'].result.nodesVisited,
          edgesExplored: results['d-star-lite'].result.edgesExplored,
          pathNodeCount: results['d-star-lite'].result.pathNodeCount,
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

  const onAlgorithmSelect = useCallback((algorithm: Algorithm) => {
    setSelectedAlgorithm(algorithm);
    setPathResult(null);
    setComparisonResults(null);
    setErrorMsg(null);
    setShowVisitedNodes(false);
    lastPathfindingInputs.current = null;
  }, []);

  const onAlgorithmInfo = useCallback((algorithm: Algorithm) => {
    const descriptions: Record<string, string> = {
      dijkstra: "Dijkstra's algorithm guarantees the shortest path in a weighted graph but explores all possible nodes.",
      'a-star': 'A* uses heuristics to optimize pathfinding, making it faster than Dijkstra in many cases.',
      'd-star-lite': 'D* Lite is an optimized version of D*, efficient for dynamic path updates with changing edge costs.',
      gbfs: 'Greedy Best-First Search prioritizes nodes closest to the destination (by straight-line distance), often finding a path quickly but not necessarily the shortest.',
      'bellman-ford': 'Bellman-Ford finds the shortest path and can handle negative weights, but is slower than Dijkstra.',
    };
    Alert.alert(algorithm.name, descriptions[algorithm.id] || 'No description available.');
  }, []);

  useEffect(() => {
    if (errorMsg) {
      Alert.alert('Error', errorMsg);
      setErrorMsg(null);
    }
  }, [errorMsg]);

  useEffect(() => {
    console.log("Current graph version:", graphVersion);
  }, [graphVersion]);

  const canCalculatePath = !!startPoint && !!endPoint &&
    haversineDistance(startPoint, endPoint) < 5000; // 5km max

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

function areGraphsEqual(a: Graph, b: Graph): boolean {
  // Compare the size of nodes
  if (a.nodes.size !== b.nodes.size) return false;

  // Compare the size of edges
  if (a.edges.size !== b.edges.size) return false;

  // Compare nodes
  for (const [key, nodeA] of a.nodes) {
    const nodeB = b.nodes.get(key);
    if (!nodeB || nodeA.lat !== nodeB.lat || nodeA.lng !== nodeB.lng) {
      return false;
    }
  }

  // Compare edges
  for (const [key, edgesA] of a.edges) {
    const edgesB = b.edges.get(key);
    if (!edgesB || edgesA.length !== edgesB.length) return false;
    for (let i = 0; i < edgesA.length; i++) {
      const edgeA = edgesA[i];
      const edgeB = edgesB[i];
      if (
        edgeA.source !== edgeB.source ||
        edgeA.target !== edgeB.target ||
        edgeA.weight !== edgeB.weight
      ) {
        return false;
      }
    }
  }

  return true;
}

function reconstructPath(startNode: Node, goalNode: Node, updatedGraph: Graph) {
  const path: number[][] = [];
  const visited = new Set<string>();
  const g = new Map<string, number>();

  let current = startNode.osmid;
  if (!current || !updatedGraph.nodes.has(current)) {
    throw new Error("Invalid start node ID");
  }

  path.push([startNode.lng, startNode.lat]);
  visited.add(current);

  const maxSteps = 10000;
  let steps = 0;

  while (current !== goalNode.osmid) {
    const neighbors = updatedGraph.edges.get(current)?.filter(e => !e.blocked) ?? [];

    // Choose the neighbor with the minimum cost (g + weight)
    let minCost = Infinity;
    let nextNode: string | null = null;

    for (const edge of neighbors) {
      const cost = (g.get(edge.target) ?? Infinity) + edge.weight;
      if (cost < minCost) {
        minCost = cost;
        nextNode = edge.target;
      }
    }

    if (!nextNode || minCost === Infinity) {
      throw new Error("No path found to goal");
    }

    const node = updatedGraph.nodes.get(nextNode);
    if (!node) {
      throw new Error(`Node ${nextNode} not found in graph`);
    }

    current = nextNode;
    visited.add(current);
    path.push([node.lng, node.lat]);

    if (++steps > maxSteps) throw new Error("Path reconstruction exceeded step limit");
  }

  return path;
}

export default PathfindingComparison;