import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { algorithm } from  '../utils/algorithms';

type StatusIndicatorsProps = {
  mapLoaded: boolean;
  errorMsg: string | null;
  selectedAlgorithm: algorithm | null;
};

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  mapLoaded,
  errorMsg,
  selectedAlgorithm
}) => {
  // Create a fade-in animation for the map status
  const opacity = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    // When the map loads, fade in the status indicator
    if (mapLoaded) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // After 3 seconds, fade it out
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoaded]);

  return (
    <>
      {/* Map Status Indicator */}
      <Animated.View style={[styles.mapStatusContainer, { opacity }]}>
        <View style={[
          styles.statusDot, 
          mapLoaded ? styles.statusDotSuccess : styles.statusDotPending
        ]} />
        <Text style={styles.mapStatusText}>
          {mapLoaded ? "Map Ready" : "Loading Map..."}
        </Text>
      </Animated.View>

      {/* Error Message */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Selected Algorithm Indicator */}
      {selectedAlgorithm && (
        <View style={styles.algorithmStatusContainer}>
          <Text style={styles.algorithmStatusText}>
            Using <Text style={styles.algorithmHighlight}>{selectedAlgorithm.name}</Text> algorithm
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  mapStatusContainer: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotPending: {
    backgroundColor: '#FFC107',
  },
  statusDotSuccess: {
    backgroundColor: '#4CAF50',
  },
  mapStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  errorText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  algorithmStatusContainer: {
    position: 'absolute',
    bottom: 170,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  algorithmStatusText: {
    fontSize: 14,
    color: '#333',
  },
  algorithmHighlight: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
});

export default StatusIndicators;