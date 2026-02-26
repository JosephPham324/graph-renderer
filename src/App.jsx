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
 * Resolve an image blob from whatever is currently rendered in the preview.
 * @param {'mermaid'|'plantuml'} engine
 */
async function getDiagramBlob(engine) {
  if (engine === 'mermaid') {
    const svgEl = document.querySelector('.diagram-content--mermaid svg');
    if (!svgEl) return { blob: null, ext: 'svg' };

    const cloned = svgEl.cloneNode(true);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Ensure it has a solid background so it looks good when opened in image viewers
    cloned.style.backgroundColor = '#0f172a'; // Match the app's dark theme background

    // Read full dimensions to ensure explicit width/height
    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      cloned.setAttribute('width', parts[2]);
      cloned.setAttribute('height', parts[3]);
    } else {
      const bbox = svgEl.getBBox();
      cloned.setAttribute('width', bbox.width + bbox.x);
      cloned.setAttribute('height', bbox.height + bbox.y);
    }

    const svgData = new XMLSerializer().serializeToString(cloned);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    return { blob, ext: 'svg' };
  } else {
    const imgEl = document.querySelector('.diagram-content--plantuml img');
    if (!imgEl?.src) return { blob: null, ext: 'png' };
    try {
      const res = await fetch(imgEl.src.replace('/plantuml/svg/', '/plantuml/png/'));
      return { blob: await res.blob(), ext: 'png' };
    } catch { return { blob: null, ext: 'png' }; }
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
    const { blob, ext } = await getDiagramBlob(mode);
    if (!blob) { alert('No diagram rendered yet.'); return; }
    const link = document.createElement('a');
    link.download = `diagram-${mode}-${Date.now()}.${ext}`;
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

    const [mResult, pResult] = await Promise.all([
      getDiagramBlob('mermaid'),
      getDiagramBlob('plantuml'),
    ]);
    if (mResult.blob) zip.file(`chart-mermaid.${mResult.ext}`, mResult.blob);
    if (pResult.blob) zip.file(`chart-plantuml.${pResult.ext}`, pResult.blob);

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
