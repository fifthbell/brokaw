/// <reference types="vite/client" />
import './style.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import LiveProgram from '../components/live-program/LiveProgram.js';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <LiveProgram apiBaseUrl={import.meta.env.VITE_API_BASE_URL} />
    </React.StrictMode>
  );
}
