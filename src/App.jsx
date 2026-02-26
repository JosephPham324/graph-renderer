import { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import Header from './components/Header';
import LeftPane from './components/LeftPane';
import PreviewPane from './components/PreviewPane';

const STORAGE_KEY = 'graph-renderer-state';

const DEFAULT_MERMAID = `graph TD
    A[🎯 Start] --> B{Decision Point}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[✅ Complete]
    D --> E`;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Generate a PNG blob from the currently rendered diagram.
 * Works for both Mermaid (SVG→Canvas→PNG) and PlantUML (server PNG fetch).
 */
async function getDiagramPngBlob(mode) {
  if (mode === 'mermaid') {
    const svgEl = document.querySelector('.preview-content svg');
    if (!svgEl) return null;

    const clonedSvg = svgEl.cloneNode(true);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

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

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } else {
    const imgEl = document.querySelector('.preview-content img');
    if (!imgEl || !imgEl.src) return null;

    try {
      const pngUrl = imgEl.src.replace('/plantuml/svg/', '/plantuml/png/');
      const response = await fetch(pngUrl);
      return await response.blob();
    } catch {
      return null;
    }
  }
}

export default function App() {
  const savedState = useRef(loadState());

  const [requirements, setRequirements] = useState(
    savedState.current?.requirements ?? ''
  );
  const [code, setCode] = useState(
    savedState.current?.code ?? DEFAULT_MERMAID
  );
  const [mode, setMode] = useState(
    savedState.current?.mode ?? 'mermaid'
  );

  // Persist state to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveState({ requirements, code, mode });
    }, 500);
    return () => clearTimeout(timeout);
  }, [requirements, code, mode]);

  // Import handler
  const handleImport = useCallback((content) => {
    setCode(content);
  }, []);

  // Export image only
  const handleExportImage = useCallback(async () => {
    const blob = await getDiagramPngBlob(mode);
    if (!blob) {
      alert('No diagram to export. Please ensure a valid diagram is rendered.');
      return;
    }
    const link = document.createElement('a');
    link.download = `diagram-${Date.now()}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [mode]);

  // Export all panes as .zip
  const handleExportAll = useCallback(async () => {
    const zip = new JSZip();

    // Add requirements
    zip.file('requirements.md', requirements || '(empty)');

    // Add code with appropriate extension
    const ext = mode === 'mermaid' ? 'mmd' : 'puml';
    zip.file(`diagram.${ext}`, code || '(empty)');

    // Add chart image
    const chartBlob = await getDiagramPngBlob(mode);
    if (chartBlob) {
      zip.file('chart.png', chartBlob);
    }

    // Generate and download
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = `graph-renderer-export-${Date.now()}.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [requirements, code, mode]);

  return (
    <div className="app-container">
      <Header
        mode={mode}
        onModeChange={setMode}
        onImport={handleImport}
        onExportImage={handleExportImage}
        onExportAll={handleExportAll}
      />
      <div className="main-content">
        <LeftPane
          requirements={requirements}
          onRequirementsChange={setRequirements}
          code={code}
          onCodeChange={setCode}
          mode={mode}
        />
        <PreviewPane code={code} mode={mode} />
      </div>
    </div>
  );
}
