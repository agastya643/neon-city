export function LoadingScreen({ progress, tip }) {
  return (
    <div className="ui-panel">
      <div className="loading-card">
        <div className="brand">
          <h1>NEON CITY</h1>
          <p>Loading</p>
        </div>

        <div className="loading-progress">
          <div className="loading-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="tip-box">{tip}</div>
      </div>
    </div>
  );
}
