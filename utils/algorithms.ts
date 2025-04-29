// Algorithm types and data

export type algorithm = {
  id: string;
  name: string;
  description: string;
  category: string;
};

// Algorithm color mapping
export const algorithmColors = {
  'dijkstra': '#FF9800',
  'a-star': '#4CAF50',
  'd-star': '#9C27B0',
  'd-star-lite': '#2196F3'
};

// List of available algorithms
export const algorithms: algorithm[] = [
  {
    id: 'dijkstra',
    name: 'Dijkstra',
    description: 'A classic algorithm that guarantees the shortest path in weighted graphs. It works by visiting vertices in order of increasing distance from the source.',
    category: 'Uninformed'
  },
  {
    id: 'a-star',
    name: 'A* Search',
    description: 'An extension of Dijkstra that uses heuristics to guide the search toward the goal, typically resulting in faster computation.',
    category: 'Informed'
  },
  {
    id: 'd-star',
    name: 'D* Algorithm',
    description: 'Designed for environments where the map changes during navigation. It efficiently replans paths when obstacles are discovered.',
    category: 'Dynamic'
  },
  {
    id: 'd-star-lite',
    name: 'D* Lite',
    description: 'A modern implementation of D* that uses incremental heuristic search to efficiently repair paths in changing environments.',
    category: 'Dynamic'
  }
];

// Mock function to generate a path between two points (for demonstration purposes)
export const generatePath = (start: {lat: number, lng: number}, end: {lat: number, lng: number}, algorithm: string, points = 10) => {
  const path = [];
  const latStep = (end.lat - start.lat) / points;
  const lngStep = (end.lng - start.lng) / points;
  
  // Add some randomness based on algorithm to simulate different paths
  const jitterFactor = algorithm === 'a-star' ? 0.0002 : 
                       algorithm === 'dijkstra' ? 0.0003 :
                       algorithm === 'd-star' ? 0.0004 : 0.0005;
  
  for (let i = 0; i <= points; i++) {
    // Add some randomness to make it look more realistic
    // No randomness for the start and end points
    const jitter = (i > 0 && i < points) ? (Math.random() - 0.5) * jitterFactor : 0;
    path.push([
      start.lng + lngStep * i + jitter, 
      start.lat + latStep * i + jitter
    ]);
  }
  return path;
};

// Mock performance metrics for algorithms
export const getPerformanceMetrics = (algorithm: string, distance: number) => {
  // Simulated metrics based on algorithm characteristics
  const metrics = {
    'dijkstra': {
      time: `${(1.2 + Math.random() * 0.5).toFixed(2)}s`,
      nodes: Math.floor(120 + Math.random() * 40),
      distance: `${(distance + (Math.random() * 0.1)).toFixed(1)}km`
    },
    'a-star': {
      time: `${(0.7 + Math.random() * 0.3).toFixed(2)}s`,
      nodes: Math.floor(70 + Math.random() * 30),
      distance: `${(distance + (Math.random() * 0.2)).toFixed(1)}km`
    },
    'd-star': {
      time: `${(1.8 + Math.random() * 0.6).toFixed(2)}s`,
      nodes: Math.floor(130 + Math.random() * 30),
      distance: `${(distance + (Math.random() * 0.05)).toFixed(1)}km`
    },
    'd-star-lite': {
      time: `${(1.5 + Math.random() * 0.4).toFixed(2)}s`,
      nodes: Math.floor(110 + Math.random() * 35),
      distance: `${(distance + (Math.random() * 0.1)).toFixed(1)}km`
    }
  };
  
  return metrics[algorithm as keyof typeof metrics];
};