import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set access token
MapboxGL.setAccessToken('pk.eyJ1Ijoia2F6a2VlIiwiYSI6ImNtOXd1cWNnajA5ZDQybHNnaHcycjlkbjUifQ.oCwTlpov4vnih1yvkqLrZA');

const AlgorithmComparisonUI = ({
    mapLoaded,
    onAlgorithmSelect,
    onStartPathfinding,
    onClearMap,
    selectionMode,
    setSelectionMode,
    startPoint,
    endPoint,
    isComputing,
    selectedAlgorithm,
    comparisonResults,
    showResults
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [algorithmInfo, setAlgorithmInfo] = useState({});
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [routeHistory, setRouteHistory] = useState([]);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [routeOptions, setRouteOptions] = useState({
        avoidHighways: false,
        preferShortest: true,
        avoidTolls: false,
        avoidTraffic: true
    });

    // Algorithm data
    const algorithms = [
        { id: 'dijkstra', name: 'Dijkstra', description: 'Optimal for weighted graphs' },
        { id: 'a-star', name: 'A* Search', description: 'Uses heuristics for faster searches' },
        { id: 'bellman-ford', name: 'Bellman-Ford', description: 'Handles negative edge weights' },
        { id: 'floyd-warshall', name: 'Floyd-Warshall', description: 'All-pairs shortest path' }
    ];

    useEffect(() => {
        loadRouteHistory();
    }, []);

    const loadRouteHistory = async () => {
        try {
            const savedHistory = await AsyncStorage.getItem('routeHistory');
            if (savedHistory) {
                setRouteHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error('Failed to load route history:', error);
        }
    };

    const saveRouteToHistory = async (start, end, algorithm, results) => {
        try {
            const newRoute = {
                id: Date.now().toString(),
                date: new Date().toLocaleString(),
                startPoint: start,
                endPoint: end,
                algorithm: algorithm.name,
                metrics: results[algorithm.id]
            };

            const updatedHistory = [newRoute, ...routeHistory].slice(0, 10); // Keep only last 10 routes
            setRouteHistory(updatedHistory);
            await AsyncStorage.setItem('routeHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Failed to save route to history:', error);
        }
    };

    const openAlgorithmInfo = (algorithm) => {
        setAlgorithmInfo(algorithm);
        setModalVisible(true);
    };

    const handleSelectAlgorithm = (algorithm) => {
        onAlgorithmSelect(algorithm);
    };

    const handleStartPathfinding = () => {
        if (!startPoint || !endPoint) {
            Alert.alert('Selection Required', 'Please select both start and end points first');
            return;
        }

        if (comparisonResults) {
            saveRouteToHistory(startPoint, endPoint, selectedAlgorithm, comparisonResults);
        }

        onStartPathfinding(selectedAlgorithm, startPoint, endPoint, routeOptions);
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

        {/* Selection Mode Toggles */}
        <View style={styles.selectionModeContainer}>
        <TouchableOpacity
        style={[
            styles.selectionModeButton,
            selectionMode === 'start' && styles.activeSelectionButton
        ]}
        onPress={() => setSelectionMode('start')}
        >
        <MaterialIcons name="location-on" size={16} color={selectionMode === 'start' ? "white" : "#333"} />
        <Text style={selectionMode === 'start' ? styles.activeSelectionText : styles.selectionText}>
        Start Point {startPoint ? '✓' : ''}
        </Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[
            styles.selectionModeButton,
            selectionMode === 'end' && styles.activeSelectionButton
        ]}
        onPress={() => setSelectionMode('end')}
        >
        <MaterialIcons name="flag" size={16} color={selectionMode === 'end' ? "white" : "#333"} />
        <Text style={selectionMode === 'end' ? styles.activeSelectionText : styles.selectionText}>
        End Point {endPoint ? '✓' : ''}
        </Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.clearButton}
        onPress={onClearMap}
        >
        <MaterialIcons name="clear" size={16} color="white" />
        <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionContainer}>
        <TouchableOpacity
        style={[
            styles.findPathButton,
            (!selectedAlgorithm || !startPoint || !endPoint) && styles.disabledButton
        ]}
        disabled={!selectedAlgorithm || !startPoint || !endPoint || isComputing}
        onPress={handleStartPathfinding}
        >
        {isComputing ? (
            <ActivityIndicator color="white" size="small" />
        ) : (
            <Text style={[
                styles.findPathButtonText,
                (!selectedAlgorithm || !startPoint || !endPoint) && styles.disabledButtonText
            ]}>
            Find Path
            </Text>
        )}
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.optionsButton}
        onPress={() => setSettingsModalVisible(true)}
        >
        <MaterialIcons name="tune" size={20} color="#333" />
        <Text style={styles.optionsButtonText}>Options</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.historyButton}
        onPress={() => setHistoryModalVisible(true)}
        >
        <MaterialIcons name="history" size={20} color="#333" />
        <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
        </View>

        {/* Results Section (conditionally rendered) */}
        {showResults && comparisonResults && selectedAlgorithm && (
            <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results Comparison:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {algorithms.map(algorithm => (
                <View
                key={algorithm.id}
                style={[
                    styles.algorithmResultCard,
                    selectedAlgorithm.id === algorithm.id ? styles.selectedResultCard : null
                ]}
                >
                <Text style={styles.algorithmResultTitle}>{algorithm.name}</Text>
                <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Time</Text>
                <Text style={styles.metricValue}>{comparisonResults[algorithm.id].time}</Text>
                </View>
                <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Distance</Text>
                <Text style={styles.metricValue}>{comparisonResults[algorithm.id].distance}</Text>
                </View>
                <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Nodes</Text>
                <Text style={styles.metricValue}>{comparisonResults[algorithm.id].nodes}</Text>
                </View>
                </View>
                </View>
            ))}
            </ScrollView>
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

        {/* Route History Modal */}
        <Modal
        animationType="slide"
        transparent={true}
        visible={historyModalVisible}
        onRequestClose={() => setHistoryModalVisible(false)}
        >
        <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '90%', maxHeight: '80%' }]}>
        <Text style={styles.modalTitle}>Route History</Text>

        {routeHistory.length > 0 ? (
            <ScrollView style={styles.historyList}>
            {routeHistory.map((route) => (
                <TouchableOpacity
                key={route.id}
                style={styles.historyItem}
                onPress={() => {
                    // Logic to reload a previous route
                    setHistoryModalVisible(false);
                    const algorithm = algorithms.find(a => a.name === route.algorithm);
                    if (algorithm) {
                        handleSelectAlgorithm(algorithm);
                        // Would need to set start/end points and rerun pathfinding
                    }
                }}
                >
                <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>{route.date}</Text>
                <Text style={styles.historyAlgorithm}>{route.algorithm}</Text>
                </View>
                <View style={styles.historyDetail}>
                <Text style={styles.historyPoints}>
                Start: {route.startPoint ? `${route.startPoint.lat.toFixed(5)}, ${route.startPoint.lng.toFixed(5)}` : 'N/A'}
                </Text>
                <Text style={styles.historyPoints}>
                End: {route.endPoint ? `${route.endPoint.lat.toFixed(5)}, ${route.endPoint.lng.toFixed(5)}` : 'N/A'}
                </Text>
                <Text style={styles.historyMetric}>
                Distance: {route.metrics?.distance || 'N/A'} • Time: {route.metrics?.time || 'N/A'}
                </Text>
                </View>
                </TouchableOpacity>
            ))}
            </ScrollView>
        ) : (
            <View style={styles.emptyHistoryContainer}>
            <Text style={styles.emptyHistoryText}>No route history yet</Text>
            <Text style={styles.emptyHistorySubtext}>Find paths to see your history here</Text>
            </View>
        )}

        <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setHistoryModalVisible(false)}
        >
        <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        </View>
        </View>
        </Modal>

        {/* Route Options Modal */}
        <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
        >
        <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Route Options</Text>

        <TouchableOpacity
        style={styles.optionItem}
        onPress={() => setRouteOptions({...routeOptions, avoidHighways: !routeOptions.avoidHighways})}
        >
        <Text style={styles.optionText}>Avoid Highways</Text>
        <View style={[
            styles.optionToggle,
            routeOptions.avoidHighways ? styles.optionToggleOn : styles.optionToggleOff
        ]}>
        <View style={[
            styles.optionToggleCircle,
            routeOptions.avoidHighways ? styles.optionToggleCircleOn : styles.optionToggleCircleOff
        ]} />
        </View>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.optionItem}
        onPress={() => setRouteOptions({...routeOptions, preferShortest: !routeOptions.preferShortest})}
        >
        <Text style={styles.optionText}>{routeOptions.preferShortest ? 'Shortest Distance' : 'Fastest Route'}</Text>
        <View style={[
            styles.optionToggle,
            routeOptions.preferShortest ? styles.optionToggleOn : styles.optionToggleOff
        ]}>
        <View style={[
            styles.optionToggleCircle,
            routeOptions.preferShortest ? styles.optionToggleCircleOn : styles.optionToggleCircleOff
        ]} />
        </View>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.optionItem}
        onPress={() => setRouteOptions({...routeOptions, avoidTolls: !routeOptions.avoidTolls})}
        >
        <Text style={styles.optionText}>Avoid Toll Roads</Text>
        <View style={[
            styles.optionToggle,
            routeOptions.avoidTolls ? styles.optionToggleOn : styles.optionToggleOff
        ]}>
        <View style={[
            styles.optionToggleCircle,
            routeOptions.avoidTolls ? styles.optionToggleCircleOn : styles.optionToggleCircleOff
        ]} />
        </View>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.optionItem}
        onPress={() => setRouteOptions({...routeOptions, avoidTraffic: !routeOptions.avoidTraffic})}
        >
        <Text style={styles.optionText}>Avoid Heavy Traffic</Text>
        <View style={[
            styles.optionToggle,
            routeOptions.avoidTraffic ? styles.optionToggleOn : styles.optionToggleOff
        ]}>
        <View style={[
            styles.optionToggleCircle,
            routeOptions.avoidTraffic ? styles.optionToggleCircleOn : styles.optionToggleCircleOff
        ]} />
        </View>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setSettingsModalVisible(false)}
        >
        <Text style={styles.closeButtonText}>Apply Settings</Text>
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
            {startPoint && endPoint && ` • ${calculateDistanceInKm(startPoint, endPoint).toFixed(2)}km distance`}
            </Text>
            </View>
        )}

        {/* Selection Mode Indicator */}
        {selectionMode && (
            <View style={styles.selectionIndicator}>
            <Text style={styles.selectionIndicatorText}>
            {selectionMode === 'start' ? '🟢 Tap to set Start Point' : '🔴 Tap to set End Point'}
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
    const [pathResults, setPathResults] = useState({});
    const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
    const [selectionMode, setSelectionMode] = useState(null); // 'start' or 'end'
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [isComputing, setIsComputing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [routeOptions, setRouteOptions] = useState({
        avoidHighways: false,
        preferShortest: true,
        avoidTolls: false,
        avoidTraffic: true
    });

    const mapViewRef = useRef(null);

    // Helper function to calculate distance between two points
    const calculateDistanceInKm = (point1, point2) => {
        if (!point1 || !point2) return 0;

        const R = 6371; // Earth's radius in km
        const dLat = degreesToRadians(point2.lat - point1.lat);
        const dLon = degreesToRadians(point2.lng - point1.lng);

        const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(degreesToRadians(point1.lat)) * Math.cos(degreesToRadians(point2.lat)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const degreesToRadians = (degrees) => {
        return degrees * (Math.PI/180);
    };

    // Handle algorithm selection
    const handleAlgorithmSelect = (algorithm) => {
        setSelectedAlgorithm(algorithm);
        console.log(`Selected algorithm: ${algorithm.name}`);
    };

    // Handle node selection from map
    const handleMapPress = (e) => {
        // Only process if we're in selection mode
        if (!selectionMode) return;

        const coordinates = e.geometry.coordinates;
        const point = { lat: coordinates[1], lng: coordinates[0] };

        if (selectionMode === 'start') {
            setStartPoint(point);
            // Automatically switch to end point selection if start point is set
            setSelectionMode('end');
        } else if (selectionMode === 'end') {
            setEndPoint(point);
            // Clear selection mode after end point is set
            setSelectionMode(null);
        }

        // Update markers
        updateSelectedNodes(selectionMode, coordinates);
    };

    const updateSelectedNodes = (mode, coordinates) => {
        if (mode === 'start') {
            // Replace start point if exists, otherwise add it
            const existingEndIndex = selectedNodes.findIndex((_, index) => index === 1);
            if (existingEndIndex !== -1) {
                setSelectedNodes([coordinates, selectedNodes[existingEndIndex]]);
            } else {
                setSelectedNodes([coordinates]);
            }
        } else if (mode === 'end') {
            // Replace end point if exists, otherwise add it
            const existingStartIndex = selectedNodes.findIndex((_, index) => index === 0);
            if (existingStartIndex !== -1) {
                setSelectedNodes([selectedNodes[existingStartIndex], coordinates]);
            } else {
                setSelectedNodes([null, coordinates]);
            }
        }
    };

    // Clear map selections and routes
    const handleClearMap = () => {
        setStartPoint(null);
        setEndPoint(null);
        setSelectedNodes([]);
        setPathResults({});
        setShowResults(false);
        setComparisonResults(null);
    };

    // Generate realistic looking paths with slight variations
    const generatePathCoordinates = (start, end, algorithm, options) => {
        // Create a base path between the points
        const basePath = [];
        const steps = 10; // Number of points in the path

        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;

            // Linear interpolation between start and end
            const lng = start[0] + ratio * (end[0] - start[0]);
            const lat = start[1] + ratio * (end[1] - start[1]);

            // Add some algorithm-specific variations
            let latOffset = 0;
            let lngOffset = 0;

            switch (algorithm) {
                case 'dijkstra':
                    // More direct path with slight variation
                    latOffset = (Math.random() - 0.5) * 0.001;
                    lngOffset = (Math.random() - 0.5) * 0.001;
                    break;
                case 'a-star':
                    // Very direct path with minimal variation
                    latOffset = (Math.random() - 0.5) * 0.0005;
                    lngOffset = (Math.random() - 0.5) * 0.0005;
                    break;
                case 'bellman-ford':
                    // More variation in the path
                    latOffset = (Math.random() - 0.5) * 0.002;
                    lngOffset = (Math.random() - 0.5) * 0.002;
                    break;
                case 'floyd-warshall':
                    // Most variation, sometimes takes a different approach
                    latOffset = (Math.random() - 0.5) * 0.0025;
                    lngOffset = (Math.random() - 0.5) * 0.0025;
                    // Add occasional sharp turns for different route
                    if (i > 0 && i < steps && Math.random() > 0.7) {
                        latOffset *= 3;
                        lngOffset *= 3;
                    }
                    break;
            }

            // Apply route options
            if (options.avoidHighways && ratio > 0.3 && ratio < 0.7) {
                // Highways are typically straighter, so add more variation to avoid them
                latOffset *= 2;
                lngOffset *= 2;
            }

            if (options.preferShortest) {
                // Reduce variation for shortest path
                latOffset *= 0.5;
                lngOffset *= 0.5;
            } else {
                // Increase variation for fastest (might not be shortest)
                latOffset *= 1.5;
                lngOffset *= 1.5;
            }

            basePath.push([lng + lngOffset, lat + latOffset]);
        }

        return basePath;
    };

    // Handle start pathfinding action
    const handleStartPathfinding = (algorithm, start, end, options) => {
        if (!algorithm || !start || !end) return;

        console.log(`Starting pathfinding with ${algorithm.name} from ${start.lat},${start.lng} to ${end.lat},${end.lng}`);

        setIsComputing(true);

        // Convert point objects to coordinate arrays for map
        const startCoords = [start.lng, start.lat];
        const endCoords = [end.lng, end.lat];

        // Simulate computation for different algorithms
        setTimeout(() => {
            // Generate paths for all algorithms to compare
            const algorithms = ['dijkstra', 'a-star', 'bellman-ford', 'floyd-warshall'];
            const results = {};
            const pathData = {};

            // Calculate distance
            const distance = calculateDistanceInKm(start, end);

            algorithms.forEach(algoId => {
                // Generate path coordinates with variations based on algorithm
                const coords = generatePathCoordinates(startCoords, endCoords, algoId, options);

                // Store path data
                pathData[algoId] = {
                    coordinates: coords,
                    algorithm: algoId
                };

                // Calculate mock metrics with variations
                let timeFactor;
                let nodeFactor;

                switch (algoId) {
                    case 'dijkstra':
                        timeFactor = 1.0;
                        nodeFactor = 1.0;
                        break;
                    case 'a-star':
                        timeFactor = 0.6;
                        nodeFactor = 0.7;
                        break;
                    case 'bellman-ford':
                        timeFactor = 1.5;
                        nodeFactor = 1.1;
                        break;
                    case 'floyd-warshall':
                        timeFactor = 2.2;
                        nodeFactor = 1.4;
                        break;
                }

                // Adjust for route options
                if (options.avoidHighways) timeFactor *= 1.2;
                if (!options.preferShortest) timeFactor *= 0.8;
                if (options.avoidTolls) timeFactor *= 1.1;
                if (options.avoidTraffic) timeFactor *= 1.3;

                const time = (distance * 0.4 * timeFactor).toFixed(2);
                const nodes = Math.round(distance * 30 * nodeFactor);

                // Store results
                results[algoId] = {
                    time: `${time}s`,
                    distance: `${(distance + (Math.random() - 0.5) * 0.2).toFixed(2)}km`,
                               nodes
                };
            });

            // Set path results and display info for selected algorithm
            setPathResults(pathData);
            setComparisonResults(results);
            setIsComputing(false);
            setShowResults(true);

            // Fly to fit the route
            if (mapViewRef.current) {
                // Ideally use fitBounds here if available in your Mapbox version
                const centerLng = (startCoords[0] + endCoords[0]) / 2;
                const centerLat = (startCoords[1] + endCoords[1]) / 2;

                mapViewRef.current.flyTo([centerLng, centerLat], 14);
            }
        }, 1500);
    };

    return (
        <SafeAreaView style={StyleSheet.absoluteFill}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <MapboxGL.MapView
        ref={mapViewRef}
        style={StyleSheet.absoluteFill}
        styleURL={MapboxGL.StyleURL.Street}
        onDidFailLoadingMap={(error) => setErrorMsg(`Map failed to load: ${error.message}`)}
        onDidFinishLoadingMap={() => setMapLoaded(true)}
        onDidFinishRenderingMapFully={() => console.log("Map fully rendered")}
        logoEnabled={true}
        attributionEnabled={true}
        compassEnabled={true}
        onPress={handleMapPress}
        >
        <MapboxGL.Camera
        zoomLevel={14}
        centerCoordinate={[123.19549, 13.62617]}
        animationDuration={500}
        />

        {/* Edge tileset */}
        <MapboxGL.VectorSource
        id="edges"
        url="mapbox://kazkee.70pt2eky"
        onPress={(feature) => console.log("Edge source pressed", feature)}
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
        >
        <MapboxGL.CircleLayer
        id="nodes-layer"
        sourceLayerID="naga_nodes_for_mapbox-dkbn5x"
        style={{
            circleColor: selectionMode === 'start' ? '#4CAF50' :
            selectionMode === 'end' ? '#F44336' : 'red',
            circleRadius: 5,
            circleStrokeWidth: 1,
            circleStrokeColor: 'white',
            visibility: 'visible',
        }}
        minZoomLevel={10}
        />
        </MapboxGL.VectorSource>

        {/* Render all algorithm paths for comparison */}
        {Object.entries(pathResults).map(([algorithmId, pathData]) => (
            <MapboxGL.ShapeSource
            key={`pathSource-${algorithmId}`}
            id={`pathSource-${algorithmId}`}
            shape={{
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: pathData.coordinates
                }
            }}
            >
            <MapboxGL.LineLayer
            id={`pathLayer-${algorithmId}`}
            style={{
                lineColor:
                algorithmId === 'dijkstra' ? '#FF9800' :
                algorithmId === 'a-star' ? '#4CAF50' :
                algorithmId === 'bellman-ford' ? '#9C27B0' : '#2196F3',
                lineWidth: selectedAlgorithm?.id === algorithmId ? 5 : 3,
                lineOpacity: selectedAlgorithm?.id === algorithmId ? 0.9 : 0.3,
                lineCap: 'round',
                lineJoin: 'round',
            }}
            />
            </MapboxGL.ShapeSource>
        ))}

        {/* Selected nodes as markers */}
        {selectedNodes.map((coordinate, index) => (
            coordinate && (
                <MapboxGL.PointAnnotation
                key={`selected-node-${index}`}
                id={`selected-node-${index}`}
                coordinate={coordinate}
                title={index === 0 ? "Start Point" : "End Point"}
                >
                <View style={[
                    styles.mapMarker,
                    index === 0 ? styles.startMarker : styles.endMarker
                ]} />
                </MapboxGL.PointAnnotation>
            )
        ))}

        {/* Traffic layer toggle - only visible when avoidTraffic is true */}
        {routeOptions?.avoidTraffic && (
            <MapboxGL.ShapeSource
            id="trafficSource"
            shape={{
                type: 'FeatureCollection',
                features: [
                    // Sample traffic data - in a real app, this would come from an API
                    {
                        type: 'Feature',
                        properties: { severity: 'high' },
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [123.19749, 13.62817],
                                [123.19849, 13.62917],
                                [123.19949, 13.63017]
                            ]
                        }
                    },
                    {
                        type: 'Feature',
                        properties: { severity: 'medium' },
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [123.20149, 13.63217],
                                [123.20249, 13.63317],
                                [123.20349, 13.63417]
                            ]
                        }
                    }
                ]
            }}
            >
            <MapboxGL.LineLayer
            id="trafficLayer"
            style={{
                lineColor: [
                    'match',
                    ['get', 'severity'],
                    'high', '#FF0000',
                    'medium', '#FFA500',
                    '#FFFF00'
                ],
                lineWidth: 4,
                lineOpacity: 0.7,
                lineDasharray: [2, 2]
            }}
            />
            </MapboxGL.ShapeSource>
        )}
        </MapboxGL.MapView>

        {/* UI Components */}
        <AlgorithmComparisonUI
        mapLoaded={mapLoaded}
        onAlgorithmSelect={handleAlgorithmSelect}
        onStartPathfinding={handleStartPathfinding}
        onClearMap={handleClearMap}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        startPoint={startPoint}
        endPoint={endPoint}
        isComputing={isComputing}
        selectedAlgorithm={selectedAlgorithm}
        comparisonResults={comparisonResults}
        showResults={showResults}
        />

        {/* Help Overlay Button */}
        <TouchableOpacity
        style={styles.helpButton}
        onPress={() => Alert.alert(
            "How to Use",
            "1. Select an algorithm by tapping on it\n" +
            "2. Tap 'Start Point' and then tap on the map\n" +
            "3. Tap 'End Point' and then tap on the map\n" +
            "4. Tap 'Find Path' to calculate routes\n" +
            "5. Use 'Options' to customize route settings\n" +
            "6. Check 'History' to see previous routes"
        )}
        >
        <MaterialIcons name="help-outline" size={24} color="white" />
        </TouchableOpacity>

        {/* Debug overlay */}
        <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>Map Loaded: {mapLoaded ? "Yes" : "No"}</Text>
        <Text style={styles.debugText}>Selected Nodes: {selectedNodes.filter(Boolean).length}</Text>
        {selectedAlgorithm && <Text style={styles.debugText}>Algorithm: {selectedAlgorithm.name}</Text>}
        </View>
        </SafeAreaView>
    );
};

