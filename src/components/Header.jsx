import { useRef } from 'react';

export default function Header({ mode, onModeChange, onImport, onExportImage, onExportAll }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onImport(event.target.result);
    };
    reader.readAsText(file);

    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">⬡</div>
        <h1 className="header-title">Graph Renderer</h1>
      </div>

      <div className="header-actions">
        {/* Mode Toggle — Active Editor Tab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Editor:</span>
          <div className="mode-toggle">
            <button
              className={`mode-toggle-btn ${mode === 'mermaid' ? 'active' : ''}`}
              onClick={() => onModeChange('mermaid')}
            >
              Mermaid
            </button>
            <button
              className={`mode-toggle-btn ${mode === 'plantuml' ? 'active' : ''}`}
              onClick={() => onModeChange('plantuml')}
            >
              PlantUML
            </button>
          </div>
        </div>

        {/* Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.mmd,.puml"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="action-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Import
        </button>

        {/* Export Image */}
        <button className="action-btn" onClick={onExportImage}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Save Image
        </button>

        {/* Export All as ZIP */}
        <button className="action-btn primary" onClick={onExportAll}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 11.25a.75.75 0 001.5 0v-2.546l.943 1.048a.75.75 0 101.114-1.004l-2.25-2.5a.75.75 0 00-1.114 0l-2.25 2.5a.75.75 0 101.114 1.004l.943-1.048v2.546z" clipRule="evenodd" />
          </svg>
          Export All (.zip)
        </button>
      </div>
    </header>
  );
}
