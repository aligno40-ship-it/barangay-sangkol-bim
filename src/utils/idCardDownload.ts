import QRCode from 'qrcode';
import { Resident, BarangaySettings } from '../types';
import { getFormalResidentPhotoUrl, generateFormalIdPhotoSvg } from './imageUtils';
import { ID_THEMES, IdColorCategory, detectIdColorCategory } from './idCardThemes';

export interface IDCardDownloadOptions {
  side?: 'front' | 'back' | 'both';
  photoUrl?: string | null;
  colorCategory?: IdColorCategory;
}

/**
 * Generates and triggers download of a crisp, high-resolution (300 DPI CR80 ratio)
 * Digital Barangay Resident Identification Card with Functional Color-Coding.
 */
export async function downloadDigitalIdCard(
  resident: Partial<Resident> & { id: string; firstName: string; lastName: string },
  settings: Partial<BarangaySettings>,
  options: IDCardDownloadOptions = {}
): Promise<void> {
  const { side = 'front', photoUrl, colorCategory } = options;
  const resolvedCategory = colorCategory || detectIdColorCategory(resident);
  const theme = ID_THEMES[resolvedCategory];

  if (side === 'front') {
    const canvas = await generateFrontCanvas(resident, settings, photoUrl, resolvedCategory);
    triggerDownload(
      canvas,
      `Barangay_Digital_ID_FRONT_${theme.shortName.replace(/[^a-zA-Z0-9]/g, '_')}_${resident.lastName}_${resident.id}.png`
    );
  } else if (side === 'back') {
    const canvas = await generateBackCanvas(resident, settings, resolvedCategory);
    triggerDownload(
      canvas,
      `Barangay_Digital_ID_BACK_${theme.shortName.replace(/[^a-zA-Z0-9]/g, '_')}_${resident.lastName}_${resident.id}.png`
    );
  } else {
    const canvas = await generateCombinedCanvas(resident, settings, photoUrl, resolvedCategory);
    triggerDownload(
      canvas,
      `Barangay_Digital_ID_COMPLETE_${theme.shortName.replace(/[^a-zA-Z0-9]/g, '_')}_${resident.lastName}_${resident.id}.png`
    );
  }
}

/**
 * Canvas generation for ID Card Front with Functional Color-Coding
 */
