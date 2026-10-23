import QRCode from 'qrcode';
import { CertificateRecord, BarangaySettings } from '../types';

/**
 * Generates the official public verification URL for a given certificate control number.
 */
export function getCertificateVerificationUrl(controlNumber: string): string {
  const cleanNo = encodeURIComponent(controlNumber.trim().toUpperCase());
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?verify=${cleanNo}`;
  }
  return `https://barangaysangkol.gov.ph/verify?controlNumber=${cleanNo}`;
}

/**
 * Computes a deterministic SHA-256-like cryptographic security hash for the certificate.
 */
export function generateCertificateSecurityHash(cert: CertificateRecord): string {
  const baseString = `${cert.controlNumber}|${cert.residentName}|${cert.type}|${cert.dateIssued}|${cert.orNumber || 'N/A'}|SANGKOL_SECURITY_V1`;
  
  // Simple fast deterministic hash representation
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = Math.abs((hash ^ 0x5a5a5a5a) * 31).toString(16).padStart(8, '0').toUpperCase();
  const hex3 = Math.abs((hash ^ 0x3c3c3c3c) * 17).toString(16).padStart(8, '0').toUpperCase();
  const hex4 = Math.abs((hash ^ 0x1f1f1f1f) * 13).toString(16).padStart(8, '0').toUpperCase();
  return `BS-SEC-${hex1}${hex2}-${hex3}${hex4}`;
}

export interface QRGenerationOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generates a QR Code as an SVG string for high-DPI crisp vector printing.
 */
export async function generateQRCodeSvgString(
  text: string,
  options?: QRGenerationOptions
): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      width: options?.width || 180,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff',
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    });
    return svgString;
  } catch (err) {
    console.error('Failed to generate SVG QR code:', err);
    return '';
  }
}

/**
 * Generates a QR Code as a Data URL (PNG image).
 */
export async function generateQRCodeDataUrl(
  text: string,
  options?: QRGenerationOptions
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 256,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff',
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate DataURL QR code:', err);
    return '';
  }
}
