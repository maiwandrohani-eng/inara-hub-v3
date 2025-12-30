import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting React app...');
console.log('main.tsx: App imported successfully');

// Add error boundary and better error handling
try {
  console.log('main.tsx: Getting root element...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element (#root) not found in DOM!');
  }

  console.log('main.tsx: Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('main.tsx: Rendering App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ React app mounted successfully!');
} catch (error) {
  console.error('❌ Failed to mount React app:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px; color: #ef4444; font-family: monospace; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #ef4444; margin-bottom: 20px;">❌ Error Loading Application</h1>
        <p style="margin-bottom: 10px;"><strong>Mount Error:</strong></p>
        <pre style="background: #1f2937; padding: 20px; border-radius: 8px; overflow-x: auto; color: #f9fafb;">
${error instanceof Error ? error.message : 'Unknown error'}
${error instanceof Error && error.stack ? '\n\nStack:\n' + error.stack : ''}
        </pre>
        <p style="margin-top: 20px; color: #9ca3af;">Please check the browser console (F12) for more details.</p>
        <p style="margin-top: 10px; color: #9ca3af;">Common causes:</p>
        <ul style="margin-top: 10px; color: #9ca3af; margin-left: 20px;">
          <li>JavaScript syntax error</li>
          <li>Missing dependency</li>
          <li>Module import error</li>
          <li>Build/dev server issue</li>
        </ul>
      </div>
    `;
  }
}

