import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { GoogleProvider } from './context/GoogleContext';
import { NotificationProvider } from './context/NotificationContext';
import App from './App';

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
    <ColorSchemeScript defaultColorScheme="light" />
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ThemeProvider>
        <AppProvider>
          <GoogleProvider>
            <NotificationProvider>
              <Notifications position="top-right" />
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </NotificationProvider>
          </GoogleProvider>
        </AppProvider>
      </ThemeProvider>
    </MantineProvider>
  </StrictMode>,
);
