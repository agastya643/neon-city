export function MenuScreen({ onNewGame, onContinue, onSettings, onCredits }) {
  return (
    <div className="ui-panel">
      <div className="menu-card">
        <div className="brand">
          <h1>NEON CITY</h1>
          <p>Cyber Drift</p>
        </div>

        <div className="menu-actions">
          <button className="neon-button primary" onClick={onNewGame}>New Game</button>
          <button className="neon-button" onClick={onContinue}>Continue</button>
          <button className="neon-button" onClick={onSettings}>Settings</button>
          <button className="neon-button" onClick={onCredits}>Credits</button>
        </div>
      </div>
    </div>
  );
}
