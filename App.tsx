import { ScreenContent } from 'components/ScreenContent';
import { StatusBar } from 'expo-status-bar';
import MapClient from 'components/MapClient';


import './global.css';

export default function App() {
  return (
    <>
      <MapClient />
      <StatusBar style="auto" />
    </>
  );
}

