export function buildInputState() {
  return {
    move: { x: 0, y: 0 },
    camera: { yaw: 0, pitch: 0 },
    jump: false,
    sprint: false,
    crouch: false,
    action: false,
  };
}

export function createTouchZones(root, input, scale = 1, offset = { x: 0, y: 0 }) {
  const zones = [];

  const bindZone = (id, onMove, onDown, onUp) => {
    const el = document.getElementById(id);
    if (!el) return;

    const handleDown = (event) => {
      event.preventDefault();
      onDown?.(event);
    };
    const handleMove = (event) => {
      event.preventDefault();
      onMove?.(event);
    };
    const handleUp = (event) => {
      event.preventDefault();
      onUp?.(event);
    };

    el.addEventListener('pointerdown', handleDown, { passive: false });
    el.addEventListener('pointermove', handleMove, { passive: false });
    el.addEventListener('pointerup', handleUp, { passive: false });
    el.addEventListener('pointercancel', handleUp, { passive: false });
    zones.push({
      destroy() {
        el.removeEventListener('pointerdown', handleDown);
        el.removeEventListener('pointermove', handleMove);
        el.removeEventListener('pointerup', handleUp);
        el.removeEventListener('pointercancel', handleUp);
      },
    });
  };

  bindZone('joystick-zone', (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / (rect.width * 0.42);
    const dy = (event.clientY - cy) / (rect.height * 0.42);
    input.move.x = Math.max(-1, Math.min(1, dx));
    input.move.y = Math.max(-1, Math.min(1, dy));
  }, () => {
    input.move.x = 0;
    input.move.y = 0;
  }, () => {
    input.move.x = 0;
    input.move.y = 0;
  });

  bindZone('camera-zone', (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
    const y = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
    input.camera.yaw += x * 0.08;
    input.camera.pitch = Math.max(-1, Math.min(1, y));
  });

  return zones;
}
