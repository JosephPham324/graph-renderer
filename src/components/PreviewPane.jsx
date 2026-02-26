import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { encodePlantUML } from '../utils/plantumlEncoder';

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'forest',
  securityLevel: 'loose',
  fontFamily: "'Inter', sans-serif",
});

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

export default function PreviewPane({ code, mode }) {
  const [svgContent, setSvgContent] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const renderIdRef = useRef(0);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Drag-to-pan handlers
  const handleMouseDown = useCallback((e) => {
    // Only left click, ignore if clicking controls
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
    e.preventDefault();
  }, [panOffset]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Ctrl+scroll to zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((z) => Math.min(z + ZOOM_STEP * 0.5, MAX_ZOOM));
        } else {
          setZoom((z) => Math.max(z - ZOOM_STEP * 0.5, MIN_ZOOM));
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const renderMermaid = useCallback(async (text) => {
    const id = `mermaid-${Date.now()}`;
    try {
      await mermaid.parse(text);
      const { svg } = await mermaid.render(id, text);
      return { svg, error: null };
    } catch (err) {
      const el = document.getElementById(id);
      if (el) el.remove();
      return { svg: null, error: err.message || 'Invalid Mermaid syntax' };
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = code.trim();

    if (!trimmed) {
      setSvgContent('');
      setImgUrl('');
      setError('');
      setRendering(false);
      return;
    }

    setRendering(true);

    debounceRef.current = setTimeout(async () => {
      const currentRender = ++renderIdRef.current;

      if (mode === 'mermaid') {
        const result = await renderMermaid(trimmed);
        if (currentRender !== renderIdRef.current) return;

        if (result.error) {
          setError(result.error);
          setSvgContent('');
        } else {
          setError('');
          setSvgContent(result.svg);
        }
        setImgUrl('');
      } else {
        try {
          const url = encodePlantUML(trimmed);
          if (currentRender !== renderIdRef.current) return;
          setImgUrl(url);
          setSvgContent('');
          setError('');
        } catch (err) {
          if (currentRender !== renderIdRef.current) return;
          setError(err.message || 'Failed to encode PlantUML');
          setImgUrl('');
          setSvgContent('');
        }
      }

      setRendering(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [code, mode, renderMermaid]);

  const isEmpty = !code.trim();
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Preview</span>
          <span style={{
            fontSize: '0.625rem',
            padding: '0.125rem 0.5rem',
            background: mode === 'mermaid' ? '#fff' : 'rgba(16,185,129,0.15)',
            color: mode === 'mermaid' ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
            borderRadius: '4px',
            fontWeight: 500,
            textTransform: 'none',
            letterSpacing: 0,
          }}>
            {mode === 'mermaid' ? 'Mermaid' : 'PlantUML'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                <path d="M3.5 8a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
            <button className="zoom-label" onClick={resetZoom} title="Reset Zoom">
              {zoomPercent}%
            </button>
            <button className="zoom-btn" onClick={zoomIn} title="Zoom In">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                <path d="M8 3.5a.5.5 0 0 1 .5.5v3.5H12a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
              </svg>
            </button>
          </div>

          {/* Status */}
          <div className="preview-status">
            {!isEmpty && (
              <>
                <span className={`status-dot ${error ? 'error' : ''}`}></span>
                <span>{rendering ? 'Rendering...' : error ? 'Error' : 'Ready'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`preview-content ${isDragging ? 'dragging' : ''}`}
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {isEmpty ? (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">◇</div>
            <div className="preview-placeholder-text">
              Start typing {mode === 'mermaid' ? 'Mermaid' : 'PlantUML'} code<br />
              to see a live preview
            </div>
          </div>
        ) : error ? (
          <div className="preview-error fade-in">{error}</div>
        ) : svgContent ? (
          <div
            className="preview-diagram fade-in"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'top center',
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : imgUrl ? (
          <img
            className="preview-diagram fade-in"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'top center',
            }}
            src={imgUrl}
            alt="PlantUML Diagram"
            onError={() => setError('Failed to load diagram from PlantUML server')}
            draggable={false}
          />
        ) : null}
      </div>
    </div>
  );
}
