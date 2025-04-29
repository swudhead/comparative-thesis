import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Animated
} from 'react-native';
import { algorithm } from  '../utils/algorithms';

type ControlPanelProps = {
  mapLoaded: boolean;
  selectedAlgorithm: algorithm | null;
  startPoint: { lat: number, lng: number } | null;
  endPoint: { lat: number, lng: number } | null;
  isComputing: boolean;
  comparisonResults: { time: string, distance: string, nodes: number } | null;
  onAlgorithmSelect: (algorithm: algorithm) => void;
  onAlgorithmInfo: (algorithm: algorithm) => void;
  onStartPointSet: () => void;
  onEndPointSet: () => void;
  onStartPathfinding: () => void;
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
  onStartPointSet,
  onEndPointSet,
  onStartPathfinding
}) => {
  const [expanded, setExpanded] = useState(false);
  const panelHeight = React.useRef(new Animated.Value(160)).current;

  // Import algorithms from utils
  const { algorithms } = require('@/utils/algorithms');

  // Toggle control panel expansion
  const toggleExpansion = () => {
    const targetHeight = expanded ? 160 : 280;
    
    Animated.spring(panelHeight, {
      toValue: targetHeight,
      friction: 8,
      tension: 40,
      useNativeDriver: false
    }).start();
    
    setExpanded(!expanded);
  };

  return (
    <Animated.View style={[styles.controlPanel, { height: panelHeight }]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Algorithm Analysis Controls</Text>
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
              startPoint ? styles.activeButton : styles.disabledButton
            ]}
            onPress={onStartPointSet}
          >
            <Text style={startPoint ? styles.setPointButtonText : styles.disabledButtonText}>
              {startPoint ? 'Start Set' : 'Set Start'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.setPointButton,
              styles.setEndButton,
              endPoint ? styles.activeButton : styles.disabledButton
            ]}
            onPress={onEndPointSet}
          >
            <Text style={endPoint ? styles.setPointButtonText : styles.disabledButtonText}>
              {endPoint ? 'End Set' : 'Set End'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.findPathButton,
            (!selectedAlgorithm || !startPoint || !endPoint) ? styles.disabledButton : null
          ]}
          disabled={!selectedAlgorithm || !startPoint || !endPoint || isComputing}
          onPress={onStartPathfinding}
        >
          {isComputing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.findPathButtonText}>
              Find Path
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Section (conditionally rendered based on expanded state) */}
      {expanded && comparisonResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results for {selectedAlgorithm?.name}:</Text>
          <View style={styles.resultsBox}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Time</Text>
              <Text style={styles.resultValue}>{comparisonResults.time}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Distance</Text>
              <Text style={styles.resultValue}>{comparisonResults.distance}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Nodes</Text>
              <Text style={styles.resultValue}>{comparisonResults.nodes}</Text>
            </View>
          </View>
          
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {selectedAlgorithm?.id === 'dijkstra' && "Dijkstra's algorithm guarantees the shortest path but explores more nodes than A*."}
              {selectedAlgorithm?.id === 'a-star' && "A* uses heuristics to find paths more efficiently than Dijkstra, resulting in faster computation."}
              {selectedAlgorithm?.id === 'd-star' && "D* is designed for partially known environments, useful when the map may change."}
              {selectedAlgorithm?.id === 'd-star-lite' && "D* Lite improves on D* with better performance in dynamic environments."}
            </Text>
          </View>
        </View>
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
  setPointButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#9e9e9e',
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
  },
  findPathButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
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