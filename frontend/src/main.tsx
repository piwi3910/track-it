// @ts-nocheck - Temporarily disable type checking in this file
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ThemeProvider, ApiProvider, AuthProvider } from './components/providers';
import App from './App';

// Import for query client configuration
import { trpc, trpcClient, queryClient } from './utils/trpc-client';
import { QueryClientProvider } from '@tanstack/react-query';

// Import all required styles
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

// Define theme with light/dark support
const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  // Add more theme customizations as needed
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient}>
        <ColorSchemeScript defaultColorScheme="light" />
        <MantineProvider theme={theme} defaultColorScheme="light">
          <ThemeProvider>
            <ApiProvider>
              <AuthProvider>
                <Notifications position="top-right" />
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </AuthProvider>
            </ApiProvider>
          </ThemeProvider>
        </MantineProvider>
      </trpc.Provider>
    </QueryClientProvider>
  </StrictMode>,
);