export function createFixedLoop({ step = 1 / 60, onFixed, onRender }) {
  let accumulator = 0;
  let lastFrame = 0;
  let rafId = 0;
  let running = false;

  const tick = (timestamp) => {
    if (!running) return;
    if (!lastFrame) lastFrame = timestamp;
    const delta = (timestamp - lastFrame) / 1000;
    lastFrame = timestamp;
    accumulator += delta;

    while (accumulator >= step) {
      onFixed?.(step);
      accumulator -= step;
    }

    onRender?.({ delta, accumulator, step });
    rafId = requestAnimationFrame(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      lastFrame = 0;
      accumulator = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
  };
}
