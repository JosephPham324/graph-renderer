import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { encodePlantUML } from '../utils/plantumlEncoder';
import useResizableSplit from '../hooks/useResizableSplit';

// Initialize mermaid with dark theme once
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: "'Inter', sans-serif",
});

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

// ─────────────────────────────────────────────
// Single sub-pane for one diagram engine
// ─────────────────────────────────────────────
function DiagramPane({ code, engine, style }) {
  const [svgContent, setSvgContent] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const contentRef = useRef(null);
  const debounceRef = useRef(null);
  const renderIdRef = useRef(0);

  const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  const resetView = () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); };

  // Ctrl+scroll to zoom
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? ZOOM_STEP * 0.5 : -ZOOM_STEP * 0.5;
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Drag-to-pan
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
    e.preventDefault();
  }, [panOffset]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPanOffset({
      x: panStartRef.current.x + (e.clientX - dragStartRef.current.x),
      y: panStartRef.current.y + (e.clientY - dragStartRef.current.y),
    });
  }, [isDragging]);

  const stopDrag = useCallback(() => setIsDragging(false), []);

  // Render logic
  const renderMermaid = useCallback(async (text) => {
    const id = `mermaid-${engine}-${Date.now()}`;
    try {
      await mermaid.parse(text);
      const { svg } = await mermaid.render(id, text);
      return { svg, error: null };
    } catch (err) {
      const el = document.getElementById(id);
      if (el) el.remove();
      return { svg: null, error: err.message || 'Invalid Mermaid syntax' };
    }
  }, [engine]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = code.trim();

    if (!trimmed) {
      setSvgContent(''); setImgUrl(''); setError(''); setRendering(false);
      return;
    }

    setRendering(true);
    debounceRef.current = setTimeout(async () => {
      const currentRender = ++renderIdRef.current;

      if (engine === 'mermaid') {
        const result = await renderMermaid(trimmed);
        if (currentRender !== renderIdRef.current) return;
        if (result.error) { setError(result.error); setSvgContent(''); }
        else { setError(''); setSvgContent(result.svg); }
        setImgUrl('');
      } else {
        try {
          const url = encodePlantUML(trimmed);
          if (currentRender !== renderIdRef.current) return;
          setImgUrl(url); setSvgContent(''); setError('');
        } catch (err) {
          if (currentRender !== renderIdRef.current) return;
          setError(err.message || 'Failed to encode PlantUML');
          setImgUrl(''); setSvgContent('');
        }
      }
      setRendering(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [code, engine, renderMermaid]);

  const isEmpty = !code.trim();
  const zoomPercent = Math.round(zoom * 100);
  const isMermaid = engine === 'mermaid';

  return (
    <div className="diagram-sub-pane" style={style}>
      {/* Sub-pane header */}
      <div className="sub-pane-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`engine-badge ${isMermaid ? 'engine-badge--mermaid' : 'engine-badge--plantuml'}`}>
            {isMermaid ? 'Mermaid' : 'PlantUML'}
          </span>
          <div className="preview-status">
            {!isEmpty && (
              <>
                <span className={`status-dot ${error ? 'error' : ''}`}></span>
                <span>{rendering ? 'Rendering...' : error ? 'Error' : 'Ready'}</span>
              </>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
              <path d="M3.5 8a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5z"/>
            </svg>
          </button>
          <button className="zoom-label" onClick={resetView} title="Reset View">
            {zoomPercent}%
          </button>
          <button className="zoom-btn" onClick={zoomIn} title="Zoom In">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
              <path d="M8 3.5a.5.5 0 0 1 .5.5v3.5H12a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Diagram content */}
      <div
        ref={contentRef}
        className={`diagram-content diagram-content--${engine} ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {isEmpty ? (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">◇</div>
            <div className="preview-placeholder-text">
              Start typing {isMermaid ? 'Mermaid' : 'PlantUML'} code<br />
              to see a live preview
            </div>
          </div>
        ) : error ? (
          <div className="preview-error fade-in">{error}</div>
        ) : svgContent ? (
          <div
            className="preview-diagram fade-in"
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: 'top center' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : imgUrl ? (
          <img
            className="preview-diagram fade-in"
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: 'top center' }}
            src={imgUrl}
            alt="PlantUML Diagram"
            draggable={false}
            onError={() => setError('Failed to load diagram from PlantUML server')}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PreviewPane: two DiagramPanes split vertically
// ─────────────────────────────────────────────
export default function PreviewPane({ mermaidCode, plantumlCode }) {
  const containerRef = useRef(null);
  const [splitPercent, handleSplitMouseDown] = useResizableSplit(50, 'vertical', containerRef);

  return (
    <div className="preview-pane" ref={containerRef}>
      <DiagramPane
        code={mermaidCode}
        engine="mermaid"
        style={{ height: `${splitPercent}%` }}
      />

      <div
        className="split-handle split-handle--horizontal"
        onMouseDown={handleSplitMouseDown}
        title="Drag to resize"
      />

      <DiagramPane
        code={plantumlCode}
        engine="plantuml"
        style={{ height: `${100 - splitPercent}%` }}
      />
    </div>
  );
}
