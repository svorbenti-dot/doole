// Erzeugt einen kurzen akustischen Signalton per Web Audio API, ohne
// dass eine Audio-Datei mitgeliefert/gecacht werden muss.
let sharedContext = null;

export function playBeep(frequency = 880, durationMs = 180) {
  try {
    if (!sharedContext) {
      sharedContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = sharedContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    // Audio nicht verfügbar (z.B. Autoplay-Policy) - Training läuft trotzdem weiter.
  }

  // Zusätzlich vibrieren, falls verfügbar - hilft z.B. bei stummgeschaltetem Handy.
  if (navigator.vibrate) {
    navigator.vibrate(150);
  }
}
