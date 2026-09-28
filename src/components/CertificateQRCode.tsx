import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getCertificateVerificationUrl } from '../utils/qrUtils';
import { QrCode, Download, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

interface CertificateQRCodeProps {
  controlNumber: string;
  size?: number;
  showCaption?: boolean;
  showBorder?: boolean;
  onOpenVerification?: (controlNumber: string) => void;
  className?: string;
  customPayload?: string;
}

export const CertificateQRCode: React.FC<CertificateQRCodeProps> = ({
  controlNumber,
  size = 64,
  showCaption = true,
  showBorder = true,
  onOpenVerification,
  className = '',
  customPayload,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const verificationUrl = customPayload || getCertificateVerificationUrl(controlNumber);

  useEffect(() => {
    let isMounted = true;

    // Generate high-resolution data URL
    QRCode.toDataURL(verificationUrl, {
      width: Math.max(size * 3, 200), // High DPI for crisp printing
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code data URL:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [verificationUrl, size]);

  const handleCopyVerificationLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_Verification_${controlNumber.replace(/[^A-Za-z0-9_-]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className={`relative group inline-flex flex-col items-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`bg-white p-1.5 rounded-lg transition-all ${
          showBorder ? 'border border-slate-300 shadow-2xs' : ''
        }`}
        style={{ width: size + 12, minHeight: size + 12 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Verification for ${controlNumber}`}
            width={size}
            height={size}
            className="block mx-auto rounded-xs object-contain"
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-slate-50 text-slate-400"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <QrCode className="w-6 h-6 animate-pulse" />
          </div>
        )}
      </div>

      {showCaption && (
        <div className="text-center mt-1">
          <span className="block text-[8px] font-mono font-bold text-slate-800 tracking-tight leading-tight">
            {controlNumber}
          </span>
          <span className="block text-[6.5px] uppercase font-sans text-slate-500 font-medium tracking-wide">
            Scan to Verify
          </span>
        </div>
      )}

      {/* Floating Action Controls on Hover (hidden during print) */}
      <div className="no-print absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded-md text-[10px] font-sans font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto shadow-lg z-30 whitespace-nowrap">
        <button
          type="button"
          onClick={handleCopyVerificationLink}
          title="Copy Verification Link"
          className="hover:text-emerald-400 p-0.5 transition-colors cursor-pointer flex items-center gap-0.5"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <span className="text-slate-600">|</span>
        <button
          type="button"
          onClick={handleDownloadQrPng}
          title="Download High-Res QR Image"
          className="hover:text-indigo-400 p-0.5 transition-colors cursor-pointer flex items-center gap-0.5"
        >
          <Download className="w-3 h-3" />
          <span>Save</span>
        </button>
        {onOpenVerification && (
          <>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => onOpenVerification(controlNumber)}
              title="Test Document Verification"
              className="hover:text-amber-400 p-0.5 transition-colors cursor-pointer flex items-center gap-0.5"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Verify</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
