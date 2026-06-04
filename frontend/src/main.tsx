import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { ShareRequestsProvider } from './contexts/ShareRequestsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ShareRequestsProvider>
        <App />
      </ShareRequestsProvider>
    </AuthProvider>
  </StrictMode>,
);