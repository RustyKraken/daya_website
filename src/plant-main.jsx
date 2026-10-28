import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import PlantYourSeed from './plant/PlantYourSeed.jsx';
import './styles.css';
import './plant/plant.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PlantYourSeed />
  </React.StrictMode>,
);
