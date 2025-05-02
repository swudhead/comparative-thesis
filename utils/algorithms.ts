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

// Simple Priority Queue for Dijkstra's and A*
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

export async function dijkstraPathfinding(
  graph: Graph,
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  algorithm: string = 'dijkstra'
): Promise<{ path: number[][]; distance: number; time: number; nodesVisited: number; visitedNodes: number[][] }> {
  const startTime = performance.now();

  if (!graph || !graph.nodes || !graph.edges) {
    throw new Error('Invalid graph: nodes or edges are missing');
  }

  const startNode = findNearestNode(graph.nodes, start);
  const endNode = findNearestNode(graph.nodes, end);
  if (!startNode || !endNode) {
    throw new Error('Start or end node not found in the graph.');
  }

  console.log(`Nearest start node: ${startNode.osmid}, Nearest end node: ${endNode.osmid}`);

  const distances = new Map<string, number>(); // Actual cost from start
  const fScores = new Map<string, number>(); // Estimated total cost (g + h for A*)
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const visitedNodes: number[][] = [];
  const pq = new PriorityQueue();

  // Haversine heuristic for A*
  const heuristic = (node: Node, endNode: Node): number => {
    return haversineDistance(node, endNode); // Meters
  };

  // Initialize
  for (const node of graph.nodes.keys()) {
    distances.set(node, Infinity);
    fScores.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(startNode.osmid, 0);
  fScores.set(startNode.osmid, algorithm === 'a-star' ? heuristic(startNode, endNode) : 0);
  pq.enqueue(startNode.osmid, fScores.get(startNode.osmid)!);

  // Main loop (Dijkstra's or A* based on algorithm parameter)
  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;

    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current)!;
    visitedNodes.push([node.lng, node.lat]);

    if (current === endNode.osmid) break;

    const edges = graph.edges.get(current) || [];
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
  return {
    path,
    distance: totalDistance / 1000, // Convert meters to kilometers
    time: endTime - startTime,
    nodesVisited: visited.size,
    visitedNodes,
  };
}

export interface algorithm {
  id: string;
  name: string;
}

export const algorithms: algorithm[] = [
  { id: 'dijkstra', name: 'Dijkstra' },
{ id: 'a-star', name: 'A*' },
{ id: 'd-star', name: 'D*' },
{ id: 'd-star-lite', name: 'D* Lite' },
];

export const getPerformanceMetrics = (algorithm: string, distance: number) => {
  const metrics = {
    'a-star': {
      time: `${(distance / 100 + 0.3).toFixed(2)}s`,
      nodes: Math.floor(70 + distance * 10),
      distance: `${distance.toFixed(1)}km`,
    },
    'd-star': {
      time: `${(distance / 100 + 0.8).toFixed(2)}s`,
      nodes: Math.floor(130 + distance * 15),
      distance: `${distance.toFixed(1)}km`,
    },
    'd-star-lite': {
      time: `${(distance / 100 + 0.5).toFixed(2)}s`,
      nodes: Math.floor(110 + distance * 12),
      distance: `${distance.toFixed(1)}km`,
    },
    'dijkstra': {
      time: `${(distance / 100 + 0.4).toFixed(2)}s`,
      nodes: Math.floor(90 + distance * 12),
      distance: `${distance.toFixed(1)}km`,
    },
  };
  return metrics[algorithm as keyof typeof metrics] || metrics['dijkstra'];
};
