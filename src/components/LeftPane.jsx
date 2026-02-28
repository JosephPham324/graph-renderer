import { useRef, useState } from "react";
import useResizableSplit from "../hooks/useResizableSplit";
import ReactMarkdown from "react-markdown";

export default function LeftPane({ requirements, onRequirementsChange, code, onCodeChange, mode }) {
  const containerRef = useRef(null);
  const [splitPercent, handleSplitMouseDown] = useResizableSplit(40, "vertical", containerRef);
  const [isPreview, setIsPreview] = useState(false);

  const codePlaceholder =
    mode === "mermaid"
      ? `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do something]
    B -->|No| D[Do something else]
    C --> E[End]
    D --> E`
      : `@startuml
Alice -> Bob: Hello
Bob --> Alice: Hi there!
@enduml`;

  return (
    <div className="left-pane" ref={containerRef}>
      <div className="editor-section" style={{ height: `${splitPercent}%` }}>
        <div className="editor-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "12px" }}>
          <div>
            <span className="editor-label-dot"></span>
            Requirements
          </div>
          <button
            className="toggle-preview-btn"
            onClick={() => setIsPreview(!isPreview)}
            style={{
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: isPreview ? "#e2e8f0" : "#3b82f6",
              color: isPreview ? "#475569" : "#ffffff",
              fontSize: "0.75rem",
              fontWeight: "600",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            {isPreview ? "Edit Source" : "View Markdown"}
          </button>
        </div>

        {isPreview ? (
          <div className="markdown-preview" style={{ overflowY: "auto", padding: "1rem", height: "100%" }}>
            <ReactMarkdown>{requirements}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            className="editor-textarea"
            value={requirements}
            onChange={(e) => onRequirementsChange(e.target.value)}
            placeholder="Paste your project specs, notes, or requirements here..."
            spellCheck={false}
          />
        )}
      </div>

      <div className="split-handle split-handle--horizontal" onMouseDown={handleSplitMouseDown} title="Drag to resize" />

      <div className="editor-section" style={{ height: `${100 - splitPercent}%` }}>
        <div className="editor-label">
          <span className="editor-label-dot emerald"></span>
          {mode === "mermaid" ? "Mermaid" : "PlantUML"} Code
        </div>
        <textarea
          className="editor-textarea"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder={codePlaceholder}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
