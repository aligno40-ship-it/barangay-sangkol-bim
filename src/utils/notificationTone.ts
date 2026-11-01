export type NotificationSound = 'bell' | 'chime' | 'ding' | 'alert' | 'none';

export const NOTIFICATION_SOUND_KEY = 'notificationSound';

let isUnlocked = false;
let pendingSound: NotificationSound | null = null;

export function getSavedNotificationSound(): NotificationSound {
  if (typeof window === 'undefined') return 'bell';
  const value = window.localStorage.getItem(NOTIFICATION_SOUND_KEY);
  return value === 'bell' || value === 'chime' || value === 'ding' || value === 'alert' || value === 'none'
    ? value
    : 'bell';
}

export function saveNotificationSound(choice: NotificationSound): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATION_SOUND_KEY, choice);
}

export function unlockNotificationSound(): void {
  if (typeof window === 'undefined') return;
  isUnlocked = true;

  const unlockAudio = new Audio('/sounds/bell.mp3');
  unlockAudio.muted = true;
  void unlockAudio.play().then(() => {
    unlockAudio.pause();
    unlockAudio.currentTime = 0;
    if (pendingSound) {
      const choice = pendingSound;
      pendingSound = null;
      playNotificationSound(choice);
    }
  }).catch(() => {
    isUnlocked = false;
  });
}

export function previewNotificationSound(choice: NotificationSound): void {
  if (choice === 'none') return;
  playNotificationSound(choice, true);
}

export function playNotificationSound(choice?: NotificationSound, allowPending = false): void {
  if (typeof window === 'undefined') return;
  const selected = choice || getSavedNotificationSound();
  if (selected === 'none') return;

  const audio = new Audio(`/sounds/${selected}.mp3`);
  audio.volume = 0.7;
  void audio.play().catch(() => {
    if (allowPending || !isUnlocked) {
      pendingSound = selected;
    }
  });
}

export function unlockNotificationTone(): void {
  unlockNotificationSound();
}

export function playNotificationTone(): void {
  playNotificationSound();
}
