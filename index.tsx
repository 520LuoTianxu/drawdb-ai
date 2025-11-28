import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress benign ResizeObserver error that can crash the app in dev mode
// This is a known issue with ResizeObserver and some library interactions
const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications.';

// 1. Window error handler
window.addEventListener('error', (e) => {
  const msg = e.message;
  // Use .includes() to catch variations of the error message
  if (
    msg.includes('ResizeObserver loop limit exceeded') ||
    msg.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// 2. Console error override (some environments print directly)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && 
      (args[0].includes('ResizeObserver loop') || args[0].includes('undelivered notifications'))) {
    return;
  }
  originalConsoleError(...args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);