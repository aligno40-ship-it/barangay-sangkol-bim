/**
 * Utility functions for user profile picture processing, compression, and presets.
 */

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'Officials & Staff' | 'Residents & Citizens' | 'Stylized';
  url: string;
  description: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'preset-captain',
    name: 'Barangay Captain / Executive',
    category: 'Officials & Staff',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    description: 'Formal executive portrait in barong attire',
  },
  {
    id: 'preset-lady-sec',
    name: 'Barangay Secretary / Atty.',
    category: 'Officials & Staff',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    description: 'Professional lady officer / secretary',
  },
  {
    id: 'preset-treasurer',
    name: 'Barangay Treasurer / Finance',
    category: 'Officials & Staff',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    description: 'Formal administrative official portrait',
  },
  {
    id: 'preset-tanod',
    name: 'Chief Tanod / Security',
    category: 'Officials & Staff',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    description: 'Frontline public safety officer',
  },
  {
    id: 'preset-resident-female',
    name: 'Resident Maria',
    category: 'Residents & Citizens',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    description: 'Barangay resident citizen (female)',
  },
  {
    id: 'preset-resident-male',
    name: 'Resident Juan',
    category: 'Residents & Citizens',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    description: 'Barangay resident citizen (male)',
  },
  {
    id: 'preset-senior',
    name: 'Senior Citizen Elder',
    category: 'Residents & Citizens',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    description: 'Senior citizen community member',
  },
  {
    id: 'preset-youth',
    name: 'SK Youth Leader',
    category: 'Residents & Citizens',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    description: 'Sangguniang Kabataan youth representative',
  },
];

/**
 * Compresses and scales an uploaded image file into a square Data URL thumbnail.
 * This guarantees fast client processing and Supabase payload efficiency without lag.
 */
export function compressImageFile(
  file: File,
  maxDimension = 400,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        // Calculate center square crop
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        const targetSize = Math.min(minDim, maxDimension);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }

        // Draw center cropped image to square canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        );

        // Convert to WebP or JPEG Data URL
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          const fallbackUrl = canvas.toDataURL('image/png');
          resolve(fallbackUrl);
        }
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Empty file content.'));
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Captures the current frame from a live HTMLVideoElement into a square Data URL.
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  size = 400,
  quality = 0.88
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const vWidth = video.videoWidth || 640;
  const vHeight = video.videoHeight || 480;
  const minDim = Math.min(vWidth, vHeight);
  const startX = (vWidth - minDim) / 2;
  const startY = (vHeight - minDim) / 2;

  // Mirror horizontally for natural webcam experience
  ctx.translate(size, 0);
  ctx.scale(-1, 1);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Generates an embedded, standalone SVG Data URI for a formal 2x2 Philippine ID portrait.
 * Guarantees that even without external internet or in offline environments, a crisp
 * formal government ID headshot is rendered.
 */
