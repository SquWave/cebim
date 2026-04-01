import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ── iOS PWA Standalone Keyboard Fix ──
// iOS standalone PWA mode can silently swallow touch-to-focus events on
// input / textarea / select elements, preventing the virtual keyboard
// from appearing. This listener detects standalone mode and forces focus
// on touchend so iOS treats it as a trusted user gesture.
const isStandalone =
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

if (isStandalone) {
  document.addEventListener('touchend', (e) => {
    const el = e.target.closest('input, textarea, select');
    if (el && !el.disabled && !el.readOnly) {
      // Prevent iOS from swallowing the focus
      e.preventDefault();
      el.focus();
      // For text inputs, also place the cursor via click()
      if (el.tagName !== 'SELECT') {
        el.click();
      }
    }
  }, false);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
