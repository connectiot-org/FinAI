import { installAssetRecovery } from "./lib/asset-recovery";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { ToastProvider } from "./components/ui";
import { AppRouter } from "./app/router";
import "./styles/global.css";
import "./styles/workspace-reference.css";
const removeAssetRecovery = installAssetRecovery();
if (import.meta.hot) import.meta.hot.dispose(removeAssetRecovery);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </Provider>
  </StrictMode>,
);
