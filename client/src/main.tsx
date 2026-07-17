
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./styles/globals.css";

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
  const googleClientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    "google-sign-in-not-configured";
  createRoot(rootElement).render(
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  );
}
  