// Enhanced styles with new UI components
const styles = StyleSheet.create({
    // Main container styles
    controlPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
        maxHeight: '50%',
    },
    headerBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        paddingVertical: 10,
    },
    algorithmButton: {
        marginHorizontal: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    selectedAlgorithmButton: {
        backgroundColor: '#2196F3',
    },
    algorithmText: {
        color: '#333',
        fontWeight: '500',
    },
    selectedAlgorithmText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Selection mode styles
    selectionModeContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    selectionModeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    activeSelectionButton: {
        backgroundColor: '#2196F3',
    },
    selectionText: {
        color: '#333',
        marginLeft: 4,
    },
    activeSelectionText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    clearButton: {
        width: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginLeft: 4,
        borderRadius: 8,
        backgroundColor: '#F44336',
    },
    clearButtonText: {
        color: 'white',
        marginLeft: 4,
    },
    // Action buttons styles
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    findPathButton: {
        flex: 2,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#2196F3',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    findPathButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    optionsButton: {
        flex: 1,
        marginLeft: 8,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionsButtonText: {
        color: '#333',
        fontSize: 12,
        marginTop: 2,
    },
    historyButton: {
        flex: 1,
        marginLeft: 8,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyButtonText: {
        color: '#333',
        fontSize: 12,
        marginTop: 2,
    },
    // Results styles
    resultsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    resultsTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 16,
    },
    algorithmResultCard: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        marginRight: 12,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    selectedResultCard: {
        backgroundColor: '#e3f2fd',
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    algorithmResultTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    metricsContainer: {
        flexDirection: 'column',
    },
    metricItem: {
        marginBottom: 6,
    },
    metricLabel: {
        fontSize: 12,
        color: '#757575',
    },
    metricValue: {
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
        paddingTop: 40, // Adjust for status bar on iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1,
    },
    toolbarButton: {
        padding: 8,
    },
    toolbarTitle: {
        fontWeight: 'bold',
        fontSize: 16,
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
        borderRadius: 15,
        padding: 20,
        margin: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalDescription: {
        marginBottom: 16,
        textAlign: 'center',
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
    // History styles
    historyList: {
        maxHeight: 300,
    },
    historyItem: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    historyDate: {
        fontSize: 12,
        color: '#666',
    },
    historyAlgorithm: {
        fontWeight: 'bold',
        color: '#2196F3',
    },
    historyDetail: {
        marginTop: 4,
    },
    historyPoints: {
        fontSize: 12,
        marginBottom: 2,
    },
    historyMetric: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    emptyHistoryContainer: {
        alignItems: 'center',
        padding: 20,
    },
    emptyHistoryText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyHistorySubtext: {
        color: '#666',
        textAlign: 'center',
    },
    // Options modal styles
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionText: {
        fontSize: 16,
    },
    optionToggle: {
        width: 50,
        height: 24,
        borderRadius: 12,
        padding: 2,
    },
    optionToggleOn: {
        backgroundColor: '#2196F3',
    },
    optionToggleOff: {
        backgroundColor: '#e0e0e0',
    },
    optionToggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'white',
    },
    optionToggleCircleOn: {
        alignSelf: 'flex-end',
    },
    optionToggleCircleOff: {
        alignSelf: 'flex-start',
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
        opacity: 0.9,
    },
    mapStatusText: {
        fontSize: 12,
    },
    // Bottom stats bar
    statsBar: {
        position: 'absolute',
        bottom: 160, // Positioned above the control panel
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                 padding: 8,
                                 borderRadius: 8,
                                 shadowColor: '#000',
                                 shadowOffset: { width: 0, height: 2 },
                                 shadowOpacity: 0.2,
                                 shadowRadius: 1.41,
                                 elevation: 2,
    },
    statsText: {
        textAlign: 'center',
        fontSize: 14,
    },
    statsHighlight: {
        fontWeight: 'bold',
        color: '#2196F3',
    },
    // Selection mode indicator
    selectionIndicator: {
        position: 'absolute',
        top: 100,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                 padding: 8,
                                 borderRadius: 8,
                                 alignItems: 'center',
    },
    selectionIndicatorText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Help button
    helpButton: {
        position: 'absolute',
        top: 90,
        right: 16,
        backgroundColor: '#2196F3',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    // Debug overlay styles
    debugOverlay: {
        position: 'absolute',
        bottom: 200,
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
    disabledButton: {
        backgroundColor: '#e0e0e0',
    },
    disabledButtonText: {
        color: '#9e9e9e',
    },
});

export default PathfindingComparison;
