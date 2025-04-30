import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>About This Project</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparative Analysis of Navigation Algorithms</Text>
          <Text style={styles.description}>
            This study evaluates and compares four navigation algorithms—Dijkstra, A*, D*, and D* Lite—to determine which performs best in optimizing routes for trimobiles and e-trikes in Naga City.
          </Text>
          <Text style={styles.description}>
            Using real road network data from OpenStreetMap and simulated through Python with OSMnx, the study models the city's transportation graph for optimal pathfinding.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Algorithm Comparison</Text>
          <Text style={styles.description}>
            Each algorithm is evaluated based on:
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• Computation time</Text>
            <Text style={styles.bulletPoint}>• Path distance</Text>
            <Text style={styles.bulletPoint}>• Number of nodes visited</Text>
            <Text style={styles.bulletPoint}>• Memory usage</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Naga City</Text>
          <Text style={styles.description}>
            Naga City is located in the Bicol Region of the Philippines. As a growing urban center, optimizing public transportation routes can significantly improve mobility and reduce congestion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Research Methodology</Text>
          <Text style={styles.description}>
            The research uses OpenStreetMap data to build a realistic road network model. Algorithms are implemented in Python and visualized through this application to demonstrate performance differences in real scenarios.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acknowledgements</Text>
          <Text style={styles.description}>
            This project utilizes data from OpenStreetMap contributors, Mapbox for visualization, and various open-source libraries for algorithm implementation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  bulletPoints: {
    marginTop: 8,
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 4,
  },
});