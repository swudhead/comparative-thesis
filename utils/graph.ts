// utils/graph.ts
import { haversineDistance } from './algorithms';

export class Graph {
    nodes: Map<string, { lat: number; lng: number }>;
    edges: Map<string, { target: string; weight: number }[]>;

    constructor(nodes: Map<string, { lat: number; lng: number }>, edgeList: any[]) {
        this.nodes = nodes;
        this.edges = new Map();

        for (const feature of edgeList) {
            const source = feature.properties.u.toString();
            const target = feature.properties.v.toString();
            let weight = parseFloat(feature.properties.length);

            if (isNaN(weight) || weight <= 0) {
                const sourceCoord = this.nodes.get(source);
                const targetCoord = this.nodes.get(target);
                if (sourceCoord && targetCoord) {
                    weight = haversineDistance(sourceCoord, targetCoord);
                    console.log(`Computed weight for edge ${source}-${target}: ${weight}m`);
                } else {
                    console.warn(`Skipping edge ${source}-${target} due to missing coordinates`);
                    continue;
                }
            }

            if (!this.edges.has(source)) this.edges.set(source, []);
            this.edges.get(source)!.push({ target, weight });

            if (!this.edges.has(target)) this.edges.set(target, []);
            this.edges.get(target)!.push({ target: source, weight });
        }

        console.log(`Graph constructed: ${this.nodes.size} nodes, ${this.edges.size} nodes with edges`);
        console.log('Final graph edges:', JSON.stringify(Array.from(this.edges.entries()), null, 2));
    }

    getNodeCoordinates(nodeId: string): { lat: number; lng: number } | null {
        return this.nodes.get(nodeId) || null;
    }

    getNeighbors(nodeId: string): { target: string; weight: number }[] {
        return this.edges.get(nodeId) || [];
    }
}
