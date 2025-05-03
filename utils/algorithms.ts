// algorithms.ts
// Haversine distance (meters)
export const haversineDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

export function findNearestNode(nodes: Map<string, Node>, point: { lat: number; lng: number }): Node | null {
  if (!nodes || !(nodes instanceof Map)) {
    console.error('findNearestNode: nodes is not a valid Map');
    return null;
  }

  let nearest: Node | null = null;
  let minDistance = Infinity;

  for (const node of nodes.values()) {
    const distance = haversineDistance(point, node);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = node;
    }
  }
  return nearest;
}

// Simple Priority Queue for Dijkstra's, A*, and GBFS
class PriorityQueue {
  private items: { element: string; priority: number }[] = [];

  enqueue(element: string, priority: number) {
    this.items.push({ element, priority });
    this.items.sort((a, b) => a.priority - b.priority); // Sort by priority (ascending)
  }

  dequeue(): string | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// GBFS Implementation (Greedy Best-First Search, uses only heuristic)
export async function gbfsPathfinding(
  graph: Graph,
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<{ path: number[][]; distance: number; time: number; nodesVisited: number; visitedNodes: number[][]; edgesExplored: number; pathNodeCount: number }> {
  const startTime = performance.now();

  if (!graph || !graph.nodes || !graph.edges) {
    throw new Error('Invalid graph: nodes or edges are missing');
  }

  const startNode = findNearestNode(graph.nodes, start);
  const endNode = findNearestNode(graph.nodes, end);
  if (!startNode || !endNode) {
    throw new Error('Start or end node not found in the graph.');
  }

  console.log(`Starting pathfinding with GBFS algorithm`);
  console.log(`Start node: ${startNode.osmid} (${startNode.lat}, ${startNode.lng})`);
  console.log(`End node: ${endNode.osmid} (${endNode.lat}, ${endNode.lng})`);
  console.log(`Graph size: ${graph.nodes.size} nodes, ${graph.edges.size} edge sets`);

  const initialMemory = (typeof performance !== 'undefined' && 'memory' in performance)
  ? performance.memory.usedJSHeapSize
  : null;

  const hScores = new Map<string, number>(); // Heuristic scores (estimated distance to end)
  const previous = new Map<string, string | null>();
  const pq = new PriorityQueue();
  const visited = new Set<string>();
  const visitedNodes: number[][] = [];
  let edgesExplored = 0;

  // Initialize
  for (const node of graph.nodes.keys()) {
    hScores.set(node, Infinity);
    previous.set(node, null);
  }
  hScores.set(startNode.osmid, haversineDistance(startNode, endNode));
  pq.enqueue(startNode.osmid, hScores.get(startNode.osmid)!);
  visitedNodes.push([startNode.lng, startNode.lat]);

  // GBFS main loop: Process nodes based on heuristic score
  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;

    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current)!;
    visitedNodes.push([node.lng, node.lat]);

    if (current === endNode.osmid) break;

    const edges = graph.edges.get(current) || [];
    edgesExplored += edges.length;
    for (const edge of edges) {
      const neighbor = edge.target;
      if (!visited.has(neighbor)) {
        hScores.set(neighbor, haversineDistance(graph.nodes.get(neighbor)!, endNode));
        previous.set(neighbor, current);
        pq.enqueue(neighbor, hScores.get(neighbor)!);
      }
    }
  }

  if (!visited.has(endNode.osmid)) {
    throw new Error('No path found between start and end nodes.');
  }

  // Reconstruct path and calculate actual distance using edge weights
  const path: number[][] = [];
  let totalDistance = 0;
  let current: string | null = endNode.osmid;

