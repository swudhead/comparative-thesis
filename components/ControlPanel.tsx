import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { algorithm } from '../utils/algorithms';

type ControlPanelProps = {
  mapLoaded: boolean;
  selectedAlgorithm: algorithm | null;
  startPoint: { lat: number; lng: number } | null;
  endPoint: { lat: number; lng: number } | null;
  isComputing: boolean;
  comparisonResults: Record<string, { time: string; distance: string; nodes: number }> | null;
  onAlgorithmSelect: (algorithm: algorithm) => void;
  onAlgorithmInfo: (algorithm: algorithm) => void;
  onSelectStartPoint: () => void;
  onSelectEndPoint: () => void;
  onStartPathfinding: () => void;
  onClearPoints: () => void;
  onSwapPoints: () => void;
  selectionMode: 'start' | 'end' | 'none';
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  mapLoaded,
  selectedAlgorithm,
  startPoint,
  endPoint,
  isComputing,
  comparisonResults,
  onAlgorithmSelect,
  onAlgorithmInfo,
  onSelectStartPoint,
  onSelectEndPoint,
  onStartPathfinding,
  onClearPoints,
  onSwapPoints,
  selectionMode,
}) => {
  const [expanded, setExpanded] = useState(false);
  const panelHeight = React.useRef(new Animated.Value(200)).current;

  // Import algorithms from utils
  const { algorithms } = require('../utils/algorithms');

  // Toggle control panel expansion
  const toggleExpansion = () => {
    const targetHeight = expanded ? 200 : 420;

    Animated.spring(panelHeight, {
      toValue: targetHeight,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();

    setExpanded(!expanded);
  };

  return (
    <Animated.View style={[styles.controlPanel, { height: panelHeight }]}>
    <View style={styles.headerBar}>
    <Text style={styles.headerText}>Algorithm
    Controls</Text>
    <TouchableOpacity onPress={toggleExpansion} style={styles.expandButton}>
    <Text style={styles.expandButtonText}>{expanded ? '▲' : '▼'}</Text>
    </TouchableOpacity>
    </View>

    {/* Algorithm Selection */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.algorithmScroll}>
    {algorithms.map((algorithm) => (
      <TouchableOpacity
      key={algorithm.id}
      onPress={() => onAlgorithmSelect(algorithm)}
      onLongPress={() => onAlgorithmInfo(algorithm)}
      style={[
        styles.algorithmButton,
        selectedAlgorithm?.id === algorithm.id ? styles.selectedAlgorithmButton : null,
      ]}
      >
      <Text
      style={
        selectedAlgorithm?.id === algorithm.id
        ? styles.selectedAlgorithmText
        : styles.algorithmText
      }
      >
      {algorithm.name}
      </Text>
      </TouchableOpacity>
    ))}
    </ScrollView>

    {/* Action buttons */}
    <View style={styles.actionContainer}>
    <View style={styles.pointButtonsRow}>
    <TouchableOpacity
    style={[
      styles.setPointButton,
      styles.setStartButton,
      selectionMode === 'start' ? styles.activeSelectionButton : null,
      startPoint ? styles.activeButton : styles.disabledButton,
    ]}
    onPress={() => {
      console.log("Set Start button pressed, current selectionMode:", selectionMode);
      onSelectStartPoint();
    }}
    >
    <Text style={startPoint ? styles.setPointButtonText : styles.disabledButtonText}>
    {startPoint
      ? `Start Set (${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)})`
      : selectionMode === 'start'
      ? 'Selecting...'
  : 'Set Start'}
  </Text>
  </TouchableOpacity>

  <View style={styles.buttonSpacer} />

  <TouchableOpacity
  style={[
    styles.setPointButton,
    styles.setEndButton,
    selectionMode === 'end' ? styles.activeSelectionButton : null,
    endPoint ? styles.activeButton : styles.disabledButton,
  ]}
  onPress={() => {
    console.log("Set End button pressed, current selectionMode:", selectionMode);
    onSelectEndPoint();
  }}
  >
  <Text style={endPoint ? styles.setPointButtonText : styles.disabledButtonText}>
  {endPoint
    ? `End Set (${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)})`
    : selectionMode === 'end'
    ? 'Selecting...'
  : 'Set End'}
  </Text>
  </TouchableOpacity>
  </View>

  <View style={styles.actionButtonsRow}>
  <TouchableOpacity
  style={styles.utilityButton}
  onPress={onSwapPoints}
  disabled={!startPoint || !endPoint}
  >
  <Text
  style={(!startPoint || !endPoint) ? styles.disabledButtonText : styles.utilityButtonText}
  >
  Swap
  </Text>
  </TouchableOpacity>

  <TouchableOpacity
  style={styles.utilityButton}
  onPress={onClearPoints}
  disabled={!startPoint && !endPoint}
  >
  <Text
  style={(!startPoint && !endPoint) ? styles.disabledButtonText : styles.utilityButtonText}
  >
  Clear
  </Text>
  </TouchableOpacity>

  <TouchableOpacity
  style={[
    styles.findPathButton,
    (!selectedAlgorithm || !startPoint || !endPoint) ? styles.disabledButton : null,
  ]}
  disabled={!selectedAlgorithm || !startPoint || !endPoint || isComputing}
  onPress={onStartPathfinding}
  >
  {isComputing ? (
    <ActivityIndicator color="white" size="small" />
  ) : (
    <Text style={styles.findPathButtonText}>Find Path</Text>
  )}
  </TouchableOpacity>
  </View>
  </View>

  {/* Results Section */}
  {expanded && (
    <ScrollView style={styles.resultsScrollView} contentContainerStyle={styles.resultsScrollContent}>
    {comparisonResults && selectedAlgorithm && (
      <View style={styles.resultsContainer}>
      <Text style={styles.resultsTitle}>Results for {selectedAlgorithm?.name}:</Text>
      <View style={styles.resultsBox}>
      <View style={styles.resultItem}>
      <Text style={styles.resultLabel}>Time</Text>
      <Text style={styles.resultValue}>
      {comparisonResults[selectedAlgorithm.id]?.time || '---'}
      </Text>
      </View>
      <View style={styles.resultItem}>
      <Text style={styles.resultLabel}>Distance</Text>
      <Text style={styles.resultValue}>
      {comparisonResults[selectedAlgorithm.id]?.distance || '---'}
      </Text>
      </View>
      <View style={styles.resultItem}>
      <Text style={styles.resultLabel}>Nodes</Text>
      <Text style={styles.resultValue}>
      {comparisonResults[selectedAlgorithm.id]?.nodes || '---'}
      </Text>
      </View>
      </View>

      <View style={styles.descriptionBox}>
      <Text style={styles.descriptionText}>
      {selectedAlgorithm?.id === 'dijkstra' &&
        "Dijkstra's algorithm guarantees the shortest path but explores more nodes than A*."}
        {selectedAlgorithm?.id === 'a-star' &&
          "A* uses heuristics to find paths more efficiently than Dijkstra, resulting in faster computation."}
          {selectedAlgorithm?.id === 'd-star' &&
            "D* is designed for partially known environments, useful when the map may change."}
            {selectedAlgorithm?.id === 'd-star-lite' &&
              "D* Lite improves on D* with better performance in dynamic environments."}
              </Text>
              </View>
              </View>
    )}
    </ScrollView>
  )}
  </Animated.View>
  );
};

const styles = StyleSheet.create({
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandButton: {
    padding: 4,
  },
  expandButtonText: {
    fontSize: 18,
    color: '#2196F3',
  },
  algorithmScroll: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexGrow: 0,
  },
  algorithmButton: {
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedAlgorithmButton: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  algorithmText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedAlgorithmText: {
    color: 'white',
    fontWeight: '600',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  pointButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 12,
  },
  setPointButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  setStartButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  setEndButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  activeButton: {
    opacity: 1,
  },
  activeSelectionButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  setPointButtonText: {
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#9e9e9e',
    textAlign: 'center',
  },
  utilityButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  utilityButtonText: {
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
  },
  findPathButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    alignItems: 'center',
    flex: 1,
  },
  findPathButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsScrollView: {
    flex: 1,
  },
  resultsScrollContent: {
    paddingBottom: 16,
  },
  resultsContainer: {
    paddingHorizontal: 16,
  },
  resultsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  resultValue: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  descriptionBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  descriptionText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
});

export default ControlPanel;
