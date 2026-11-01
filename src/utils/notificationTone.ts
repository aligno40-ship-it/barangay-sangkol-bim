let audioContext: AudioContext | null = null;
let isUnlocked = false;

export function unlockNotificationTone(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    isUnlocked = true;
  } catch {
    isUnlocked = false;
  }
}

export function playNotificationTone(): void {
  if (!isUnlocked || typeof window === 'undefined') return;

  try {
    if (!audioContext) {
      unlockNotificationTone();
    }
    if (!audioContext || audioContext.state !== 'running') return;

    const now = audioContext.currentTime;
    const notes = [
      { frequency: 880, start: now, duration: 0.09 },
      { frequency: 1175, start: now + 0.11, duration: 0.12 },
    ];

    notes.forEach(({ frequency, start, duration }) => {
      const oscillator = audioContext!.createOscillator();
      const gain = audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gain);
      gain.connect(audioContext!.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  } catch {
    // Browsers may block audio until the user interacts with the page.
  }
}
