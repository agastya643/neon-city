export function SettingsScreen({
  quality,
  showFps,
  autoQuality,
  fullscreen,
  onQualityChange,
  onToggleFps,
  onToggleAutoQuality,
  onToggleFullscreen,
  onClose,
  buttonScale,
  buttonOffset,
  onButtonScaleChange,
  onButtonOffsetChange,
}) {
  const qualityOptions = ['low', 'medium', 'high', 'ultra'];

  return (
    <div className="ui-panel">
      <div className="settings-card">
        <div className="panel-header">
          <h2>Settings</h2>
          <button className="panel-close" onClick={onClose}>Back</button>
        </div>

        <div className="quality-options">
          {qualityOptions.map((item) => (
            <div className="quality-option" key={item}>
              <div className="quality-meta">
                <strong>{item[0].toUpperCase() + item.slice(1)}</strong>
                <span>{item === 'low' ? 'Low power' : item === 'medium' ? 'Balanced' : item === 'high' ? 'Smooth' : 'Ultra sharp'}</span>
              </div>
              <button
                className={`segment ${quality === item ? 'active' : ''}`}
                onClick={() => onQualityChange(item)}
              >
                {quality === item ? 'Selected' : 'Apply'}
              </button>
            </div>
          ))}
        </div>

        <div className="toggle-row">
          <span>FPS Counter</span>
          <button className="icon-button" onClick={onToggleFps}>{showFps ? 'On' : 'Off'}</button>
        </div>

        <div className="toggle-row">
          <span>Auto Quality</span>
          <button className="icon-button" onClick={onToggleAutoQuality}>{autoQuality ? 'On' : 'Off'}</button>
        </div>

        <div className="toggle-row">
          <span>Fullscreen</span>
          <button className="icon-button" onClick={onToggleFullscreen}>{fullscreen ? 'Exit' : 'Enter'}</button>
        </div>

        <div className="toggle-row">
          <span>HUD Button Scale</span>
          <input
            type="range"
            min="0.8"
            max="1.4"
            step="0.05"
            value={buttonScale}
            onChange={(e) => onButtonScaleChange(Number(e.target.value))}
          />
        </div>

        <div className="toggle-row">
          <span>H offset</span>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={buttonOffset.x}
            onChange={(e) => onButtonOffsetChange({ ...buttonOffset, x: Number(e.target.value) })}
          />
        </div>

        <div className="toggle-row">
          <span>V offset</span>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={buttonOffset.y}
            onChange={(e) => onButtonOffsetChange({ ...buttonOffset, y: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
