import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import CheckoutSuccess from "./CheckoutSuccess";
import EpkPage from "./EpkPage";
import GigAdmin from "./GigAdmin";
import MediaAdmin from "./MediaAdmin";
import MemberMediaPortal from "./MemberMediaPortal";
import NotFound from "./NotFound";
import PosApp from "./PosApp";
import PreviewGate from "./PreviewGate";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/epk" element={<EpkPage />} />
        <Route
          path="/media-admin"
          element={
            <PreviewGate>
              <MediaAdmin />
            </PreviewGate>
          }
        />
        <Route
          path="/member-media"
          element={
            <PreviewGate>
              <MemberMediaPortal />
            </PreviewGate>
          }
        />
        <Route
          path="/gig-admin"
          element={
            <PreviewGate>
              <GigAdmin />
            </PreviewGate>
          }
        />
        <Route
          path="/pos"
          element={
            <PreviewGate>
              <PosApp />
            </PreviewGate>
          }
        />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
