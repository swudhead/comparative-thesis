import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Menu, Layers } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToolbarProps = {
  title: string;
};

const Toolbar: React.FC<ToolbarProps> = ({ title }) => {
  const insets = useSafeAreaInsets();

  return <View></View>;
};

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  toolbarButton: {
    padding: 8,
  },
  toolbarTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
});

export default Toolbar;
