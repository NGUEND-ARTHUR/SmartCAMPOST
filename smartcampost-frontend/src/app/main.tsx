/* eslint-env browser */
/* eslint-disable no-undef */
import "../i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import App from "./App";
import "../index.css";

export function bootstrapApp() {
  const rootElement = document.getElementById("root") as HTMLElement;

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
    </React.StrictMode>
  );
}


