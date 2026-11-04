export function createAudioEngine() {
  let context = null;
  let gainNode = null;
  let pulseTimer = null;
  let started = false;

  const ensureContext = () => {
    if (context) return context;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
    gainNode = context.createGain();
    gainNode.gain.value = 0.04;
    gainNode.connect(context.destination);
    return context;
  };

  const pulse = () => {
    const audioCtx = ensureContext();
    if (!audioCtx || !gainNode) return;
    const now = audioCtx.currentTime;
    const oscA = audioCtx.createOscillator();
    const oscB = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    oscA.type = 'sawtooth';
    oscB.type = 'triangle';
    oscA.frequency.setValueAtTime(120 + Math.random() * 28, now);
    oscB.frequency.setValueAtTime(60 + Math.random() * 12, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    oscA.connect(g);
    oscB.connect(g);
    g.connect(gainNode);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.19);
    oscB.stop(now + 0.2);
  };

  const start = async () => {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    if (started) return;
    started = true;
    pulseTimer = window.setInterval(() => {
      if (!document.hidden) pulse();
    }, 420);
  };

  const stop = () => {
    if (pulseTimer) {
      clearInterval(pulseTimer);
      pulseTimer = null;
    }
    started = false;
  };

  const setMuted = (muted) => {
    if (!gainNode) return;
    gainNode.gain.value = muted ? 0.0001 : 0.04;
  };

  return { start, stop, setMuted };
}
