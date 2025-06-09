// Main entry point for the application
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, ApiProvider, AuthProvider, NotificationProvider, GoogleProvider } from './components/providers';
import { TRPCProvider } from './components/TRPCProvider';
import { Toaster } from './components/ui/sonner';
import App from './App';

// Import required styles
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TRPCProvider>
      <ThemeProvider>
        <ApiProvider>
          <AuthProvider>
            <GoogleProvider>
              <NotificationProvider>
                <Toaster position="top-right" />
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </NotificationProvider>
            </GoogleProvider>
          </AuthProvider>
        </ApiProvider>
      </ThemeProvider>
    </TRPCProvider>
  </StrictMode>,
);