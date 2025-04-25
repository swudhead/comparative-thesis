import { ScreenContent } from 'components/ScreenContent';
import { StatusBar } from 'expo-status-bar';
import MapClient from 'components/MapClient';


import './global.css';

export default function App() {
  return (
    <>
      <ScreenContent title="Home" path="App.tsx" />
      <MapClient />
      <StatusBar style="auto" />
    </>
  );
}
