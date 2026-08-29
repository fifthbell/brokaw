/// <reference types="vite/client" />
import './style.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import LiveProgram from '../components/live-program/LiveProgram.js';

declare global {
  interface Window {
    __FIFTHBELL_LIVE_PROGRAM_CONFIG__?: {
      programId?: string;
      apiBaseUrl?: string;
    };
  }
}

const query = new URLSearchParams(window.location.search);
const runtimeConfig = window.__FIFTHBELL_LIVE_PROGRAM_CONFIG__ ?? {};
const programId = runtimeConfig.programId || query.get('programId') || import.meta.env.VITE_PROGRAM_ID || 'fifthbell';
const apiBaseUrl = runtimeConfig.apiBaseUrl || query.get('apiBaseUrl') || import.meta.env.VITE_API_BASE_URL;

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <LiveProgram
        programId={programId}
        apiBaseUrl={apiBaseUrl}
      />
    </React.StrictMode>
  );
}
