// utils/algorithms.ts
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
  'd-star-lite': '#2196F3',
};

// List of available algorithms
export const algorithms: algorithm[] = [
  {
    id: 'dijkstra',
    name: 'Dijkstra',
    description: 'A classic algorithm that guarantees the shortest path in weighted graphs. It works by visiting vertices in order of increasing distance from the source.',
    category: 'Uninformed',
  },
{
  id: 'a-star',
  name: 'A* Search',
  description: 'An extension of Dijkstra that uses heuristics to guide the search toward the goal, typically resulting in faster computation.',
  category: 'Informed',
},
{
  id: 'd-star',
  name: 'D* Algorithm',
  description: 'Designed for environments where the map changes during navigation. It efficiently replans paths when obstacles are discovered.',
  category: 'Dynamic',
},
{
  id: 'd-star-lite',
  name: 'D* Lite',
  description: 'A modern implementation of D* that uses incremental heuristic search to efficiently repair paths in changing environments.',
  category: 'Dynamic',
},
];

// Haversine formula to calculate distance between two points (in meters)
const haversineDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
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

async function fetchDirections(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<{ path: number[][]; distance: number; waypoints: number[][] }> {
  const accessToken = 'pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXd1cWNnajA5ZDQybHNnaHcycjlkbjUifQ.oCwTlpov4vnih1yvkqLrZA';
  const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${accessToken}&waypoints=0;1`;

  console.log('Fetching directions from Mapbox Directions API with URL:', url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch directions: ${data.message || response.statusText}`);
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found between the specified points.');
    }

    const route = data.routes[0];
    const path = route.geometry.coordinates.map((coord: [number, number]) => [coord[0], coord[1]]);

    // Extract waypoints (visited nodes simulation)
    const waypoints = data.waypoints.map((waypoint: any) => {
      const [lng, lat] = waypoint.location;
      return [lng, lat];
    });

    const distanceInKm = route.distance / 1000; // Convert meters to kilometers
    console.log(`Raw distance from API (meters): ${route.distance}, converted to km: ${distanceInKm}`);

    return {
      path,
      distance: distanceInKm,
      waypoints,
    };
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
}

// Dijkstra's algorithm implementation using Mapbox Directions API
export async function dijkstraPathfinding(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<{ path: number[][]; distance: number; time: number; nodesVisited: number; visitedNodes: number[][] }> {
  const startTime = performance.now();

  try {
    const { path, distance, waypoints } = await fetchDirections(start, end);

    // Simulate visited nodes by sampling points from the path
    const visitedNodes: number[][] = [];
    const step = Math.max(1, Math.floor(path.length / 5)); // Sample up to 5 intermediate points
    for (let i = 0; i < path.length; i += step) {
      visitedNodes.push(path[i]);
    }
    // Ensure start and end points are included
    if (!visitedNodes.some(coord => coord[0] === path[0][0] && coord[1] === path[0][1])) {
      visitedNodes.unshift(path[0]);
    }
    if (!visitedNodes.some(coord => coord[0] === path[path.length - 1][0] && coord[1] === path[path.length - 1][1])) {
      visitedNodes.push(path[path.length - 1]);
    }

    const nodesVisited = path.length; // Use total path nodes, not sampled visitedNodes

    const endTime = performance.now();
    console.log(`Computed distance in dijkstraPathfinding: ${distance} km`);

    return {
      path,
      distance, // Already in kilometers
      time: endTime - startTime,
      nodesVisited,
      visitedNodes,
    };
  } catch (error) {
    console.error('Dijkstra pathfinding failed:', error);
    throw new Error('No path found between start and end nodes');
  }
}

// Mock performance metrics for algorithms
export const getPerformanceMetrics = (algorithm: string, distance: number) => {
  console.log(`getPerformanceMetrics called with algorithm: ${algorithm}, distance: ${distance} km`);

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
