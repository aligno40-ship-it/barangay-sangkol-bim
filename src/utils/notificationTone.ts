export const NOTIFICATION_SOUND_OPTIONS = [
  { value: 'bell', label: 'Bell' },
  { value: 'chime', label: 'Chime' },
  { value: 'ding', label: 'Ding' },
  { value: 'alert', label: 'Alert' },
  { value: 'soft-chime', label: 'Soft Chime' },
  { value: 'double-bell', label: 'Double Bell' },
  { value: 'digital', label: 'Digital' },
  { value: 'marimba', label: 'Marimba' },
  { value: 'none', label: 'None' },
] as const;

export type NotificationSound = (typeof NOTIFICATION_SOUND_OPTIONS)[number]['value'];

export const NOTIFICATION_SOUND_KEY = 'notificationSound';

let isUnlocked = false;
let pendingSound: NotificationSound | null = null;

export function getSavedNotificationSound(): NotificationSound {
  if (typeof window === 'undefined') return 'bell';
  const value = window.localStorage.getItem(NOTIFICATION_SOUND_KEY);
  return NOTIFICATION_SOUND_OPTIONS.find((option) => option.value === value)?.value ?? 'bell';
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

  const audioExtension = ['soft-chime', 'double-bell', 'digital', 'marimba'].includes(selected) ? 'wav' : 'mp3';
  const audio = new Audio(`/sounds/${selected}.${audioExtension}`);
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
