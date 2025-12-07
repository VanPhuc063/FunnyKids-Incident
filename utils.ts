// Simple beep sound using Web Audio API to avoid external file dependencies
export const playAlertSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.value = 880; // A5
    
    // Alert pattern: Beep-Beep-Beep
    const now = ctx.currentTime;
    
    gain.gain.setValueAtTime(0.5, now);
    osc.start(now);
    
    // Envelope for 3 pulses
    gain.gain.setValueAtTime(0.5, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    gain.gain.setValueAtTime(0.5, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.stop(now + 1.0);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};