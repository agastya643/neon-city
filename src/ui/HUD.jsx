export function CreditsScreen({ onClose }) {
  return (
    <div className="ui-panel">
      <div className="credits-panel">
        <div className="panel-header">
          <h2>Credits</h2>
          <button className="panel-close" onClick={onClose}>Back</button>
        </div>

        <div className="credits-list">
          <div>Lead design: Neon Grid</div>
          <div>World tech: Hand-built procedural streets</div>
          <div>Audio: Synth pulse engine</div>
          <div>Movement: Mobile-first controller layout</div>
          <div>Art style: Original low-poly cyber city</div>
        </div>
      </div>
    </div>
  );
}
