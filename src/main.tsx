import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import App from './App';
import { ToastProvider } from './ui/Alert';
import { AvatarRuntimeProvider } from './ui/Avatar';
import './styles/tokens.css';
import './styles.css';
import './styles/dialog.css';
import './styles/reason.css';
import './styles/responsive.css';
import './styles/button.css';
import './styles/input.css';
import './styles/field.css';
import './styles/select.css';
import './styles/checkbox.css';
import './styles/tabs.css';
import './styles/tooltip.css';
import './styles/menu.css';
import './styles/popover.css';
import './styles/composer.css';
import './styles/badge.css';
import './styles/avatar.css';
import './styles/alert.css';
import './styles/card.css';
import './styles/search.css';
import './styles/attachment.css';
import './styles/sidebar.css';
import { isPreviewComponent } from './dev/previews';

if (Capacitor.isNativePlatform()) {
  void NativeApp.addListener('backButton', () => {
    const event = new CustomEvent('agent:back', { cancelable: true });
    const handled = !window.dispatchEvent(event);
    if (!handled) void NativeApp.exitApp();
  });
}

const root = createRoot(document.getElementById('root')!);
const preview = import.meta.env.DEV ? new URLSearchParams(location.search).get('component') : null;
if (import.meta.env.DEV && isPreviewComponent(preview)) {
  void import('./dev/ComponentPreview').then(({ ComponentPreview }) => root.render(<React.StrictMode><ToastProvider><AvatarRuntimeProvider><ComponentPreview component={preview} /></AvatarRuntimeProvider></ToastProvider></React.StrictMode>));
} else {
  root.render(<React.StrictMode><ToastProvider><App /></ToastProvider></React.StrictMode>);
}
