import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';

// Set access token
MapboxGL.setAccessToken('pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXd1cWNnajA5ZDQybHNnaHcycjlkbjUifQ.oCwTlpov4vnih1yvkqLrZA');

const AlgorithmComparisonUI = ({ mapLoaded, onAlgorithmSelect, onStartPathfinding }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [algorithmInfo, setAlgorithmInfo] = useState({});
  const [comparisonResults, setComparisonResults] = useState(null);



  // Mock data for algorithm comparison
  const algorithms = [
    { id: 'dijkstra', name: 'Dijkstra', description: 'Optimal for weighted graphs' },
    { id: 'a-star', name: 'A* Search', description: 'Uses heuristics for faster searches' },
    { id: 'bellman-ford', name: 'D* Star', description: 'Handles negative edge weights' },
    { id: 'floyd-warshall', name: 'D* Star Lite', description: 'All-pairs shortest path' }
  ];

  // Mock function to simulate algorithm computation
  const runPathfindingSimulation = () => {
    setIsComputing(true);

    // Simulate computation delay
    setTimeout(() => {
      setIsComputing(false);
      setShowResults(true);

      // Mock comparison results
      setComparisonResults({
        'dijkstra': { time: '1.45s', distance: '2.3km', nodes: 142 },
        'a-star': { time: '0.82s', distance: '2.4km', nodes: 87 },
        'bellman-ford': { time: '2.31s', distance: '2.3km', nodes: 142 },
        'floyd-warshall': { time: '3.27s', distance: '2.3km', nodes: 142 }
      });
    }, 2000);
  };

  const openAlgorithmInfo = (algorithm) => {
    setAlgorithmInfo(algorithm);
    setModalVisible(true);
  };

  const handleSelectAlgorithm = (algorithm) => {
    setSelectedAlgorithm(algorithm);
    if (onAlgorithmSelect) onAlgorithmSelect(algorithm);
  };

    const handleStartPathfinding = () => {
      if (!startPoint || !endPoint) {
        alert('Please select both start and end points first');
        return;
      }
      runPathfindingSimulation();
      if (onStartPathfinding) onStartPathfinding(selectedAlgorithm, startPoint, endPoint);
    };

      return (
        <>
        {/* Main Control Panel */}
        <View style={styles.controlPanel}>
        <View style={styles.headerBar}>
        <Text style={styles.headerText}>Comparative Analysis Simulator</Text>
        </View>

        {/* Algorithm Selection */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.algorithmScroll}>
        {algorithms.map((algorithm) => (
          <TouchableOpacity
          key={algorithm.id}
          onPress={() => handleSelectAlgorithm(algorithm)}
          onLongPress={() => openAlgorithmInfo(algorithm)}
          style={[
            styles.algorithmButton,
            selectedAlgorithm?.id === algorithm.id ? styles.selectedAlgorithmButton : null
          ]}
          >
          <Text style={
            selectedAlgorithm?.id === algorithm.id ? styles.selectedAlgorithmText : styles.algorithmText
          }>
          {algorithm.name}
          </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actionContainer}>
        <View style={styles.pointButtonsContainer}>
        <TouchableOpacity
        style={[
          styles.setPointButton,
          styles.setStartButton,
          !startPoint && styles.disabledButton
        ]}
        onPress={() => setStartPoint({ lat: 13.62617, lng: 123.19549 })}
        >
        <Text style={startPoint ? styles.setPointButtonText : styles.disabledButtonText}>Set Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[
          styles.setPointButton,
          styles.setEndButton,
          !endPoint && styles.disabledButton
        ]}
        onPress={() => setEndPoint({ lat: 13.63617, lng: 123.20549 })}
        >
        <Text style={endPoint ? styles.setPointButtonText : styles.disabledButtonText}>Set End</Text>
        </TouchableOpacity>
        </View>

        <TouchableOpacity
        style={[
          styles.findPathButton,
          !selectedAlgorithm && styles.disabledButton
        ]}
        disabled={!selectedAlgorithm || isComputing}
        onPress={handleStartPathfinding}
        >
        {isComputing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={[
            styles.findPathButtonText,
            !selectedAlgorithm && styles.disabledButtonText
          ]}>
          Find Path
          </Text>
        )}
        </TouchableOpacity>
        </View>

        {/* Results Section (conditionally rendered) */}
        {showResults && comparisonResults && (
          <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results Comparison:</Text>
          <View style={styles.resultsBox}>
          <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Time</Text>
          <Text style={styles.resultValue}>{comparisonResults[selectedAlgorithm.id].time}</Text>
          </View>
          <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Distance</Text>
          <Text style={styles.resultValue}>{comparisonResults[selectedAlgorithm.id].distance}</Text>
          </View>
          <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Nodes</Text>
          <Text style={styles.resultValue}>{comparisonResults[selectedAlgorithm.id].nodes}</Text>
          </View>
          </View>
          </View>
        )}
        </View>

        {/* Header Toolbar */}
        <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton}>
        <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Naga City Transportation Network</Text>
        <TouchableOpacity style={styles.toolbarButton}>
        <FontAwesome5 name="layer-group" size={24} color="black" />
        </TouchableOpacity>
        </View>

        {/* Algorithm Info Modal */}
        <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        >
        <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{algorithmInfo.name}</Text>
        <Text style={styles.modalDescription}>{algorithmInfo.description}</Text>

        <Text style={styles.characteristicsTitle}>Characteristics:</Text>
        <View style={styles.characteristicsBox}>
        {algorithmInfo.id === 'dijkstra' && (
          <Text>• Guarantees the shortest path in weighted graphs{'\n'}• Time complexity: O(E + V log V){'\n'}• Ideal for route planning with variable costs</Text>
        )}
        {algorithmInfo.id === 'a-star' && (
          <Text>• Uses heuristics to speed up search{'\n'}• Time complexity: O(E){'\n'}• Best for scenarios with spatial information</Text>
        )}
        {algorithmInfo.id === 'bellman-ford' && (
          <Text>• Can handle negative edge weights{'\n'}• Time complexity: O(VE){'\n'}• Useful for detecting negative cycles</Text>
        )}
        {algorithmInfo.id === 'floyd-warshall' && (
          <Text>• Finds shortest paths between all pairs{'\n'}• Time complexity: O(V³){'\n'}• Good for dense graphs and all-to-all routing</Text>
        )}
        </View>

        <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setModalVisible(false)}
        >
        <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        </View>
        </View>
        </Modal>

        {/* Map Status Indicator */}
        <View style={styles.mapStatusContainer}>
        <Text style={styles.mapStatusText}>
        {mapLoaded ? "Map Ready" : "Loading Map..."}
        </Text>
        </View>

        {/* Bottom Stats Bar */}
        {selectedAlgorithm && (
          <View style={styles.statsBar}>
          <Text style={styles.statsText}>
          Using <Text style={styles.statsHighlight}>{selectedAlgorithm.name}</Text> algorithm
          </Text>
          </View>
        )}

        <StatusBar style="auto" />
        </>
      );
};

