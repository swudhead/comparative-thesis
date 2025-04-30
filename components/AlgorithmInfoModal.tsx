import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity,
  TouchableWithoutFeedback 
} from 'react-native';
import { algorithm } from  '../utils/algorithms';

type AlgorithmInfoModalProps = {
  visible: boolean;
  algorithm: algorithm | null;
  onClose: () => void;
};

const AlgorithmInfoModal: React.FC<AlgorithmInfoModalProps> = ({
  visible,
  algorithm,
  onClose
}) => {
  if (!algorithm) return null;

  const algorithmsCharacteristics = {
    'dijkstra': {
      characteristics: [
        '• Guarantees the shortest path in weighted graphs',
        '• Time complexity: O(E + V log V)',
        '• Space complexity: O(V)',
        '• Ideal for route planning with variable costs',
        '• Does not use any heuristic information'
      ],
      advantages: 'Guarantees optimal solutions and works well for all types of weighted graphs.',
      disadvantages: 'Can be slower than informed search algorithms as it explores in all directions.'
    },
    'a-star': {
      characteristics: [
        '• Uses heuristics to speed up search',
        '• Time complexity: O(E)',
        '• Space complexity: O(V)',
        '• Best for scenarios with spatial information',
        '• Can significantly outperform Dijkstra when heuristics are good'
      ],
      advantages: 'Usually expands fewer nodes than Dijkstra while still finding optimal paths.',
      disadvantages: 'Performance depends heavily on the quality of the heuristic function.'
    },
    'd-star': {
      characteristics: [
        '• Designed for partially known or changing environments',
        '• Time complexity: O(E log V)',
        '• Space complexity: O(V)',
        '• Can replan paths when environment changes',
        '• Useful for real-time navigation in unknown terrain'
      ],
      advantages: 'Efficient for dynamic environments where the map changes.',
      disadvantages: 'More complex implementation and higher computational overhead.'
    },
    'd-star-lite': {
      characteristics: [
        '• Modern variant of D* with improved efficiency',
        '• Time complexity: O(E log V)',
        '• Space complexity: O(V)',
        '• Incrementally repairs paths when environment changes',
        '• Uses heuristic information like A*'
      ],
      advantages: 'Faster replanning than original D* in dynamic environments.',
      disadvantages: 'Still has higher complexity than static algorithms like A*.'
    }
  };

  const getAlgorithmInfo = (id: string) => {
    return algorithmsCharacteristics[id as keyof typeof algorithmsCharacteristics];
  };

  const info = getAlgorithmInfo(algorithm.id);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{algorithm.name}</Text>
                <View style={[styles.algorithmTag, styles[`${algorithm.id}Tag`]]}>
                  <Text style={styles.algorithmTagText}>{algorithm.category}</Text>
                </View>
              </View>
              
              <Text style={styles.modalDescription}>{algorithm.description}</Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Characteristics</Text>
                <View style={styles.characteristicsBox}>
                  {info.characteristics.map((item, index) => (
                    <Text key={index} style={styles.characteristicsText}>{item}</Text>
                  ))}
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Advantages</Text>
                <Text style={styles.sectionText}>{info.advantages}</Text>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Disadvantages</Text>
                <Text style={styles.sectionText}>{info.disadvantages}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  algorithmTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  'dijkstraTag': {
    backgroundColor: '#FFF3E0',
  },
  'a-starTag': {
    backgroundColor: '#E8F5E9',
  },
  'd-starTag': {
    backgroundColor: '#F3E5F5',
  },
  'd-star-liteTag': {
    backgroundColor: '#E3F2FD',
  },
  algorithmTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    lineHeight: 22,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  characteristicsBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  characteristicsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  sectionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 21,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AlgorithmInfoModal;