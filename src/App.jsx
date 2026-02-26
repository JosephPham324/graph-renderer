import { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import Header from './components/Header';
import LeftPane from './components/LeftPane';
import PreviewPane from './components/PreviewPane';
import useResizableSplit from './hooks/useResizableSplit';

const STORAGE_KEY = 'graph-renderer-state-v2';

const DEFAULT_MERMAID = `graph TD
    A[🎯 Start] --> B{Decision Point}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[✅ Complete]
    D --> E`;

const DEFAULT_PLANTUML = `@startuml
participant User
participant "Graph Renderer" as App
participant "PlantUML Server" as Server

User -> App: Type diagram code
App -> App: Encode (Deflate + Base64)
App -> Server: Fetch image URL
Server --> App: Return SVG
App --> User: Display preview
@enduml`;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

/**
 * Resolve a PNG blob from whatever is currently rendered in the preview.
 * @param {'mermaid'|'plantuml'} engine
 */
async function getDiagramPngBlob(engine) {
  if (engine === 'mermaid') {
    const svgEl = document.querySelector('.diagram-content--mermaid svg');
    if (!svgEl) return null;
    const cloned = svgEl.cloneNode(true);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cloned)], { type: 'image/svg+xml;charset=utf-8' }));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob); }, 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  } else {
    const imgEl = document.querySelector('.diagram-content--plantuml img');
    if (!imgEl?.src) return null;
    try {
      const res = await fetch(imgEl.src.replace('/plantuml/svg/', '/plantuml/png/'));
      return await res.blob();
    } catch { return null; }
  }
}

export default function App() {
  const saved = useRef(loadState());

  const [mermaidCode, setMermaidCode] = useState(saved.current?.mermaidCode ?? DEFAULT_MERMAID);
  const [plantumlCode, setPlantumlCode] = useState(saved.current?.plantumlCode ?? DEFAULT_PLANTUML);
  const [mode, setMode] = useState(saved.current?.mode ?? 'mermaid'); // active editor tab
  const [requirements, setRequirements] = useState(saved.current?.requirements ?? '');

  const mainRef = useRef(null);
  const [leftRightSplit, handleLeftRightMouseDown] = useResizableSplit(50, 'horizontal', mainRef);

  // Persist state
  useEffect(() => {
    const t = setTimeout(() => saveState({ mermaidCode, plantumlCode, mode, requirements }), 500);
    return () => clearTimeout(t);
  }, [mermaidCode, plantumlCode, mode, requirements]);

  // Active code: routing to the right setter
  const activeCode = mode === 'mermaid' ? mermaidCode : plantumlCode;
  const setActiveCode = mode === 'mermaid' ? setMermaidCode : setPlantumlCode;

  // Import into active editor
  const handleImport = useCallback((content) => {
    setActiveCode(content);
  }, [setActiveCode]);

  // Save image (active engine)
  const handleExportImage = useCallback(async () => {
    const blob = await getDiagramPngBlob(mode);
    if (!blob) { alert('No diagram rendered yet.'); return; }
    const link = document.createElement('a');
    link.download = `diagram-${mode}-${Date.now()}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [mode]);

  // Export all: requirements + both codes + both charts
  const handleExportAll = useCallback(async () => {
    const zip = new JSZip();
    zip.file('requirements.md', requirements || '(empty)');
    zip.file('diagram.mmd', mermaidCode || '(empty)');
    zip.file('diagram.puml', plantumlCode || '(empty)');

    const [mBlob, pBlob] = await Promise.all([
      getDiagramPngBlob('mermaid'),
      getDiagramPngBlob('plantuml'),
    ]);
    if (mBlob) zip.file('chart-mermaid.png', mBlob);
    if (pBlob) zip.file('chart-plantuml.png', pBlob);

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = `graph-renderer-export-${Date.now()}.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [requirements, mermaidCode, plantumlCode]);

  return (
    <div className="app-container">
      <Header
        mode={mode}
        onModeChange={setMode}
        onImport={handleImport}
        onExportImage={handleExportImage}
        onExportAll={handleExportAll}
      />

      <div className="main-content" ref={mainRef}>
        {/* Left pane */}
        <div style={{ width: `${leftRightSplit}%`, display: 'flex', overflow: 'hidden' }}>
          <LeftPane
            requirements={requirements}
            onRequirementsChange={setRequirements}
            code={activeCode}
            onCodeChange={setActiveCode}
            mode={mode}
          />
        </div>

        {/* Left/Right drag handle */}
        <div
          className="split-handle split-handle--vertical"
          onMouseDown={handleLeftRightMouseDown}
          title="Drag to resize"
        />

        {/* Right pane */}
        <div style={{ width: `${100 - leftRightSplit}%`, display: 'flex', overflow: 'hidden' }}>
          <PreviewPane
            mermaidCode={mermaidCode}
            plantumlCode={plantumlCode}
          />
        </div>
      </div>
    </div>
  );
}
