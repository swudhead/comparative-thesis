import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { ChevronDown, Info, Navigation, Settings, BarChart, X, Routes } from 'lucide-react-native';

    // Set access token
    MapboxGL.setAccessToken('pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXd1cWNnajA5ZDQybHNnaHcycjlkbjUifQ.oCwTlpov4vnih1yvkqLrZA');

const ALGORITHMS = [
  { id: 'dijkstra', name: 'Dijkstra', color: '#FF5733' },
  { id: 'astar', name: 'A* Algorithm', color: '#33FF57' },
  { id: 'bellmanford', name: 'Bellman-Ford', color: '#3357FF' },
  { id: 'floyd', name: 'Floyd-Warshall', color: '#F033FF' }
  ];

const TransportAnalysisApp = () => {
const [errorMsg, setErrorMsg] = useState(null);
const [mapLoaded, setMapLoaded] = useState(false);
const [selectedAlgorithm, setSelectedAlgorithm] = useState(ALGORITHMS[0]);
const [showAlgorithmPicker, setShowAlgorithmPicker] = useState(false);
const [selectedStartNode, setSelectedStartNode] = useState(null);
const [selectedEndNode, setSelectedEndNode] = useState(null);
const [pathResult, setPathResult] = useState(null);
const [showMetricsModal, setShowMetricsModal] = useState(false);
const [showInfoModal, setShowInfoModal] = useState(false);
const [selectionMode, setSelectionMode] = useState('start'); // 'start' or 'end'

    // Mock path finding function - in a real app, this would implement the actual algorithms
const findPath = () => {
    if (!selectedStartNode || !selectedEndNode) return;

            // Simulate algorithm running
            setTimeout(() => {
                       // Mock results - in a real app, this would be actual calculated data
                       setPathResult({
                                     algorithm: selectedAlgorithm.name,
                                     distance: 3.2, // km
                                     estimatedTime: 15, // minutes
                                     fare: 50, // pesos
                                     nodeCount: 12,
                                     computationTime: 0.05, // seconds
                                     });
                       }, 1000);
            };

const handleNodePress = (feature) => {
const nodeId = feature.id || 'unknown';
const nodeCoordinates = feature.geometry.coordinates;

    if (selectionMode === 'start') {
      setSelectedStartNode({ id: nodeId, coordinates: nodeCoordinates });
    setSelectionMode('end');
    } else {
    setSelectedEndNode({ id: nodeId, coordinates: nodeCoordinates });
    // After both nodes are selected, find path
    findPath();
    }
    };

const resetSelection = () => {
    setSelectedStartNode(null);
    setSelectedEndNode(null);
    setPathResult(null);
    setSelectionMode('start');
    };

    return (
               <SafeAreaView style={StyleSheet.absoluteFill}>
               {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

               <MapboxGL.MapView
               style={StyleSheet.absoluteFill}
               styleURL={MapboxGL.StyleURL.Street}
               onDidFailLoadingMap={(error) => setErrorMsg(`Map failed to load: ${error.message}`)}
               onDidFinishLoadingMap={() => setMapLoaded(true)}
               attributionEnabled={true}
               compassEnabled={true}
               >
               <MapboxGL.Camera
               zoomLevel={14}
               centerCoordinate={[123.19549, 13.62617]}
               animationDuration={0}
               />

               {/* Edge tileset */}
               <MapboxGL.VectorSource
               id="edges"
               url="mapbox://kazkee.70pt2eky"
               >
               <MapboxGL.LineLayer
               id="edges-layer"
               sourceLayerID="naga_edges_for_mapbox-5b6ynz"
               style={{
               lineColor: '#777777',
               lineWidth: 2,
               lineOpacity: 0.8,
               }}
               />
               </MapboxGL.VectorSource>

               {/* Node tileset */}
               <MapboxGL.VectorSource
               id="nodes"
               url="mapbox://kazkee.04ydv29e"
               >
               <MapboxGL.CircleLayer
               id="nodes-layer"
               sourceLayerID="naga_nodes_for_mapbox-dkbn5x"
               style={{
               circleColor: '#555555',
               circleRadius: 4,
               circleOpacity: 0.8,
               }}
               filter={['!', ['in', ['get', 'id'], ['literal', [
                                                                   selectedStartNode?.id,
                                                                   selectedEndNode?.id
                                                               ].filter(Boolean)]]]
               }
               onPress={(e) => handleNodePress(e.features[0])}
               maxZoomLevel={16}
               minZoomLevel={12}
               />

               {/* Start node */}
               {selectedStartNode && (
                                         <MapboxGL.PointAnnotation
                                         id="startNode"
                                         coordinate={selectedStartNode.coordinates}
                                         title="Start"
                                         >
                                         <View style={[styles.annotationContainer, { backgroundColor: 'green' }]}>
                                         <View style={styles.annotationFill} />
                                         </View>
                                         </MapboxGL.PointAnnotation>
                                     )}

               {/* End node */}
               {selectedEndNode && (
                                       <MapboxGL.PointAnnotation
                                       id="endNode"
                                       coordinate={selectedEndNode.coordinates}
                                       title="End"
                                       >
                                       <View style={[styles.annotationContainer, { backgroundColor: 'red' }]}>
                                       <View style={styles.annotationFill} />
                                       </View>
                                       </MapboxGL.PointAnnotation>
                                   )}

               {/* Path layer - would show actual calculated path in real implementation */}
               {pathResult && selectedStartNode && selectedEndNode && (
                                                                          <MapboxGL.ShapeSource
                                                                          id="pathSource"
                                                                          shape={{
                                                                          type: 'Feature',
                                                                          geometry: {
                                                                          type: 'LineString',
                                                                          coordinates: [selectedStartNode.coordinates, selectedEndNode.coordinates]
                                                                          }
                                                                          }}
                                                                          >
                                                                          <MapboxGL.LineLayer
                                                                          id="pathLayer"
                                                                          style={{
                                                                          lineColor: selectedAlgorithm.color,
                                                                          lineWidth: 5,
                                                                          lineCap: 'round',
                                                                          lineJoin: 'round',
                                                                          }}
                                                                          />
                                                                          </MapboxGL.ShapeSource>
                                                                      )}
               </MapboxGL.MapView>

               {/* Algorithm Selector */}
               <View style={styles.algorithmSelector}>
               <TouchableOpacity
               style={styles.algorithmButton}
               onPress={() => setShowAlgorithmPicker(!showAlgorithmPicker)}
               >
               <Text style={styles.algorithmText}>{selectedAlgorithm.name}</Text>
               <ChevronDown color="#fff" size={16} />
               </TouchableOpacity>

               {showAlgorithmPicker && (
                                           <View style={styles.algorithmDropdown}>
                                           {ALGORITHMS.map(algo => (
                                                                       <TouchableOpacity
                                                                       key={algo.id}
                                                                       style={[styles.algorithmOption,
                                                                               selectedAlgorithm.id === algo.id && styles.selectedOption
                                                                              ]}
                                                                       onPress={() => {
                                                                       setSelectedAlgorithm(algo);
                                                                       setShowAlgorithmPicker(false);
                                                                       if (selectedStartNode && selectedEndNode) findPath();
                                                                       }}
                                                                       >
                                                                       <View style={[styles.colorIndicator, { backgroundColor: algo.color }]} />
                                                                       <Text style={styles.algorithmOptionText}>{algo.name}</Text>
                                                                       </TouchableOpacity>
                                                                   ))}
                                           </View>
                                       )}
               </View>

               {/* Instruction Panel */}
               <View style={styles.instructionPanel}>
               <Text style={styles.instructionTitle}>
               {!selectedStartNode ? 'Select start node' :
               !selectedEndNode ? 'Select end node' :
               'Route calculated'}
               </Text>

               {pathResult && (
                                  <View style={styles.pathStats}>
                                  <Text style={styles.pathStatsText}>Distance: {pathResult.distance} km</Text>
                                  <Text style={styles.pathStatsText}>Time: ~{pathResult.estimatedTime} min</Text>
                                  <Text style={styles.pathStatsText}>Fare: ₱{pathResult.fare}</Text>
                                  </View>
                              )}

               <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
               <Text style={styles.resetButtonText}>Reset</Text>
               </TouchableOpacity>
               </View>

               {/* Action Buttons */}
               <View style={styles.actionButtons}>
               <TouchableOpacity
               style={styles.iconButton}
               onPress={() => setShowInfoModal(true)}
               >
               <Info color="#fff" size={24} />
               </TouchableOpacity>

               <TouchableOpacity
               style={styles.iconButton}
               onPress={() => setShowMetricsModal(true)}
               disabled={!pathResult}
               >
               <BarChart color={pathResult ? "#fff" : "#aaa"} size={24} />
               </TouchableOpacity>
               </View>

               {/* Algorithm Performance Metrics Modal */}
               <Modal
               visible={showMetricsModal}
               transparent={true}
               animationType="slide"
               >
               <View style={styles.modalContainer}>
               <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Algorithm Performance</Text>
               <TouchableOpacity onPress={() => setShowMetricsModal(false)}>
               <X size={24} color="#333" />
               </TouchableOpacity>
               </View>

               {pathResult && (
                                  <ScrollView style={styles.metricsContainer}>
                                  <View style={styles.metricItem}>
                                  <Text style={styles.metricLabel}>Algorithm:</Text>
                                  <Text style={styles.metricValue}>{pathResult.algorithm}</Text>
                                  </View>
                                  <View style={styles.metricItem}>
                                  <Text style={styles.metricLabel}>Computation Time:</Text>
                                  <Text style={styles.metricValue}>{pathResult.computationTime} sec</Text>
                                  </View>
                                  <View style={styles.metricItem}>
                                  <Text style={styles.metricLabel}>Nodes Traversed:</Text>
                                  <Text style={styles.metricValue}>{pathResult.nodeCount}</Text>
                                  </View>
                                  <View style={styles.metricItem}>
                                  <Text style={styles.metricLabel}>Distance:</Text>
                                  <Text style={styles.metricValue}>{pathResult.distance} km</Text>
                                  </View>
                                  <View style={styles.metricItem}>
                                  <Text style={styles.metricLabel}>Est. Travel Time:</Text>
                                  <Text style={styles.metricValue}>{pathResult.estimatedTime} min</Text>
                                  </View>
                                  <View style={styles.metricItem}>
                                  <Text style={styles.metricLabel}>Fare Estimate:</Text>
                                  <Text style={styles.metricValue}>₱{pathResult.fare}</Text>
                                  </View>

                                  <View style={styles.comparisonSection}>
                                  <Text style={styles.comparisonTitle}>Algorithm Comparison</Text>
                                  <Text style={styles.comparisonText}>
                                  Compared to other algorithms, {selectedAlgorithm.name} performs
                                  {selectedAlgorithm.id === 'astar' ? ' better in terms of computation speed while maintaining optimal path selection.' :
                                  selectedAlgorithm.id === 'dijkstra' ? ' reliably for finding the shortest path but with higher computation costs.' :
                                  selectedAlgorithm.id === 'bellmanford' ? ' well even with negative edge weights but requires more computation time.' :
                                  ' comprehensively by calculating all possible routes but with highest computation requirements.'}
                                  </Text>
                                  </View>
                                  </ScrollView>
                              )}
               </View>
               </View>
               </Modal>

               {/* Info Modal */}
               <Modal
               visible={showInfoModal}
               transparent={true}
               animationType="slide"
               >
               <View style={styles.modalContainer}>
               <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>About This Study</Text>
               <TouchableOpacity onPress={() => setShowInfoModal(false)}>
               <X size={24} color="#333" />
               </TouchableOpacity>
               </View>

               <ScrollView style={styles.infoContainer}>
               <Text style={styles.infoTitle}>Comparative Analysis of Navigation Algorithms</Text>
               <Text style={styles.infoSubtitle}>
               For Optimal Pathfinding of Public Utility Tricycle and E-Trikes
               </Text>

               <Text style={styles.infoParagraph}>
               This research application visualizes and compares different pathfinding algorithms
               on the transportation network of Naga City. The study combines algorithmic simulation
               with a mobile-based prototype for visualization.
               </Text>

               <Text style={styles.infoSectionTitle}>Research Objectives:</Text>
               <Text style={styles.infoParagraph}>
               • Evaluate performance metrics of different navigation algorithms
               </Text>
               <Text style={styles.infoParagraph}>
               • Identify optimal routing strategies for tricycle and e-trike services
               </Text>
               <Text style={styles.infoParagraph}>
               • Develop a practical visualization tool for transportation planning
               </Text>

               <Text style={styles.infoSectionTitle}>How to Use This Tool:</Text>
               <Text style={styles.infoParagraph}>
               1. Select an algorithm from the dropdown menu
               </Text>
               <Text style={styles.infoParagraph}>
               2. Tap on a node to set the starting point
               </Text>
               <Text style={styles.infoParagraph}>
               3. Tap on another node to set the destination
               </Text>
               <Text style={styles.infoParagraph}>
               4. View the calculated route and performance metrics
               </Text>
               <Text style={styles.infoParagraph}>
               5. Compare results with different algorithms
               </Text>
               </ScrollView>
               </View>
               </View>
               </Modal>
               </SafeAreaView>
           );
    };

const styles = StyleSheet.create({
                                 errorText: {
                                 color: 'red',
                                 padding: 10,
                                 zIndex: 10,
                                 backgroundColor: 'rgba(255,255,255,0.8)',
                                 },
                                 annotationContainer: {
                                 width: 16,
                                 height: 16,
                                 borderRadius: 8,
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 borderWidth: 2,
                                 borderColor: 'white',
                                 },
                                 annotationFill: {
                                 width: 8,
                                 height: 8,
                                 borderRadius: 4,
                                 backgroundColor: 'white',
                                 },
                                 algorithmSelector: {
                                 position: 'absolute',
                                 top: 20,
                                 left: 20,
                                 zIndex: 5,
                                 },
                                 algorithmButton: {
                                 backgroundColor: '#0077B6',
                                 paddingHorizontal: 15,
                                 paddingVertical: 10,
                                 borderRadius: 8,
                                 flexDirection: 'row',
                                 alignItems: 'center',
                                 justifyContent: 'space-between',
                                 minWidth: 180,
                                 },
                                 algorithmText: {
                                 color: 'white',
                                 fontWeight: 'bold',
                                 marginRight: 10,
                                 },
                                 algorithmDropdown: {
                                 backgroundColor: 'white',
                                 borderRadius: 8,
                                 marginTop: 5,
                                 padding: 5,
                                 shadowColor: '#000',
                                 shadowOffset: { width: 0, height: 2 },
                                 shadowOpacity: 0.25,
                                 shadowRadius: 3.84,
                                 elevation: 5,
                                 },
                                 algorithmOption: {
                                 paddingVertical: 10,
                                 paddingHorizontal: 15,
                                 flexDirection: 'row',
                                 alignItems: 'center',
                                 },
                                 selectedOption: {
                                 backgroundColor: '#f0f0f0',
                                 },
                                 colorIndicator: {
                                 width: 12,
                                 height: 12,
                                 borderRadius: 6,
                                 marginRight: 10,
                                 },
                                 algorithmOptionText: {
                                 color: '#333',
                                 },
                                 instructionPanel: {
                                 position: 'absolute',
                                 bottom: 20,
                                 left: 20,
                                 right: 20,
                                 backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                 borderRadius: 8,
                                 padding: 15,
                                 shadowColor: '#000',
                                 shadowOffset: { width: 0, height: 2 },
                                 shadowOpacity: 0.25,
                                 shadowRadius: 3.84,
                                 elevation: 5,
                                 },
                                 instructionTitle: {
                                 fontWeight: 'bold',
                                 fontSize: 16,
                                 marginBottom: 10,
                                 textAlign: 'center',
                                 color: '#333',
                                 },
                                 pathStats: {
                                 marginBottom: 10,
                                 },
                                 pathStatsText: {
                                 fontSize: 14,
                                 marginBottom: 5,
                                 color: '#333',
                                 },
                                 resetButton: {
                                 backgroundColor: '#FF6B6B',
                                 padding: 10,
                                 borderRadius: 8,
                                 alignItems: 'center',
                                 },
                                 resetButtonText: {
                                 color: 'white',
                                 fontWeight: 'bold',
                                 },
                                 actionButtons: {
                                 position: 'absolute',
                                 top: 20,
                                 right: 20,
                                 flexDirection: 'column',
                                 zIndex: 5,
                                 },
                                 iconButton: {
                                 backgroundColor: '#0077B6',
                                 width: 44,
                                 height: 44,
                                 borderRadius: 22,
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 marginBottom: 10,
                                 shadowColor: '#000',
                                 shadowOffset: { width: 0, height: 2 },
                                 shadowOpacity: 0.25,
                                 shadowRadius: 3.84,
                                 elevation: 5,
                                 },
                                 modalContainer: {
                                 flex: 1,
                                 justifyContent: 'center',
                                 alignItems: 'center',
                                 backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                 },
                                 modalContent: {
                                 backgroundColor: 'white',
                                 borderRadius: 12,
                                 padding: 20,
                                 width: '90%',
                                 maxHeight: '80%',
                                 shadowColor: '#000',
                                 shadowOffset: { width: 0, height: 2 },
                                 shadowOpacity: 0.25,
                                 shadowRadius: 3.84,
                                 elevation: 5,
                                 },
                                 modalHeader: {
                                 flexDirection: 'row',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 marginBottom: 15,
                                 paddingBottom: 15,
                                 borderBottomWidth: 1,
                                 borderBottomColor: '#eee',
                                 },
                                 modalTitle: {
                                 fontSize: 18,
                                 fontWeight: 'bold',
                                 color: '#333',
                                 },
                                 metricsContainer: {
                                 maxHeight: 400,
                                 },
                                 metricItem: {
                                 flexDirection: 'row',
                                 justifyContent: 'space-between',
                                 paddingVertical: 10,
                                 borderBottomWidth: 1,
                                 borderBottomColor: '#eee',
                                 },
                                 metricLabel: {
                                 fontSize: 14,
                                 color: '#666',
                                 flex: 1,
                                 },
                                 metricValue: {
                                 fontSize: 14,
                                 fontWeight: 'bold',
                                 color: '#333',
                                 flex: 1,
                                 textAlign: 'right',
                                 },
                                 comparisonSection: {
                                 marginTop: 20,
                                 padding: 15,
                                 backgroundColor: '#f5f5f5',
                                 borderRadius: 8,
                                 },
                                 comparisonTitle: {
                                 fontSize: 16,
                                 fontWeight: 'bold',
                                 marginBottom: 10,
                                 color: '#333',
                                 },
                                 comparisonText: {
                                 fontSize: 14,
                                 lineHeight: 20,
                                 color: '#333',
                                 },
                                 infoContainer: {
                                 maxHeight: 400,
                                 },
                                 infoTitle: {
                                 fontSize: 18,
                                 fontWeight: 'bold',
                                 color: '#333',
                                 marginBottom: 5,
                                 },
                                 infoSubtitle: {
                                 fontSize: 14,
                                 color: '#666',
                                 marginBottom: 15,
                                 fontStyle: 'italic',
                                 },
                                 infoSectionTitle: {
                                 fontSize: 16,
                                 fontWeight: 'bold',
                                 color: '#333',
                                 marginTop: 15,
                                 marginBottom: 5,
                                 },
                                 infoParagraph: {
                                 fontSize: 14,
                                 lineHeight: 20,
                                 color: '#333',
                                 marginBottom: 5,
                                 },
                                 });

    export default TransportAnalysisApp;
