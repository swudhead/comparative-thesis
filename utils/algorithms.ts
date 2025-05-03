// Ensure this utility exists or implement it
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
  blockedNodes?: Set<string> // Add this parameter
): Node | null => {
  let nearest: Node | null = null;
  let minDistance = Infinity;

  for (const node of nodes.values()) {
    // Skip blocked nodes
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

  // Block edges
  blockedEdges?.forEach(({ source, target }) => {
    newEdges.set(
      source,
      newEdges.get(source)?.map(e => 
        e.target === target ? { ...e, blocked: true } : e
      ) ?? []
    );
  });

  // Remove edges connected to blocked nodes
  blockedNodes?.forEach(nodeId => {
    // Remove outgoing edges
    newEdges.delete(nodeId);
    // Remove incoming edges
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
  algorithmId: string
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

  graph.nodes.forEach((_, osmid) => {
    distances.set(osmid, Infinity);
    previous.set(osmid, null);
  });

  distances.set(startNode.osmid, 0);
  pq.enqueue(startNode.osmid, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    visited.add(current);

    if (current === goalNode.osmid) break;

    const edges = graph.edges.get(current) || [];
    for (const edge of edges) {
      // Add blocked node check
      if (edge.blocked || graph.blockedNodes?.has(edge.target)) continue;
      
      const alt = distances.get(current)! + edge.weight;
      if (alt < distances.get(edge.target)!) {
        distances.set(edge.target, alt);
        previous.set(edge.target, current);
        pq.enqueue(edge.target, alt);
      }
    }
  }

  // Reconstruct path
  const path: number[][] = [];
  let current = goalNode.osmid;
  while (current) {
    const node = graph.nodes.get(current)!;
    path.unshift([node.lng, node.lat]);
    current = previous.get(current) || '';
  }

  if (path.length === 0) throw new Error("No path found");

  const endTime = performance.now();
  const distance = distances.get(goalNode.osmid)! / 1000; // Convert to km

  return {
    path,
    distance,
    time: endTime - startTime,
    visitedNodes: Array.from(visited).map(id => {
      const n = graph.nodes.get(id)!;
      return [n.lng, n.lat];
    }),
    nodesVisited: visited.size,
  };
};

export const aStarPathfinding = async (
  graph: Graph,
  startCoord: Coord,
  goalCoord: Coord
): Promise<PathfindingResult> => {
  if (!isGraphConnected(graph)) {
    throw new Error("The graph is not fully connected.");
  }

  const startNode = findNearestNode(graph.nodes, startCoord);
  const goalNode = findNearestNode(graph.nodes, goalCoord);
  if (!startNode || !goalNode) throw new Error("Start or goal node not found");

  const startTime = performance.now();
  const openSet = new PriorityQueue<string>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const visited = new Set<string>();

  graph.nodes.forEach((_, osmid) => {
    gScore.set(osmid, Infinity);
    fScore.set(osmid, Infinity);
  });

  gScore.set(startNode.osmid, 0);
  fScore.set(startNode.osmid, haversineDistance(startNode, goalNode));
  openSet.enqueue(startNode.osmid, fScore.get(startNode.osmid)!);

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;
    visited.add(current);

    if (current === goalNode.osmid) break;

    const edges = graph.edges.get(current) || [];
    for (const edge of edges) {
      // Add blocked node check
      if (edge.blocked || graph.blockedNodes?.has(edge.target)) continue;

      const tentativeGScore = gScore.get(current)! + edge.weight;
      if (tentativeGScore < gScore.get(edge.target)!) {
        cameFrom.set(edge.target, current);
        gScore.set(edge.target, tentativeGScore);
        const targetNode = graph.nodes.get(edge.target)!;
        fScore.set(edge.target, tentativeGScore + haversineDistance(targetNode, goalNode));
        openSet.enqueue(edge.target, fScore.get(edge.target)!);
      }
    }
  }

  // Reconstruct path
  const path: number[][] = [];
  let current = goalNode.osmid;
  while (current) {
    const node = graph.nodes.get(current)!;
    path.unshift([node.lng, node.lat]);
    current = cameFrom.get(current) || '';
  }

  if (path.length === 0) throw new Error("No path found");

  const endTime = performance.now();
  const distance = gScore.get(goalNode.osmid)! / 1000; // Convert to km

  return {
    path,
    distance,
    time: endTime - startTime,
    visitedNodes: Array.from(visited).map(id => {
      const n = graph.nodes.get(id)!;
      return [n.lng, n.lat];
    }),
    nodesVisited: visited.size,
  };
};

function calculateKey(nodeId: string, startNode: Node, km: number, g: Map<string, number>, rhs: Map<string, number>, heuristic: (a: Node, b: Node) => number, graph: Graph): [number, number] {
  const node = graph.nodes.get(nodeId)!;
  const gValue = g.get(nodeId) ?? Infinity;
  const rhsValue = rhs.get(nodeId) ?? Infinity;
  const h = heuristic(startNode, node);
  const min = Math.min(gValue, rhsValue);
  return [min + h + km, min];
}

export const dStarLitePathfinding = async (
  graph: Graph,
  startCoord: Coord,
  goalCoord: Coord,
  blockedEdges?: { source: string; target: string }[]
): Promise<PathfindingResult> => {
  const updatedGraph = blockUserEdge(graph, blockedEdges);
  const startNode = findNearestNode(updatedGraph.nodes, startCoord);
  const goalNode = findNearestNode(updatedGraph.nodes, goalCoord);
  if (!startNode || !goalNode) throw new Error('Start or goal node not found');

  const g = new Map<string, number>();
  const rhs = new Map<string, number>();
  const pq = new MinHeap<string>((a, b) => {
    const ka = calculateKey(a, startNode, km, g, rhs, heuristic, updatedGraph);
    const kb = calculateKey(b, startNode, km, g, rhs, heuristic, updatedGraph);
    return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1] - kb[1];
  });

  const heuristic = (a: Node, b: Node) => haversineDistance(a, b);
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
      visitedNodes.push(u); // Track visited nodes
      if ((g.get(u) ?? Infinity) > (rhs.get(u) ?? Infinity)) {
        g.set(u, rhs.get(u)!);
        const neighbors = updatedGraph.edges.get(u) ?? [];
        for (const edge of neighbors) {
          // Add blocked node check
          if (edge.blocked || updatedGraph.blockedNodes?.has(edge.target)) continue;
          updateVertex(edge.target);
        }
      } else {
        g.set(u, Infinity);
        updateVertex(u);
        const neighbors = updatedGraph.edges.get(u) ?? [];
        for (const edge of neighbors) {
          // Add blocked node check
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

  return {
    path,
    distance,
    time: endTime - startTime,
    visitedNodes: visitedNodes.map(id => {
      const n = updatedGraph.nodes.get(id)!;
      return [n.lng, n.lat];
    }),
    nodesVisited: visitedNodes.length,
  };
};

export const algorithms: Algorithm[] = [
  {
    id: 'dijkstra',
    name: 'Dijkstra',
    description: "Finds shortest path by exploring all possible directions equally"
  },
  {
    id: 'a-star',
    name: 'A*',
    description: "Uses heuristics to find shortest path more efficiently"
  },
  {
    id: 'd-star-lite',
    name: 'D* Lite',
    description: "Optimized for dynamic environments with changing edge costs"
  }
];

export const getPerformanceMetrics = (algorithmId: string, distance: number) => {
  // These are example performance metrics - adjust based on your actual measurements
  const baseTime = distance * 10; // ms per km
  const baseNodes = distance * 100; // nodes per km
  
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
  // Start with first unblocked node
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
        // Skip blocked nodes and edges
        if (!edge.blocked && !graph.blockedNodes?.has(edge.target)) {
          stack.push(edge.target);
        }
      }
    }
  }

  // Compare against unblocked nodes count
  return visited.size === unblockedNodes.length;
}

async function retryPathfinding(
  pathfindingFunction: () => Promise<PathfindingResult>,
  maxRetries: number = 3,
  delay: number = 300 // milliseconds
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
    ['3', []], // Node 3 is isolated
  ]),
};

console.log('Is testGraph connected?', isGraphConnected(testGraph));

