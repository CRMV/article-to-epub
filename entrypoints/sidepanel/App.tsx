import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <main className="app-shell">
      <header className="top-strip">
        <div>
          <p className="eyebrow">Ready</p>
          <h1>Article Ferry</h1>
        </div>
      </header>
      <section className="panel-section">
        <h2>Preview</h2>
        <p>Open an article tab and click the extension action to prepare a local EPUB.</p>
      </section>
    </main>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;