async function generateFrontCanvas(
  resident: Partial<Resident> & { id: string; firstName: string; lastName: string },
  settings: Partial<BarangaySettings>,
  photoUrl?: string | null,
  colorCategory?: IdColorCategory
): Promise<HTMLCanvasElement> {
  const resolvedCategory = colorCategory || detectIdColorCategory(resident);
  const theme = ID_THEMES[resolvedCategory];
  const cv = theme.canvas;

  const width = 1012;
  const height = 638;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context');

  // Background Gradient with Light Government Aesthetic
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, cv.gradStart);
  grad.addColorStop(0.5, cv.gradMid);
  grad.addColorStop(1, cv.gradEnd);
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, width, height, 32);
  ctx.fill();

  // Subtle Guilloche / Security Wave Lines (Subtle Light Waves)
  ctx.save();
  ctx.strokeStyle = cv.securityLine;
  ctx.lineWidth = 1.5;
  for (let i = -100; i < width + 100; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i + 80, height * 0.33, i - 80, height * 0.66, i + 40, height);
    ctx.stroke();
  }
  ctx.restore();

  // Top Functional Color Bar / Security Strip
  ctx.fillStyle = cv.badgeBg;
  roundRect(ctx, 16, 12, width - 32, 6, 3);
  ctx.fill();

  // Outer Accent Border
  ctx.strokeStyle = cv.outerBorder;
  ctx.lineWidth = 4.5;
  roundRect(ctx, 10, 10, width - 20, height - 20, 26);
  ctx.stroke();

  // Inner Subtle Hairline
  ctx.strokeStyle = cv.innerBorder;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 16, 16, width - 32, height - 32, 22);
  ctx.stroke();

  // Top Header Banner (Rich Government Banner)
  ctx.fillStyle = cv.headerBanner;
  roundRect(ctx, 20, 22, width - 40, 126, 16);
  ctx.fill();
  ctx.fillStyle = cv.headerAccentLine;
  ctx.fillRect(20, 146, width - 40, 3);

  // Header Texts
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('REPUBLIC OF THE PHILIPPINES', width / 2, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(
    `Province of ${settings.province || 'Zamboanga del Norte'} • ${settings.municipality || 'Dipolog City'}`.toUpperCase(),
    width / 2,
    72
  );

  ctx.fillStyle = cv.headerBarangayText;
  ctx.font = '900 28px sans-serif';
  ctx.fillText(
    (settings.barangayName || 'BARANGAY SANGKOL').toUpperCase(),
    width / 2,
    104
  );

  // Subtitle / ID Category Name
  ctx.fillStyle = cv.headerSubtextColor || '#ffffff';
  ctx.font = 'bold 12.5px sans-serif';
  ctx.fillText(theme.headerSubtext, width / 2, 125);

  // Category Classification Pill Banner across top header
  const pillW = 480;
  const pillH = 24;
  const pillX = width / 2 - pillW / 2;
  const pillY = 135;
  ctx.fillStyle = cv.badgeBg;
  roundRect(ctx, pillX, pillY, pillW, pillH, 12);
  ctx.fill();
  ctx.strokeStyle = cv.badgeBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = cv.badgeTextColor;
  ctx.font = '900 11px sans-serif';
  ctx.fillText(`${theme.badgeEmoji} ${theme.badgeLabel}`, width / 2, pillY + 16);

  // Photo Section (Left) - Standard Philippine 2x2 Official ID Photograph Frame
  const photoX = 50;
  const photoY = 175;
  const photoW = 220;
  const photoH = 275;

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, photoX, photoY, photoW, photoH, 16);
  ctx.fill();
  ctx.strokeStyle = cv.photoBorder;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Resolve best photo candidate
  const effectivePhotoUrl = photoUrl || getFormalResidentPhotoUrl(resident);

  // Attempt to render photo image or guaranteed formal portrait SVG
  let photoRendered = false;
  if (effectivePhotoUrl) {
    try {
      const img = await loadImage(effectivePhotoUrl);
      ctx.save();
      roundRect(ctx, photoX + 4, photoY + 4, photoW - 8, photoH - 8, 12);
      ctx.clip();
      ctx.drawImage(img, photoX + 4, photoY + 4, photoW - 8, photoH - 8);
      ctx.restore();
      photoRendered = true;
    } catch {
      photoRendered = false;
    }
  }

  // If external photo was blocked or failed, load crisp embedded formal SVG portrait
  if (!photoRendered) {
    try {
      const fallbackSvg = generateFormalIdPhotoSvg({
        gender: resident.sex || 'Male',
        name: `${resident.firstName} ${resident.lastName}`,
        idNumber: resident.id,
        backgroundTheme: resolvedCategory === 'red_official' ? 'crimson' : resolvedCategory === 'green_tanod' ? 'forest' : resolvedCategory === 'yellow_youth' ? 'studio_gold' : 'studio_blue',
      });
      const svgImg = await loadImage(fallbackSvg);
      ctx.save();
      roundRect(ctx, photoX + 4, photoY + 4, photoW - 8, photoH - 8, 12);
      ctx.clip();
      ctx.drawImage(svgImg, photoX + 4, photoY + 4, photoW - 8, photoH - 8);
      ctx.restore();
      photoRendered = true;
    } catch {
      photoRendered = false;
    }
  }

  // Label banner on bottom of photo box
  ctx.fillStyle = cv.photoLabelBg;
  roundRect(ctx, photoX + 8, photoY + photoH - 28, photoW - 16, 22, 6);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = cv.photoLabelText;
  ctx.font = 'bold 10px monospace';
  ctx.fillText('2x2 CITIZEN PHOTO', photoX + photoW / 2, photoY + photoH - 13);

  // Resident Information (Right) - High Contrast Dark Slate on Light Background
  const infoX = 305;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Full Name
  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('FULL NAME / PANGALAN:', infoX, 192);

  ctx.fillStyle = cv.nameText;
  ctx.font = '900 28px sans-serif';
  const fullName = `${resident.lastName}, ${resident.firstName} ${
    resident.middleName ? `${resident.middleName[0]}.` : ''
  } ${resident.suffix || ''}`.toUpperCase();
  ctx.fillText(fullName, infoX, 226);

  // Address
  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('RESIDENCE ADDRESS / PUROK:', infoX, 260);

  ctx.fillStyle = cv.fieldValueHighlight;
  ctx.font = 'bold 20px sans-serif';
  const addressText = `${resident.streetAddress || ''}, ${resident.purok || 'Purok Pinya'}`;
  ctx.fillText(addressText, infoX, 286);

  // Grid of Attributes (Birthdate, Civil Status, Blood Type, Sex)
  const col1X = infoX;
  const col2X = infoX + 350;

  // DOB
  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('DATE OF BIRTH:', col1X, 324);
  ctx.fillStyle = cv.fieldValueText;
  ctx.font = 'bold 18px monospace';
  ctx.fillText(resident.birthDate || 'N/A', col1X, 346);

  // SEX
  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('SEX / GENDER:', col2X, 324);
  ctx.fillStyle = cv.fieldValueText;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText((resident.sex || 'N/A').toUpperCase(), col2X, 346);

  // CIVIL STATUS
  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('CIVIL STATUS:', col1X, 384);
  ctx.fillStyle = cv.fieldValueText;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText((resident.civilStatus || 'Single').toUpperCase(), col1X, 406);

  // BLOOD TYPE / SPECIAL CLASSIFICATION
  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('BLOOD TYPE:', col2X, 384);
  ctx.fillStyle = '#b91c1c'; // rich red
  ctx.font = '900 20px sans-serif';
  ctx.fillText(resident.bloodType || 'O+', col2X, 406);

  // Sectoral / Designation Sub-badge if applicable
  if (resident.isSeniorCitizen || resident.isPWD || resident.is4PsBeneficiary || resident.isSoloParent) {
    const tagText = resident.isSeniorCitizen ? 'SENIOR CITIZEN' : resident.isPWD ? 'PWD' : resident.is4PsBeneficiary ? '4Ps' : 'SOLO PARENT';
    ctx.fillStyle = '#fef3c7';
    roundRect(ctx, col2X + 60, 388, 120, 22, 6);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tagText, col2X + 120, 404);
    ctx.textAlign = 'left';
  }

  // Bottom Card Bar
  ctx.fillStyle = cv.bottomBarBg;
  roundRect(ctx, 20, 480, width - 40, 138, 16);
  ctx.fill();
  ctx.strokeStyle = cv.bottomBarLine;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ID Number Tag & Category
  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 13px monospace';
  ctx.fillText('RESIDENT ID NO:', 50, 520);
  ctx.fillStyle = cv.idTagColor;
  ctx.font = '900 24px monospace';
  ctx.fillText(resident.id, 50, 555);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Official Category: ${theme.shortName}`, 50, 585);

  // Signatory (Punong Barangay)
  ctx.textAlign = 'center';
  const sigX = width - 220;
  const pbName = (
    settings.punongBarangay ||
    'HON. EDUARDO S. DELA CRUZ'
  ).toUpperCase();

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sigX - 140, 560);
  ctx.lineTo(sigX + 140, 560);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 16px sans-serif';
  ctx.fillText(pbName, sigX, 580);

  ctx.fillStyle = cv.fieldValueHighlight;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Punong Barangay', sigX, 598);

  return canvas;
}

/**
 * Canvas generation for ID Card Back with Functional Color-Coding (Clean Light Design)
 */
async function generateBackCanvas(
  resident: Partial<Resident> & { id: string; firstName: string; lastName: string },
  settings: Partial<BarangaySettings>,
  colorCategory?: IdColorCategory
): Promise<HTMLCanvasElement> {
  const resolvedCategory = colorCategory || detectIdColorCategory(resident);
  const theme = ID_THEMES[resolvedCategory];
  const cv = theme.canvas;

  const width = 1012;
  const height = 638;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context');

  // Clean White / Light background
  ctx.fillStyle = cv.backCardBg || '#ffffff';
  roundRect(ctx, 0, 0, width, height, 32);
  ctx.fill();

  // Subtle Guilloche / Security Wave Lines (Subtle Light Waves)
  ctx.save();
  ctx.strokeStyle = cv.securityLine;
  ctx.lineWidth = 1.5;
  for (let i = -100; i < width + 100; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i + 80, height * 0.33, i - 80, height * 0.66, i + 40, height);
    ctx.stroke();
  }
  ctx.restore();

  // Border
  ctx.strokeStyle = cv.outerBorder;
  ctx.lineWidth = 4.5;
  roundRect(ctx, 10, 10, width - 20, height - 20, 26);
  ctx.stroke();

  // Top Title Bar with Category Color Accent
  ctx.fillStyle = cv.backHeaderBg;
  roundRect(ctx, 20, 20, width - 40, 60, 12);
  ctx.fill();
  ctx.fillStyle = cv.backHeaderAccent;
  ctx.fillRect(20, 78, width - 40, 3);

  ctx.textAlign = 'center';
  ctx.fillStyle = cv.backTitleColor;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`${theme.badgeEmoji} EMERGENCY CONTACT & ${theme.shortName.toUpperCase()} VERIFICATION`, width / 2, 55);

  // Terms & Conditions Block (Clean, readable text)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px sans-serif';
  const termsY = 110;
  ctx.fillText('TERMS & CONDITIONS:', 50, termsY);
  ctx.fillStyle = cv.backTermsText || '#334155';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    `• This card certifies that the bearer is a bonafide registered cardholder under the ${theme.name} sector of ${
      settings.barangayName || 'Barangay Sangkol'
    }.`,
    50,
    termsY + 24
  );
  ctx.fillText(
    '• Valid for official barangay transactions, checkpoint verifications, local clearances, and civic verification.',
    50,
    termsY + 46
  );
  ctx.fillText(
    `• If found, please return to ${
      settings.barangayName || 'Barangay Sangkol'
    } Hall or call ${settings.contactNumber || '0917-888-7264'}.`,
    50,
    termsY + 68
  );

  // Separator Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 205);
  ctx.lineTo(width - 50, 205);
  ctx.stroke();

  // Emergency Details & Verification Section (Clean Accented Container)
  const emergY = 225;
  const emergBoxW = width - 380;
  const emergBoxH = 175;
  
  ctx.fillStyle = cv.backEmergencyBoxBg || '#f8fafc';
  roundRect(ctx, 45, emergY, emergBoxW, emergBoxH, 16);
  ctx.fill();
  ctx.strokeStyle = cv.backEmergencyBoxBorder || '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = cv.fieldValueHighlight;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('IN CASE OF EMERGENCY:', 65, emergY + 30);

  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 12.5px sans-serif';
  ctx.fillText('CONTACT PERSON:', 65, emergY + 58);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 17px sans-serif';
  ctx.fillText(
    resident.emergencyContactName || 'Barangay Health & Emergency Desk',
    65,
    emergY + 80
  );

  ctx.fillStyle = cv.fieldLabelText;
  ctx.font = 'bold 12.5px sans-serif';
  ctx.fillText('EMERGENCY HOTLINE:', 65, emergY + 110);
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 19px monospace';
  ctx.fillText(
    resident.emergencyContactNumber || settings.contactNumber || '0917-888-7264',
    65,
    emergY + 132
  );

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText(
    `Barangay Hall 24/7 Hotline: ${settings.contactNumber || '(062) 991-8842'}`,
    65,
    emergY + 158
  );

  // Generate QR Code on Right
  const qrX = width - 280;
  const qrY = 225;
  const qrSize = 180;

  try {
    const qrDataUrl = await QRCode.toDataURL(
      `BARANGAY-ID-VERIFY:${resident.id}|${resident.lastName},${resident.firstName}|CATEGORY:${theme.shortName}|PUROK:${resident.purok}`,
      { margin: 1, width: qrSize, color: { dark: '#0f172a', light: '#ffffff' } }
    );
    const qrImg = await loadImage(qrDataUrl);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SCAN TO AUTHENTICATE', qrX + qrSize / 2, qrY + qrSize + 26);
  } catch (err) {
    console.error('Failed to draw QR on canvas:', err);
  }

  // Bottom Signature of Resident
  const signY = 530;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, signY);
  ctx.lineTo(350, signY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText("BEARER'S SIGNATURE / THUMBMARK", 200, signY + 22);

  // Validity Date on bottom right
  ctx.textAlign = 'right';
  ctx.fillStyle = cv.fieldValueHighlight;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('VALIDITY: DECEMBER 31, 2026', width - 50, signY + 22);

  return canvas;
}

/**
 * Generate Combined Canvas (Both Front and Back on a clean white printable sheet)
 */
async function generateCombinedCanvas(
  resident: Partial<Resident> & { id: string; firstName: string; lastName: string },
  settings: Partial<BarangaySettings>,
  photoUrl?: string | null,
  colorCategory?: IdColorCategory
): Promise<HTMLCanvasElement> {
  const resolvedCategory = colorCategory || detectIdColorCategory(resident);
  const theme = ID_THEMES[resolvedCategory];

  const frontCanvas = await generateFrontCanvas(resident, settings, photoUrl, resolvedCategory);
  const backCanvas = await generateBackCanvas(resident, settings, resolvedCategory);

  const cardW = 1012;
  const cardH = 638;
  const padding = 60;
  const totalW = cardW + padding * 2;
  const totalH = cardH * 2 + padding * 3 + 120;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas context');

  // Sheet Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  // Sheet Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 30px sans-serif';
  ctx.fillText(
    `${(settings.barangayName || 'BARANGAY SANGKOL').toUpperCase()} - DIGITAL ID CARD SHEET`,
    totalW / 2,
    65
  );

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(
    `Official Color-Coded Credential: ${theme.name} • Bearer: ${resident.lastName}, ${resident.firstName} (${resident.id})`,
    totalW / 2,
    95
  );

  // Draw Front Card
  ctx.drawImage(frontCanvas, padding, 130);

  // Draw Back Card
  ctx.drawImage(backCanvas, padding, 130 + cardH + padding);

  // Sheet Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    `Generated on ${new Date().toLocaleDateString()} • Philippine Standard Barangay Color-Coded Identification System • Cut along borders for wallet size.`,
    totalW / 2,
    totalH - 30
  );

  return canvas;
}

/**
 * Helper to download canvas to user machine
 */
function triggerDownload(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Helper to load Image object
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load asset image: ${src.slice(0, 40)}`));
    img.src = src;
  });
}

/**
 * Helper to draw rounded rectangle on Canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

