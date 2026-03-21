
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("[Mashtal] main.tsx starting");

// Debug: capture any unhandled promise rejections globally.
// This helps identify broken flows like "Save edits" that fail before our local try/catch.
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  // eslint-disable-next-line no-console
  console.error('[Mashtal] unhandledrejection', event.reason);
});

window.addEventListener('error', (event) => {
  // eslint-disable-next-line no-console
  console.error('[Mashtal] error', event);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('[Mashtal] Root element with id="root" not found');
} else {
  console.log("[Mashtal] Root element found, mounting React app");
  createRoot(rootElement).render(<App />);
}
  