import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import CheckoutSuccess from "./CheckoutSuccess";
import PosApp from "./PosApp";
import PreviewGate from "./PreviewGate";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/pos"
          element={
            <PreviewGate>
              <PosApp />
            </PreviewGate>
          }
        />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
