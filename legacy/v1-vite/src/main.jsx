import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { GarageProvider } from './store/garageStore';
import './index.css';

const root = document.getElementById('root');
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <GarageProvider>
          <App />
        </GarageProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);

// Page pré-rendue → hydratation ; sinon (mode dev) rendu classique.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
