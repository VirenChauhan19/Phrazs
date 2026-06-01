import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { StoreProvider } from "./store.jsx";
import { AuthProvider } from "./auth.jsx";
import { UserAuthProvider } from "./user-auth.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <UserAuthProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </UserAuthProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
