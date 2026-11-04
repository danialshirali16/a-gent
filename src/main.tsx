import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import App from './App';
import './styles/tokens.css';
import './styles.css';
import './styles/reason.css';

if (Capacitor.isNativePlatform()) {
  void NativeApp.addListener('backButton', () => {
    const event = new CustomEvent('agent:back', { cancelable: true });
    const handled = !window.dispatchEvent(event);
    if (!handled) void NativeApp.exitApp();
  });
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
