import React from 'react';
import { createRoot } from 'react-dom/client';
import MindMapView from './MindMapView';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MindMapView />);
}
