export default function LeftPane({
  requirements,
  onRequirementsChange,
  code,
  onCodeChange,
  mode,
}) {
  const codePlaceholder =
    mode === 'mermaid'
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
    <div className="left-pane">
      {/* Requirements Section */}
      <div className="editor-section">
        <div className="editor-label">
          <span className="editor-label-dot"></span>
          Requirements
        </div>
        <textarea
          className="editor-textarea"
          value={requirements}
          onChange={(e) => onRequirementsChange(e.target.value)}
          placeholder="Paste your project specs, notes, or requirements here..."
          spellCheck={false}
        />
      </div>

      {/* Code Editor Section */}
      <div className="editor-section">
        <div className="editor-label">
          <span className="editor-label-dot emerald"></span>
          {mode === 'mermaid' ? 'Mermaid' : 'PlantUML'} Code
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
