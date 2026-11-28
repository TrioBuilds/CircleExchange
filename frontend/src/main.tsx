import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyAppearance, getAppearance, systemAppearance } from './app/appearance';
import './styles.css';
import './welcome.css';
import './circle-board.css';

applyAppearance(getAppearance());
systemAppearance?.addEventListener?.('change', () => applyAppearance(getAppearance()));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