  while (current) {
    const node = graph.nodes.get(current)!;
    path.unshift([node.lng, node.lat]);
    const prev = previous.get(current);
    if (prev) {
      const edges = graph.edges.get(prev) || [];
      const edge = edges.find(e => e.target === current);
      if (edge) totalDistance += edge.weight;
    }
    current = prev;
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  const finalMemory = (typeof performance !== 'undefined' && 'memory' in performance)
  ? performance.memory.usedJSHeapSize
  : null;
  const memoryUsed = (initialMemory !== null && finalMemory !== null)
  ? (finalMemory - initialMemory) / 1024 / 1024
  : null;

  console.log(`Pathfinding Performance Metrics (GBFS):`);
  console.log(`- Execution Time: ${executionTime.toFixed(2)}ms (${(executionTime / 1000).toFixed(2)}s)`);
  console.log(`- Nodes Visited: ${visited.size}`);
  console.log(`- Edges Explored: ${edgesExplored}`);
  console.log(`- Path Length: ${totalDistance.toFixed(2)}m (${(totalDistance / 1000).toFixed(2)}km)`);
  console.log(`- Path Node Count: ${path.length}`);
  if (memoryUsed !== null) {
    console.log(`- Memory Used: ${memoryUsed.toFixed(2)} MB`);
  } else {
    console.log(`- Memory Used: Not available (performance.memory not supported)`);
  }
  console.log(`Visited Nodes (first 10):`, visitedNodes.slice(0, 10));

  return {
    path,
    distance: totalDistance / 1000,
    time: executionTime,
    nodesVisited: visited.size,
    visitedNodes,
    edgesExplored,
    pathNodeCount: path.length,
  };
}

// Bellman-Ford Implementation
export async function bellmanFordPathfinding(
  graph: Graph,
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<{ path: number[][]; distance: number; time: number; nodesVisited: number; visitedNodes: number[][]; edgesExplored: number; pathNodeCount: number }> {
  const startTime = performance.now();

  if (!graph || !graph.nodes || !graph.edges) {
    throw new Error('Invalid graph: nodes or edges are missing');
  }

  const startNode = findNearestNode(graph.nodes, start);
  const endNode = findNearestNode(graph.nodes, end);
  if (!startNode || !endNode) {
    throw new Error('Start or end node not found in the graph.');
  }

  console.log(`Starting pathfinding with Bellman-Ford algorithm`);
  console.log(`Start node: ${startNode.osmid} (${startNode.lat}, ${startNode.lng})`);
  console.log(`End node: ${endNode.osmid} (${endNode.lat}, ${endNode.lng})`);
  console.log(`Graph size: ${graph.nodes.size} nodes, ${graph.edges.size} edge sets`);

  const initialMemory = (typeof performance !== 'undefined' && 'memory' in performance)
  ? performance.memory.usedJSHeapSize
  : null;

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visitedNodes: number[][] = [];
  const visited = new Set<string>();
  let edgesExplored = 0;

  // Initialize
  for (const node of graph.nodes.keys()) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(startNode.osmid, 0);
  visited.add(startNode.osmid);
  visitedNodes.push([startNode.lng, startNode.lat]);

  // Relax edges |V|-1 times
  const V = graph.nodes.size;
  for (let i = 0; i < V - 1; i++) {
    let changesMade = false;
    for (const [source, edgeList] of graph.edges.entries()) {
      for (const edge of edgeList) {
        const newDist = distances.get(source)! + edge.weight;
        if (newDist < distances.get(edge.target)!) {
          distances.set(edge.target, newDist);
          previous.set(edge.target, source);
          if (!visited.has(edge.target)) {
            visited.add(edge.target);
            const targetNode = graph.nodes.get(edge.target)!;
            visitedNodes.push([targetNode.lng, targetNode.lat]);
          }
          changesMade = true;
        }
        edgesExplored++;
      }
    }
    if (!changesMade) break; // Optimization: stop if no changes
  }

  // Check for negative cycles
  for (const [source, edgeList] of graph.edges.entries()) {
    for (const edge of edgeList) {
      if (distances.get(source)! + edge.weight < distances.get(edge.target)!) {
        throw new Error('Graph contains a negative cycle');
      }
      edgesExplored++;
    }
  }

  if (distances.get(endNode.osmid)! === Infinity) {
    throw new Error('No path found between start and end nodes.');
  }

  // Reconstruct path
  const path: number[][] = [];
  let totalDistance = 0;
  let current: string | null = endNode.osmid;

  while (current) {
    const node = graph.nodes.get(current)!;
    path.unshift([node.lng, node.lat]);
    const prev = previous.get(current);
    if (prev) {
      const edges = graph.edges.get(prev) || [];
      const edge = edges.find(e => e.target === current);
      if (edge) totalDistance += edge.weight;
    }
    current = prev;
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  const finalMemory = (typeof performance !== 'undefined' && 'memory' in performance)
  ? performance.memory.usedJSHeapSize
  : null;
  const memoryUsed = (initialMemory !== null && finalMemory !== null)
  ? (finalMemory - initialMemory) / 1024 / 1024
  : null;

  console.log(`Pathfinding Performance Metrics (Bellman-Ford):`);
  console.log(`- Execution Time: ${executionTime.toFixed(2)}ms (${(executionTime / 1000).toFixed(2)}s)`);
  console.log(`- Nodes Visited: ${visited.size}`);
  console.log(`- Edges Explored: ${edgesExplored}`);
  console.log(`- Path Length: ${totalDistance.toFixed(2)}m (${(totalDistance / 1000).toFixed(2)}km)`);
  console.log(`- Path Node Count: ${path.length}`);
  if (memoryUsed !== null) {
    console.log(`- Memory Used: ${memoryUsed.toFixed(2)} MB`);
  } else {
    console.log(`- Memory Used: Not available (performance.memory not supported)`);
  }
  console.log(`Visited Nodes (first 10):`, visitedNodes.slice(0, 10));

  return {
    path,
    distance: totalDistance / 1000,
    time: executionTime,
    nodesVisited: visited.size,
    visitedNodes,
    edgesExplored,
    pathNodeCount: path.length,
  };
}

// Dijkstra's and A* Implementation
export async function dijkstraPathfinding(
  graph: Graph,
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  algorithm: string = 'dijkstra'
): Promise<{ path: number[][]; distance: number; time: number; nodesVisited: number; visitedNodes: number[][]; edgesExplored: number; pathNodeCount: number }> {
  const startTime = performance.now();

  if (!graph || !graph.nodes || !graph.edges) {
    throw new Error('Invalid graph: nodes or edges are missing');
  }

  const startNode = findNearestNode(graph.nodes, start);
  const endNode = findNearestNode(graph.nodes, end);
  if (!startNode || !endNode) {
    throw new Error('Start or end node not found in the graph.');
  }

  console.log(`Starting pathfinding with ${algorithm} algorithm`);
  console.log(`Start node: ${startNode.osmid} (${startNode.lat}, ${startNode.lng})`);
  console.log(`End node: ${endNode.osmid} (${endNode.lat}, ${endNode.lng})`);
  console.log(`Graph size: ${graph.nodes.size} nodes, ${graph.edges.size} edge sets`);

  const initialMemory = (typeof performance !== 'undefined' && 'memory' in performance)
  ? performance.memory.usedJSHeapSize
  : null;

  const distances = new Map<string, number>();
  const fScores = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const visitedNodes: number[][] = [];
  const pq = new PriorityQueue();
  let edgesExplored = 0;

  const heuristic = (node: Node, endNode: Node): number => {
    return haversineDistance(node, endNode);
  };

  for (const node of graph.nodes.keys()) {
    distances.set(node, Infinity);
    fScores.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(startNode.osmid, 0);
  fScores.set(startNode.osmid, algorithm === 'a-star' ? heuristic(startNode, endNode) : 0);
  pq.enqueue(startNode.osmid, fScores.get(startNode.osmid)!);

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;

    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current)!;
    visitedNodes.push([node.lng, node.lat]);

    if (current === endNode.osmid) break;

    const edges = graph.edges.get(current) || [];
    edgesExplored += edges.length;
    for (const edge of edges) {
      const neighbor = edge.target;
      const newDist = distances.get(current)! + edge.weight;

      if (newDist < distances.get(neighbor)!) {
        distances.set(neighbor, newDist);
        previous.set(neighbor, current);
        const h = algorithm === 'a-star' ? heuristic(graph.nodes.get(neighbor)!, endNode) : 0;
        fScores.set(neighbor, newDist + h);
        pq.enqueue(neighbor, fScores.get(neighbor)!);
      }
    }
  }

  if (!visited.has(endNode.osmid)) {
    throw new Error('No path found between start and end nodes.');
  }

  const path: number[][] = [];
  let totalDistance = 0;
  let current: string | null = endNode.osmid;

  while (current) {
    const node = graph.nodes.get(current)!;
    path.unshift([node.lng, node.lat]);
    const prev = previous.get(current);
    if (prev) {
      const edges = graph.edges.get(prev) || [];
      const edge = edges.find(e => e.target === current);
      if (edge) totalDistance += edge.weight;
    }
    current = prev;
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  const finalMemory = (typeof performance !== 'undefined' && 'memory' in performance)
  ? performance.memory.usedJSHeapSize
  : null;
  const memoryUsed = (initialMemory !== null && finalMemory !== null)
  ? (finalMemory - initialMemory) / 1024 / 1024
  : null;

  console.log(`Pathfinding Performance Metrics (${algorithm}):`);
  console.log(`- Execution Time: ${executionTime.toFixed(2)}ms (${(executionTime / 1000).toFixed(2)}s)`);
  console.log(`- Nodes Visited: ${visited.size}`);
  console.log(`- Edges Explored: ${edgesExplored}`);
  console.log(`- Path Length: ${totalDistance.toFixed(2)}m (${(totalDistance / 1000).toFixed(2)}km)`);
  console.log(`- Path Node Count: ${path.length}`);
  if (memoryUsed !== null) {
    console.log(`- Memory Used: ${memoryUsed.toFixed(2)} MB`);
  } else {
    console.log(`- Memory Used: Not available (performance.memory not supported)`);
  }
  console.log(`Visited Nodes (first 10):`, visitedNodes.slice(0, 10));

  return {
    path,
    distance: totalDistance / 1000,
    time: executionTime,
    nodesVisited: visited.size,
    visitedNodes,
    edgesExplored,
    pathNodeCount: path.length,
  };
}

export interface algorithm {
  id: string;
  name: string;
}

export const algorithms: algorithm[] = [
  { id: 'dijkstra', name: 'Dijkstra' },
{ id: 'a-star', name: 'A*' },
{ id: 'gbfs', name: 'Greedy Best-First Search' },
{ id: 'bellman-ford', name: 'Bellman-Ford' },
];