const PathfindingComparison = () => {
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [pathResult, setPathResult] = useState(null);

  // Handle algorithm selection
  const handleAlgorithmSelect = (algorithm) => {
    console.log(`Selected algorithm: ${algorithm.name}`);
    // Logic to prepare algorithm
  };

  // Handle start pathfinding action
  const handleStartPathfinding = (algorithm, start, end) => {
    console.log(`Starting pathfinding with ${algorithm.name} from ${start.lat},${start.lng} to ${end.lat},${end.lng}`);

    // Example path data - would be replaced with actual algorithm result
    const mockPath = [
      [123.19549, 13.62617],
      [123.19649, 13.62717],
      [123.19749, 13.62817],
      [123.19849, 13.62917],
      [123.19949, 13.63017],
      [123.20049, 13.63117],
      [123.20149, 13.63217],
      [123.20249, 13.63317],
      [123.20349, 13.63417],
      [123.20449, 13.63517],
      [123.20549, 13.63617]
    ];

    setPathResult({
      coordinates: mockPath,
      algorithm: algorithm.id
    });
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
    {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
    <MapboxGL.MapView
    style={StyleSheet.absoluteFill}
    styleURL={MapboxGL.StyleURL.Street}
    onDidFailLoadingMap={(error) => setErrorMsg(`Map failed to load: ${error.message}`)}
    onDidFinishLoadingMap={() => setMapLoaded(true)}
    onDidFinishRenderingMapFully={() => console.log("Map fully rendered")}
    logoEnabled={true}
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
    onPress={() => console.log("Edge source pressed")}
    >
    <MapboxGL.LineLayer
    id="edges-layer"
    sourceLayerID="naga_edges_for_mapbox-5b6ynz"
    style={{
      lineColor: 'blue',
      lineWidth: 3,
      visibility: 'visible',
    }}
    minZoomLevel={10}
    />
    </MapboxGL.VectorSource>

    {/* Node tileset */}
    <MapboxGL.VectorSource
    id="nodes"
    url="mapbox://kazkee.04ydv29e"
    onPress={(feature) => {
      console.log("Node pressed:", feature);
      // Logic to handle node selection
      const coordinates = feature.geometry.coordinates;
      setSelectedNodes(prev => [...prev, coordinates]);
    }}
    >
    <MapboxGL.CircleLayer
    id="nodes-layer"
    sourceLayerID="naga_nodes_for_mapbox-dkbn5x"
    style={{
      circleColor: 'red',
      circleRadius: 5,
      visibility: 'visible',
    }}
    minZoomLevel={10}
    />
    </MapboxGL.VectorSource>

    {/* Path layer - shown when path is calculated */}
    {pathResult && (
      <MapboxGL.ShapeSource
      id="pathSource"
      shape={{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: pathResult.coordinates
        }
      }}
      >
      <MapboxGL.LineLayer
      id="pathLayer"
      style={{
        lineColor: pathResult.algorithm === 'dijkstra' ? '#FF9800' :
        pathResult.algorithm === 'a-star' ? '#4CAF50' :
        pathResult.algorithm === 'bellman-ford' ? '#9C27B0' : '#2196F3',
        lineWidth: 5,
        lineCap: 'round',
        lineJoin: 'round',
      }}
      />
      </MapboxGL.ShapeSource>
    )}

    {/* Selected nodes as markers */}
    {selectedNodes.map((coordinate, index) => (
      <MapboxGL.PointAnnotation
      key={`selected-node-${index}`}
      id={`selected-node-${index}`}
      coordinate={coordinate}
      title={index === 0 ? "Start" : "End"}
      >
      <View style={[
        styles.mapMarker,
        index === 0 ? styles.startMarker : styles.endMarker
      ]} />
      </MapboxGL.PointAnnotation>
    ))}
    </MapboxGL.MapView>

    {/* UI Components */}
    <AlgorithmComparisonUI
    mapLoaded={mapLoaded}
    onAlgorithmSelect={handleAlgorithmSelect}
    onStartPathfinding={handleStartPathfinding}
    />

    {/* Debug overlay */}
    <View style={styles.debugOverlay}>
    <Text style={styles.debugText}>Map Loaded: {mapLoaded ? "Yes" : "No"}</Text>
    <Text style={styles.debugText}>Selected Nodes: {selectedNodes.length}</Text>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container styles
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Algorithm selection styles
  algorithmScroll: {
    paddingVertical: 8,
  },
  algorithmButton: {
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  selectedAlgorithmButton: {
    backgroundColor: '#2196F3',
  },
  algorithmText: {
    color: '#333',
  },
  selectedAlgorithmText: {
    color: 'white',
  },

  // Action buttons styles
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pointButtonsContainer: {
    flexDirection: 'row',
  },
  setPointButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  setStartButton: {
    backgroundColor: '#4CAF50',
  },
  setEndButton: {
    backgroundColor: '#F44336',
  },
  setPointButtonText: {
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  disabledButtonText: {
    color: '#9e9e9e',
  },
  findPathButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  findPathButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Results styles
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: '#757575',
  },
  resultValue: {
    fontWeight: 'bold',
  },

  // Toolbar styles
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toolbarButton: {
    padding: 8,
  },
  toolbarTitle: {
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 24,
    margin: 16,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    marginBottom: 16,
  },
  characteristicsTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  characteristicsBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Map status styles
  mapStatusContainer: {
    position: 'absolute',
    top: 64,
    right: 16,
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    opacity: 0.8,
  },
  mapStatusText: {
    fontSize: 12,
  },

  // Bottom stats bar
  statsBar: {
    position: 'absolute',
    bottom: 128,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                 padding: 8,
                                 borderRadius: 8,
  },
  statsText: {
    textAlign: 'center',
    fontSize: 14,
  },
  statsHighlight: {
    fontWeight: 'bold',
  },

  // Debug overlay styles
  debugOverlay: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                 padding: 5,
                                 borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
  },

  // Error text style
  errorText: {
    color: 'red',
    padding: 10,
    zIndex: 10,
  },

  // Map marker styles
  mapMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  startMarker: {
    backgroundColor: '#4CAF50',
  },
  endMarker: {
    backgroundColor: '#F44336',
  },
});

export default PathfindingComparison;