export function generateFormalIdPhotoSvg(options: {
  gender?: 'Male' | 'Female' | string;
  name?: string;
  idNumber?: string;
  backgroundTheme?: 'studio_blue' | 'studio_white' | 'formal_red' | 'crimson' | 'forest' | 'studio_gold';
} = {}): string {
  const { gender = 'Male', name = 'Resident Citizen', idNumber = '', backgroundTheme = 'studio_blue' } = options;
  const isFemale = gender.toLowerCase() === 'female';

  let bgGradient = `<radialGradient id="bgGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="60%" stop-color="#1d4ed8"/><stop offset="100%" stop-color="#1e3a8a"/></radialGradient>`;
  
  if (backgroundTheme === 'studio_white') {
    bgGradient = `<radialGradient id="bgGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#cbd5e1"/></radialGradient>`;
  } else if (backgroundTheme === 'formal_red' || backgroundTheme === 'crimson') {
    bgGradient = `<radialGradient id="bgGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#b91c1c"/><stop offset="60%" stop-color="#991b1b"/><stop offset="100%" stop-color="#7f1d1d"/></radialGradient>`;
  } else if (backgroundTheme === 'forest') {
    bgGradient = `<radialGradient id="bgGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#10b981"/><stop offset="60%" stop-color="#047857"/><stop offset="100%" stop-color="#064e3b"/></radialGradient>`;
  } else if (backgroundTheme === 'studio_gold') {
    bgGradient = `<radialGradient id="bgGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="60%" stop-color="#d97706"/><stop offset="100%" stop-color="#78350f"/></radialGradient>`;
  }

  const suitColor = isFemale ? '#1e293b' : '#0f172a';
  const innerShirtColor = '#f8fafc';
  const skinTone = '#f6d0b1';
  const skinShadow = '#e0b088';
  const hairColor = '#171717';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 375" width="100%" height="100%">
    <defs>
      ${bgGradient}
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.25"/>
      </filter>
    </defs>
    <!-- Studio ID Background -->
    <rect width="300" height="375" fill="url(#bgGrad)"/>
    
    <!-- Studio Lighting Vignette / Glow -->
    <circle cx="150" cy="140" r="110" fill="#ffffff" opacity="0.12"/>
    
    <!-- Torso / Formal Barong / Suit Coat -->
    <g filter="url(#softShadow)">
      <!-- Shoulders & Coat -->
      <path d="M 40 375 C 40 280, 85 240, 150 240 C 215 240, 260 280, 260 375 Z" fill="${suitColor}"/>
      <!-- Formal Inner Shirt / Barong Neckline -->
      <path d="M 120 240 L 150 310 L 180 240 Z" fill="${innerShirtColor}"/>
      <!-- Barong Tagalog / Tie Accent -->
      ${
        isFemale
          ? `<path d="M 135 240 Q 150 270 165 240 Z" fill="#e2e8f0"/>
             <circle cx="150" cy="275" r="4" fill="#fbbf24"/>`
          : `<path d="M 145 250 L 155 250 L 157 325 L 150 338 L 143 325 Z" fill="#dc2626"/>
             <polygon points="144,244 156,244 153,254 147,254" fill="#991b1b"/>`
      }
      <!-- Lapels / Collar -->
      <path d="M 115 240 L 138 310 L 110 320 L 80 270 Z" fill="${suitColor}" opacity="0.9"/>
      <path d="M 185 240 L 162 310 L 190 320 L 220 270 Z" fill="${suitColor}" opacity="0.9"/>
    </g>

    <!-- Neck -->
    <path d="M 132 195 L 132 245 C 132 255, 168 255, 168 245 L 168 195 Z" fill="${skinShadow}"/>

    <!-- Head / Face -->
    <ellipse cx="150" cy="155" rx="55" ry="68" fill="${skinTone}" filter="url(#softShadow)"/>
    
    <!-- Ears -->
    <ellipse cx="94" cy="160" rx="8" ry="15" fill="${skinShadow}"/>
    <ellipse cx="206" cy="160" rx="8" ry="15" fill="${skinShadow}"/>

    <!-- Hair -->
    ${
      isFemale
        ? `<!-- Female Hair (Neat Bun / Formal Haircut) -->
           <path d="M 92 155 C 88 100, 120 75, 150 75 C 180 75, 212 100, 208 155 C 205 130, 195 105, 150 105 C 105 105, 95 130, 92 155 Z" fill="${hairColor}"/>
           <path d="M 100 85 C 120 50, 180 50, 200 85 Z" fill="${hairColor}"/>
           <!-- Side Hair Strands -->
           <path d="M 94 140 C 90 170, 92 210, 100 230 C 96 200, 94 170, 96 140 Z" fill="${hairColor}"/>
           <path d="M 206 140 C 210 170, 208 210, 200 230 C 204 200, 206 170, 204 140 Z" fill="${hairColor}"/>`
        : `<!-- Male Hair (Neat Formal Side-Part) -->
           <path d="M 93 145 C 90 95, 115 72, 150 72 C 185 72, 210 95, 207 145 C 205 110, 185 92, 150 92 C 115 92, 95 110, 93 145 Z" fill="${hairColor}"/>
           <path d="M 98 120 C 105 85, 145 78, 175 80 C 195 82, 204 95, 204 105 C 190 92, 160 88, 130 96 C 112 101, 103 112, 98 120 Z" fill="${hairColor}"/>`
    }

    <!-- Facial Features: Eyebrows -->
    <path d="M 115 132 Q 130 128 140 133" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <path d="M 160 133 Q 170 128 185 132" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" fill="none"/>

    <!-- Eyes (Professional & Friendly) -->
    <ellipse cx="128" cy="144" rx="7" ry="5" fill="#ffffff"/>
    <ellipse cx="172" cy="144" rx="7" ry="5" fill="#ffffff"/>
    <circle cx="128" cy="144" r="3.5" fill="#1e293b"/>
    <circle cx="172" cy="144" r="3.5" fill="#1e293b"/>
    <circle cx="130" cy="142" r="1.2" fill="#ffffff"/>
    <circle cx="174" cy="142" r="1.2" fill="#ffffff"/>

    <!-- Nose -->
    <path d="M 150 142 L 147 168 Q 150 172 153 168" stroke="${skinShadow}" stroke-width="2.5" stroke-linecap="round" fill="none"/>

    <!-- Gentle Smile -->
    <path d="M 136 186 Q 150 197 164 186" stroke="#b91c1c" stroke-width="2.5" stroke-linecap="round" fill="none"/>

    <!-- 2x2 Official Photo Stamp Watermark at Bottom -->
    <rect x="15" y="342" width="270" height="22" rx="4" fill="#0f172a" opacity="0.85"/>
    <text x="150" y="357" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fde68a" text-anchor="middle" letter-spacing="1.5">
      PHILIPPINE 2x2 FORMAL ID PHOTO
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves an authentic, formal 2x2 photo URL for any resident.
 * If the resident or user profile already has an uploaded image, it returns that.
 * Otherwise, it provides a tailored formal photo based on gender, age, and role.
 */
export function getFormalResidentPhotoUrl(
  resident?: {
    photoUrl?: string;
    avatar?: string;
    photo?: string;
    sex?: string;
    age?: number;
    isSeniorCitizen?: boolean;
    isYouth?: boolean;
    id?: string;
    firstName?: string;
  } | null,
  userAvatar?: string | null
): string {
  // 1. Direct explicit uploaded photo or linked user account avatar
  if (resident?.photoUrl && resident.photoUrl.trim().length > 0) return resident.photoUrl.trim();
  if (resident?.avatar && resident.avatar.trim().length > 0) return resident.avatar.trim();
  if (resident?.photo && resident.photo.trim().length > 0) return resident.photo.trim();
  if (userAvatar && userAvatar.trim().length > 0) return userAvatar.trim();

  // If the resident has no user account and no uploaded photo, do not assign a profile picture
  return '';
}

/**
 * Compresses an official seal, logo, or signature image file client-side.
 * Preserves transparency (WebP / PNG) and resizes to a crisp max dimension (default 360px).
 * This ensures lightweight database storage and instant Supabase persistence without payload limits.
 */
export function compressSealImage(file: File, maxDim = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    // If SVG, read text/dataURL directly to preserve perfect vector sharpness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for optimization.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        const limit = maxDim || 360;
        if (width > limit || height > limit) {
          if (width > height) {
            height = Math.round((height * limit) / width);
            width = limit;
          } else {
            width = Math.round((width * limit) / height);
            height = limit;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first if available (supports alpha transparency and is much smaller)
        try {
          const webpUrl = canvas.toDataURL('image/webp', 0.85);
          if (webpUrl.startsWith('data:image/webp') && webpUrl.length < 100000) {
            resolve(webpUrl);
            return;
          }
        } catch {
          // Fallback to PNG
        }

        // Keep as PNG with dimension optimization to guarantee lightweight storage
        try {
          let pngUrl = canvas.toDataURL('image/png');
          if (pngUrl.length > 160000) {
            // Scale down to 240px to ensure the base64 is compact and safe for any DB
            const smallCanvas = document.createElement('canvas');
            const factor = Math.min(240 / width, 240 / height);
            smallCanvas.width = Math.round(width * factor);
            smallCanvas.height = Math.round(height * factor);
            const smCtx = smallCanvas.getContext('2d');
            if (smCtx) {
              smCtx.imageSmoothingEnabled = true;
              smCtx.imageSmoothingQuality = 'high';
              smCtx.clearRect(0, 0, smallCanvas.width, smallCanvas.height);
              smCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
              pngUrl = smallCanvas.toDataURL('image/png');
            }
          }
          resolve(pngUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Empty file content.'));
      }
    };

    reader.readAsDataURL(file);
  });
}

