// algorithms.ts
import MinHeap from './MinHeap';

interface Coord {
  lat: number;
  lng: number;
}

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
  blockedNodes?: Set<string>;
}

interface PathfindingResult {
  path: number[][]; // [lng, lat]
  distance: number;
  time: number;
  visitedNodes?: number[][];
  nodesVisited?: number;
  edgesExplored?: number;
  pathNodeCount?: number;
}

interface Algorithm {
  id: string;
  name: string;
  description: string;
}

// Haversine distance (meters)
export const haversineDistance = (point1: Coord, point2: Coord): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const euclideanDistance = (a: Coord, b: Coord): number => {
  const dx = a.lng - b.lng;
  const dy = a.lat - b.lat;
  return Math.sqrt(dx * dx + dy * dy) * 111000;
};

const coordToKey = (coord: Coord): string => {
  return `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;
};

export const findNearestNode = (
  nodes: Map<string, Node>,
  point: Coord,
  searchRadius: number = Infinity,
  blockedNodes?: Set<string>
): Node | null => {
  let nearest: Node | null = null;
  let minDistance = Infinity;

  for (const node of nodes.values()) {
    if (blockedNodes?.has(node.osmid)) continue;
    
    const distance = haversineDistance(point, node);
    if (distance < minDistance && distance <= searchRadius) {
      minDistance = distance;
      nearest = node;
    }
  }

  return nearest;
};

class PriorityQueue<T> {
  private elements: { priority: number; element: T }[] = [];

  enqueue(element: T, priority: number): void {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.elements.shift()?.element;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  update(element: T, newPriority: number): void {
    const index = this.elements.findIndex(e => e.element === element);
    if (index !== -1) {
      this.elements[index].priority = newPriority;
      this.elements.sort((a, b) => a.priority - b.priority);
    }
  }
}

class DStarLitePriorityQueue {
  private items: { element: string; key: [number, number] }[] = [];

  enqueue(element: string, key: [number, number]): void {
    this.items.push({ element, key });
    this.items.sort((a, b) => a.key[0] !== b.key[0] ? a.key[0] - b.key[0] : a.key[1] - b.key[1]);
  }

  dequeue(): string | undefined {
    return this.items.shift()?.element;
  }

  peekKey(): [number, number] | undefined {
    return this.items[0]?.key;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  update(element: string, newKey: [number, number]): void {
    const index = this.items.findIndex(item => item.element === element);
    if (index !== -1) {
      this.items[index].key = newKey;
      this.items.sort((a, b) => a.key[0] !== b.key[0] ? a.key[0] - b.key[0] : a.key[1] - b.key[1]);
    }
  }
}

const blockUserEdge = (graph: Graph, blockedEdges?: { source: string; target: string }[], blockedNodes?: Set<string>): Graph => {
  const newEdges = new Map(graph.edges);

  blockedEdges?.forEach(({ source, target }) => {
    newEdges.set(
      source,
      newEdges.get(source)?.map(e => 
        e.target === target ? { ...e, blocked: true } : e
      ) ?? []
    );
  });

  blockedNodes?.forEach(nodeId => {
    newEdges.delete(nodeId);
    newEdges.forEach((edges, source) => {
      newEdges.set(
        source,
        edges.filter(e => e.target !== nodeId)
      );
    });
  });

  return {
    nodes: graph.nodes,
    edges: newEdges,
    blockedNodes
  };
};

export const dijkstraPathfinding = async (
  graph: Graph,
  startCoord: Coord,
  goalCoord: Coord,
  algorithmId: string = 'dijkstra'
): Promise<PathfindingResult> => {
  if (!isGraphConnected(graph)) {
    throw new Error("The graph is not fully connected.");
  }

  const startNode = findNearestNode(graph.nodes, startCoord);
  const goalNode = findNearestNode(graph.nodes, goalCoord);
  if (!startNode || !goalNode) throw new Error("Start or goal node not found");

  const startTime = performance.now();
  const visited = new Set<string>();
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const pq = new PriorityQueue<string>();
  const visitedNodes: number[][] = [];
  let edgesExplored = 0;

  const heuristic = (node: Node, endNode: Node): number => {
    return haversineDistance(node, endNode);
  };

  graph.nodes.forEach((_, osmid) => {
    distances.set(osmid, Infinity);
    previous.set(osmid, null);
  });

  distances.set(startNode.osmid, 0);
  pq.enqueue(startNode.osmid, algorithmId === 'a-star' ? heuristic(startNode, goalNode) : 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    if (visited.has(current)) continue;
    
    visited.add(current);
    const node = graph.nodes.get(current)!;
    visitedNodes.push([node.lng, node.lat]);

    if (current === goalNode.osmid) break;

    const edges = graph.edges.get(current) || [];
    edgesExplored += edges.length;
    for (const edge of edges) {
      if (edge.blocked || graph.blockedNodes?.has(edge.target)) continue;
      
      const alt = distances.get(current)! + edge.weight;
      if (alt < distances.get(edge.target)!) {
        distances.set(edge.target, alt);
        previous.set(edge.target, current);
        const priority = algorithmId === 'a-star' 
          ? alt + heuristic(graph.nodes.get(edge.target)!, goalNode)
          : alt;
        pq.enqueue(edge.target, priority);
      }
    }
  }

  const path: number[][] = [];
  let totalDistance = 0;
  let current: string | null = goalNode.osmid;

  while (current) {
    const node = graph.nodes.get(current)!;
    path.unshift([node.lng, node.lat]);
    const prev = previous.get(current);
    if (prev) {
      const edges = graph.edges.get(prev) || [];
      const edge = edges.find(e => e.target === current);
      if (edge) totalDistance += edge.weight;
    }
    current = prev || null;
  }

  if (path.length === 0) throw new Error("No path found");

  const endTime = performance.now();

  return {
    path,
    distance: totalDistance / 1000,
    time: endTime - startTime,
    visitedNodes,
    nodesVisited: visited.size,
    edgesExplored,
    pathNodeCount: path.length,
  };
};

export const aStarPathfinding = async (
  graph: Graph,
  startCoord: Coord,
  goalCoord: Coord
): Promise<PathfindingResult> => {
  return dijkstraPathfinding(graph, startCoord, goalCoord, 'a-star');
};

export async function bellmanFordPathfinding(
  graph: Graph,
  start: Coord,
  end: Coord
): Promise<PathfindingResult> {
  const startTime = performance.now();

  if (!graph || !graph.nodes || !graph.edges) {
    throw new Error('Invalid graph: nodes or edges are missing');
  }

  const startNode = findNearestNode(graph.nodes, start);
  const goalNode = findNearestNode(graph.nodes, end);
  if (!startNode || !goalNode) {
    throw new Error('Start or end node not found in the graph.');
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visitedNodes: number[][] = [];
  const visited = new Set<string>();
  let edgesExplored = 0;
  let totalDistance = 0;

  for (const node of graph.nodes.keys()) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(startNode.osmid, 0);
  visited.add(startNode.osmid);
  visitedNodes.push([startNode.lng, startNode.lat]);

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
    if (!changesMade) break;
  }

  for (const [source, edgeList] of graph.edges.entries()) {
    for (const edge of edgeList) {
      if (distances.get(source)! + edge.weight < distances.get(edge.target)!) {
        throw new Error('Graph contains a negative cycle');
      }
      edgesExplored++;
    }
  }

  if (distances.get(goalNode.osmid)! === Infinity) {
    throw new Error('No path found between start and end nodes.');
  }

  const path: number[][] = [];
  let current: string | null = goalNode.osmid;

  while (current) {
    const node = graph.nodes.get(current)!;
    path.unshift([node.lng, node.lat]);
    const prev = previous.get(current);
    if (prev) {
      const edges = graph.edges.get(prev) || [];
      const edge = edges.find(e => e.target === current);
      if (edge) totalDistance += edge.weight;
    }
    current = prev || null;
  }

  if (path.length === 0) throw new Error("No path found");

  const endTime = performance.now();

  return {
    path,
    distance: totalDistance / 1000,
    time: endTime - startTime,
    nodesVisited: visited.size,
    visitedNodes,
    edgesExplored,
    pathNodeCount: path.length,
  };
}

function calculateKey(nodeId: string, startNode: Node, km: number, g: Map<string, number>, rhs: Map<string, number>, heuristic: (a: Node, b: Node) => number, graph: Graph): [number, number] {
  const node = graph.nodes.get(nodeId)!;
  const gValue = g.get(nodeId) ?? Infinity;
  const rhsValue = rhs.get(nodeId) ?? Infinity;
  const h = heuristic(startNode, node);
  const min = Math.min(gValue, rhsValue);
  return [min + h + km, min];
}

// Added debugging logs to trace the values of key variables in dStarLitePathfinding
export const dStarLitePathfinding = async (
  graph: Graph,
  startCoord: Coord,
  goalCoord: Coord,
  blockedEdges?: { source: string; target: string }[]
): Promise<PathfindingResult> => {
  const heuristic = (a: Node, b: Node) => haversineDistance(a, b);
  const updatedGraph = blockUserEdge(graph, blockedEdges);
  const startNode = findNearestNode(updatedGraph.nodes, startCoord);
  const goalNode = findNearestNode(updatedGraph.nodes, goalCoord);
  if (!startNode || !goalNode) throw new Error('Start or goal node not found');

  console.log('Start Node:', startNode);
  console.log('Goal Node:', goalNode);

  const g = new Map<string, number>();
  const rhs = new Map<string, number>();
  const pq = new MinHeap<string>((a, b) => {
    const ka = calculateKey(a, startNode, 0, g, rhs, heuristic, updatedGraph);
    const kb = calculateKey(b, startNode, 0, g, rhs, heuristic, updatedGraph);
    return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1] - kb[1];
  });

  let km = 0;

  updatedGraph.nodes.forEach((_, osmid) => {
    g.set(osmid, Infinity);
    rhs.set(osmid, Infinity);
  });
  rhs.set(goalNode.osmid, 0);
  pq.insert(goalNode.osmid);

  const updateVertex = (u: string) => {
    if (u !== goalNode.osmid) {
      const neighbors = updatedGraph.edges.get(u) ?? [];
      rhs.set(
        u,
        Math.min(...neighbors.map(e =>
          (g.get(e.target) ?? Infinity) + e.weight
        ))
      );
    }
    pq.remove(u);
    if ((g.get(u) ?? Infinity) !== (rhs.get(u) ?? Infinity)) {
      pq.insert(u);
    }
  };

  const visitedNodes: string[] = [];
  const computeShortestPath = () => {
    while (
      !pq.isEmpty() &&
      (calculateKey(pq.peek()!, startNode, km, g, rhs, heuristic, updatedGraph) <
        calculateKey(startNode.osmid, startNode, km, g, rhs, heuristic, updatedGraph) ||
        (rhs.get(startNode.osmid) ?? Infinity) !== (g.get(startNode.osmid) ?? Infinity))
    ) {
      const u = pq.extractMin()!;
      visitedNodes.push(u);
      console.log('Processing node:', u);
      console.log('g:', g.get(u), 'rhs:', rhs.get(u));

      if ((g.get(u) ?? Infinity) > (rhs.get(u) ?? Infinity)) {
        g.set(u, rhs.get(u)!);
        const neighbors = updatedGraph.edges.get(u) ?? [];
        for (const edge of neighbors) {
          if (edge.blocked || updatedGraph.blockedNodes?.has(edge.target)) continue;
          updateVertex(edge.target);
        }
      } else {
        g.set(u, Infinity);
        updateVertex(u);
        const neighbors = updatedGraph.edges.get(u) ?? [];
        for (const edge of neighbors) {
          if (edge.blocked || updatedGraph.blockedNodes?.has(edge.target)) continue;
          updateVertex(edge.target);
        }
      }
    }
  };

  const startTime = performance.now();
  computeShortestPath();

  if ((g.get(startNode.osmid) ?? Infinity) === Infinity) {
    throw new Error('No valid path found');
  }

  const path: number[][] = [];
  let current = startNode.osmid;
  while (current !== goalNode.osmid) {
    const node = updatedGraph.nodes.get(current)!;
    path.push([node.lng, node.lat]);
    const neighbors = updatedGraph.edges.get(current) ?? [];
    let nextNode: string | null = null;
    let minCost = Infinity;
    for (const edge of neighbors) {
      if (edge.blocked) continue;
      const cost = (g.get(edge.target) ?? Infinity) + edge.weight;
      if (cost < minCost) {
        minCost = cost;
        nextNode = edge.target;
      }
    }
    if (!nextNode) throw new Error('No valid path found during reconstruction');
    current = nextNode;
  }
  path.push([goalNode.lng, goalNode.lat]);

  const endTime = performance.now();
  const distance = path.reduce((acc, _, i, arr) => {
    if (i === 0) return acc;
    return acc + haversineDistance(
      { lat: arr[i - 1][1], lng: arr[i - 1][0] },
      { lat: arr[i][1], lng: arr[i][0] }
    );
  }, 0) / 1000;

  console.log('Path:', path);
  console.log('Visited Nodes:', visitedNodes);

  return {
    path: path,
    distance: distance,
    time: endTime - startTime,
    visitedNodes: visitedNodes.map(id => {
      const n = updatedGraph.nodes.get(id)!;
      return [n.lng, n.lat];
    }),
    nodesVisited: visitedNodes.length,
    edgesExplored: visitedNodes.length * 2, // Adjust this with actual edge count if available
    pathNodeCount: path.length,
  };
};

// GBFS Implementation (Greedy Best-First Search, uses only heuristic)
export async function gbfsPathfinding(
  graph: Graph,
  start: Coord,
  end: Coord
): Promise<PathfindingResult> {
  const startTime = performance.now();

  if (!graph || !graph.nodes || !graph.edges) {
    throw new Error('Invalid graph: nodes or edges are missing');
  }

  const startNode = findNearestNode(graph.nodes, start);
  const endNode = findNearestNode(graph.nodes, end);
  if (!startNode || !endNode) {
    throw new Error('Start or end node not found in the graph.');
  }

  const hScores = new Map<string, number>(); // Heuristic scores (estimated distance to end)
  const previous = new Map<string, string | null>();
  const pq = new PriorityQueue<string>();
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

  return {
    path,
    distance: totalDistance / 1000,
    time: endTime - startTime,
    nodesVisited: visited.size,
    visitedNodes,
    edgesExplored,
    pathNodeCount: path.length,
  };
}

export const algorithms: Algorithm[] = [
  { id: 'dijkstra', name: 'Dijkstra', description: "Finds shortest path by exploring all possible directions equally" },
  { id: 'a-star', name: 'A*', description: "Uses heuristics to find shortest path more efficiently" },
  { id: 'd-star-lite', name: 'D* Lite', description: "Optimized for dynamic environments with changing edge costs" },
  { id: 'gbfs', name: 'Greedy Best-First Search', description: "Prioritizes nodes closest to the destination" },
  { id: 'bellman-ford', name: 'Bellman-Ford', description: "Handles negative weights but is slower than Dijkstra" }
];

export const getPerformanceMetrics = (algorithmId: string, distance: number) => {
  const baseTime = distance * 10;
  const baseNodes = distance * 100;
  
  const metrics: Record<string, { time: string; nodes: number }> = {
    dijkstra: {
      time: `${(baseTime * 1.2).toFixed(2)}s`,
      nodes: Math.floor(baseNodes * 1.5)
    },
    'a-star': {
      time: `${(baseTime * 0.7).toFixed(2)}s`,
      nodes: Math.floor(baseNodes * 0.8)
    },
    'd-star-lite': {
      time: `${(baseTime * 0.9).toFixed(2)}s`,
      nodes: Math.floor(baseNodes * 1.1)
    }
  };

  return metrics[algorithmId] || { time: 'N/A', nodes: 0 };
};

export function isGraphConnected(graph: Graph): boolean {
  const unblockedNodes = Array.from(graph.nodes.values())
    .filter(node => !graph.blockedNodes?.has(node.osmid));
  
  if (unblockedNodes.length === 0) return false;

  const visited = new Set<string>();
  const stack = [unblockedNodes[0].osmid];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (!visited.has(current)) {
      visited.add(current);
      const edges = graph.edges.get(current) || [];
      for (const edge of edges) {
        if (!edge.blocked && !graph.blockedNodes?.has(edge.target)) {
          stack.push(edge.target);
        }
      }
    }
  }

  return visited.size === unblockedNodes.length;
}

async function retryPathfinding(
  pathfindingFunction: () => Promise<PathfindingResult>,
  maxRetries: number = 3,
  delay: number = 300
): Promise<PathfindingResult> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await pathfindingFunction();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`Pathfinding failed after ${maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unexpected error in retry logic.");
}

export function reconstructPath(startNode: Node, goalNode: Node, updatedGraph: Graph): number[][] {
  const path: number[][] = [];
  const visited = new Set<string>();
  let current = startNode.osmid;

  if (!current || !updatedGraph.nodes.has(current)) {
    throw new Error("Invalid start node ID");
  }

  path.push([startNode.lng, startNode.lat]);
  visited.add(current);

  const maxSteps = 10000;
  let steps = 0;

  while (current !== goalNode.osmid && steps < maxSteps) {
    const neighbors = updatedGraph.edges.get(current)?.filter(e => !e.blocked) ?? [];
    let minCost = Infinity;
    let nextNodeId: string | null = null;

    for (const edge of neighbors) {
      if (!visited.has(edge.target) && edge.weight < minCost) {
        minCost = edge.weight;
        nextNodeId = edge.target;
      }
    }

    if (!nextNodeId) {
      throw new Error("No path found to goal.");
    }

    visited.add(nextNodeId);
    const nextNode = updatedGraph.nodes.get(nextNodeId);
    if (!nextNode) break;

    path.push([nextNode.lng, nextNode.lat]);
    current = nextNodeId;
    steps++;
  }

  if (current !== goalNode.osmid) {
    throw new Error("Path reconstruction failed: reached max steps or disconnected graph.");
  }

  return path;
}

const testGraph: Graph = {
  nodes: new Map([
    ['1', { osmid: '1', lat: 0, lng: 0 }],
    ['2', { osmid: '2', lat: 0, lng: 1 }],
    ['3', { osmid: '3', lat: 1, lng: 0 }],
  ]),
  edges: new Map([
    ['1', [{ source: '1', target: '2', weight: 1 }]],
    ['2', [{ source: '2', target: '1', weight: 1 }]],
    ['3', []],
  ]),
};

console.log('Is testGraph connected?', isGraphConnected(testGraph));