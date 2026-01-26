import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSentry, initGoogleAnalytics } from './utils/monitoring'

// 初始化監控系統
const sentryDSN = import.meta.env.VITE_SENTRY_DSN || '';
const environment = import.meta.env.MODE || 'development';
const googleAnalyticsID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '';

if (sentryDSN) {
  initSentry(sentryDSN, environment);
}

if (googleAnalyticsID) {
  initGoogleAnalytics(googleAnalyticsID);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
