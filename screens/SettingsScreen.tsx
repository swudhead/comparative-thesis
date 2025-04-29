import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, MapPin, Database, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [useSatelliteMap, setUseSatelliteMap] = useState(false);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [preloadData, setPreloadData] = useState(true);

  const handleResetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to default?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Reset", 
          onPress: () => {
            setShowDebugInfo(false);
            setUseSatelliteMap(false);
            setShowNodeLabels(true);
            setPreloadData(true);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached map data. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Clear", 
          onPress: () => {
            Alert.alert("Cache Cleared", "All cached map data has been cleared.");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      <View style={styles.settingsContainer}>
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Map Display</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MapPin size={20} color="#1976D2" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Use Satellite Map</Text>
            </View>
            <Switch
              value={useSatelliteMap}
              onValueChange={setUseSatelliteMap}
              trackColor={{ false: "#e0e0e0", true: "#90CAF9" }}
              thumbColor={useSatelliteMap ? "#1976D2" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MapPin size={20} color="#1976D2" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Show Node Labels</Text>
            </View>
            <Switch
              value={showNodeLabels}
              onValueChange={setShowNodeLabels}
              trackColor={{ false: "#e0e0e0", true: "#90CAF9" }}
              thumbColor={showNodeLabels ? "#1976D2" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Data & Performance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Database size={20} color="#1976D2" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Preload Map Data</Text>
            </View>
            <Switch
              value={preloadData}
              onValueChange={setPreloadData}
              trackColor={{ false: "#e0e0e0", true: "#90CAF9" }}
              thumbColor={preloadData ? "#1976D2" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Info size={20} color="#1976D2" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Show Debug Information</Text>
            </View>
            <Switch
              value={showDebugInfo}
              onValueChange={setShowDebugInfo}
              trackColor={{ false: "#e0e0e0", true: "#90CAF9" }}
              thumbColor={showDebugInfo ? "#1976D2" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <View style={styles.buttonsSection}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleClearCache}
          >
            <RefreshCw size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Clear Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.resetButton]}
            onPress={handleResetSettings}
          >
            <Text style={styles.buttonText}>Reset All Settings</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Navigation Algorithm Research</Text>
        </View>
      </View>
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
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingsSection: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resetButton: {
    backgroundColor: '#F44336',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9e9e9e',
  },
});