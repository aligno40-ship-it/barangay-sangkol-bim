import React from 'react';
import { useBarangay } from '../context/BarangayContext';

/**
 * Official Coat of Arms of the Republic of the Philippines (National Emblem)
 * Faithfully vectorized according to national heraldic specifications.
 */
export const RepublicSeal: React.FC<{ className?: string; size?: number; customUrl?: string }> = ({
  className = '',
  size = 72,
  customUrl,
}) => {
  const ctx = useBarangay();
  const ctxRepublicUrl = ctx?.settings?.republicLogoUrl;
  const finalUrl = customUrl || ctxRepublicUrl;

  if (finalUrl) {
    return (
      <img
        src={finalUrl}
        alt="Republic of the Philippines Seal"
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className={`shrink-0 object-contain rounded-full ${className}`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients & Filters */}
        <linearGradient id="rp-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="rp-blue-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0038A8" />
          <stop offset="100%" stopColor="#002B7F" />
        </linearGradient>
        <linearGradient id="rp-red-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CE1126" />
          <stop offset="100%" stopColor="#A50E1E" />
        </linearGradient>
        <filter id="rp-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* SHIELD BASE & BORDER */}
      {/* Outer Shield Boundary Path */}
      {/* 
        Top crest: Center point (100, 24), curves down to (70, 36) then rises to (42, 28) and corner (40, 32).
        Right side: mirror.
        Bottom curve: curves from (40, 100) down to (100, 196) and up to (160, 100).
      */}
      
      {/* Shield Background / White Chief */}
      <path
        d="M 100 24 
           C 86 36 68 36 56 30 
           C 48 36 42 46 42 56 
           L 42 100 
           L 158 100 
           L 158 56 
           C 158 46 152 36 144 30 
           C 132 36 114 36 100 24 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2.5"
      />

      {/* Blue Left Field (Dexter) */}
      <path
        d="M 42 100 
           L 100 100 
           L 100 196 
           C 78 184 42 148 42 100 Z"
        fill="url(#rp-blue-grad)"
        stroke="#1E293B"
        strokeWidth="2"
      />

      {/* Red Right Field (Sinister) */}
      <path
        d="M 100 100 
           L 158 100 
           C 158 148 122 184 100 196 
           L 100 100 Z"
        fill="url(#rp-red-grad)"
        stroke="#1E293B"
        strokeWidth="2"
      />

      {/* Shield Main Outer Outline */}
      <path
        d="M 100 24 
           C 86 36 68 36 56 30 
           C 48 36 42 46 42 56 
           L 42 100 
           C 42 148 78 184 100 196 
           C 122 184 158 148 158 100 
           L 158 56 
           C 158 46 152 36 144 30 
           C 132 36 114 36 100 24 Z"
        fill="none"
        stroke="#0F172A"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {/* THREE GOLDEN STARS IN CHIEF */}
      {/* Top Center Star */}
      <g transform="translate(100, 48)">
        {/* Star Polygon */}
        <polygon
          points="0,-12 3.5,-3.5 12,-3.5 5,2 8,11 0,5.5 -8,11 -5,2 -12,-3.5 -3.5,-3.5"
          fill="url(#rp-gold-grad)"
          stroke="#854D0E"
          strokeWidth="0.8"
        />
        {/* Star Facet Lines */}
        <line x1="0" y1="0" x2="0" y2="-12" stroke="#FEF08A" strokeWidth="0.6" />
        <line x1="0" y1="0" x2="12" y2="-3.5" stroke="#A16207" strokeWidth="0.6" />
        <line x1="0" y1="0" x2="8" y2="11" stroke="#FEF08A" strokeWidth="0.6" />
        <line x1="0" y1="0" x2="-8" y2="11" stroke="#A16207" strokeWidth="0.6" />
        <line x1="0" y1="0" x2="-12" y2="-3.5" stroke="#FEF08A" strokeWidth="0.6" />
      </g>

      {/* Top Left Star */}
      <g transform="translate(62, 75)">
        <polygon
          points="0,-10 3,-3 10,-3 4.2,1.8 6.8,9 0,4.6 -6.8,9 -4.2,1.8 -10,-3 -3,-3"
          fill="url(#rp-gold-grad)"
          stroke="#854D0E"
          strokeWidth="0.8"
        />
        <line x1="0" y1="0" x2="0" y2="-10" stroke="#FEF08A" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="10" y2="-3" stroke="#A16207" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="6.8" y2="9" stroke="#FEF08A" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="-6.8" y2="9" stroke="#A16207" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="-10" y2="-3" stroke="#FEF08A" strokeWidth="0.5" />
      </g>

      {/* Top Right Star */}
      <g transform="translate(138, 75)">
        <polygon
          points="0,-10 3,-3 10,-3 4.2,1.8 6.8,9 0,4.6 -6.8,9 -4.2,1.8 -10,-3 -3,-3"
          fill="url(#rp-gold-grad)"
          stroke="#854D0E"
          strokeWidth="0.8"
        />
        <line x1="0" y1="0" x2="0" y2="-10" stroke="#FEF08A" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="10" y2="-3" stroke="#A16207" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="6.8" y2="9" stroke="#FEF08A" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="-6.8" y2="9" stroke="#A16207" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="-10" y2="-3" stroke="#FEF08A" strokeWidth="0.5" />
      </g>

      {/* AMERICAN BALD EAGLE (Left / Blue Field) */}
      <g transform="translate(71, 140) scale(0.68)">
        {/* Eagle Body & Wings */}
        {/* Outspread Wings */}
        <path
          d="M 0 -18 
             C -12 -36 -28 -32 -38 -20 
             C -34 -12 -28 -6 -20 -2 
             C -30 2 -32 10 -26 18 
             C -20 12 -12 8 -4 6 
             L 0 16 
             L 4 6 
             C 12 8 20 12 26 18 
             C 32 10 30 2 20 -2 
             C 28 -6 34 -12 38 -20 
             C 28 -32 12 -36 0 -18 Z"
          fill="#D97706"
          stroke="#78350F"
          strokeWidth="1"
        />
        {/* Feathers Texture */}
        <path
          d="M -16 -12 C -24 -6 -22 6 -14 10 M 16 -12 C 24 -6 22 6 14 10 M -8 -4 C -12 4 -8 12 -2 14 M 8 -4 C 12 4 8 12 2 14"
          stroke="#FEF3C7"
          strokeWidth="1"
          fill="none"
        />
        {/* White Head & Neck */}
        <path
          d="M 0 -16 C -6 -24 -8 -34 0 -36 C 6 -34 8 -24 0 -16 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />
        {/* Yellow Beak */}
        <path d="M -4 -30 L -10 -28 L -4 -26 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="0.5" />
        {/* Eye */}
        <circle cx="-2" cy="-29" r="0.9" fill="#0F172A" />
        {/* White Tail Feathers */}
        <path d="M -6 16 L 0 28 L 6 16 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
        {/* Talons holding Olive Branch & Arrows */}
        {/* Olive Branch (Left) */}
        <path d="M -4 14 Q -16 20 -22 16" stroke="#22C55E" strokeWidth="1.5" fill="none" />
        <ellipse cx="-12" cy="18" rx="2.5" ry="1.2" fill="#4ADE80" transform="rotate(-20 -12 18)" />
        <ellipse cx="-18" cy="17" rx="2.5" ry="1.2" fill="#4ADE80" transform="rotate(15 -18 17)" />
        {/* Arrows (Right) */}
        <line x1="4" y1="14" x2="18" y2="22" stroke="#E2E8F0" strokeWidth="1.2" />
        <line x1="4" y1="14" x2="16" y2="26" stroke="#E2E8F0" strokeWidth="1.2" />
        <polygon points="18,22 14,20 16,24" fill="#F8FAFC" />
        <polygon points="16,26 12,24 14,28" fill="#F8FAFC" />
        {/* Yellow Talons */}
        <circle cx="-4" cy="14" r="2.2" fill="#FBBF24" />
        <circle cx="4" cy="14" r="2.2" fill="#FBBF24" />
      </g>

      {/* SPANISH GOLDEN LION RAMPANT (Right / Red Field) */}
      <g transform="translate(128, 140) scale(0.68)">
        {/* Lion Rampant Silhouette */}
        {/* Body & Hind Legs */}
        <path
          d="M 4 18 
             C 8 22 12 24 16 24 
             C 14 20 10 18 8 14 
             C 12 12 16 10 14 6 
             C 12 8 8 9 6 6 
             C 8 2 12 -4 10 -10 
             C 6 -8 4 -4 2 -2 
             C 0 -6 -2 -14 4 -20 
             C 8 -22 8 -28 2 -30 
             C -4 -30 -6 -26 -6 -20 
             C -10 -22 -14 -20 -16 -16 
             C -12 -14 -8 -14 -6 -10 
             L -10 -4 
             C -14 -4 -18 -8 -20 -12 
             C -22 -6 -18 0 -12 2 
             L -8 8 
             C -12 12 -18 14 -20 20 
             C -14 20 -10 16 -6 12 
             L 0 16 Z"
          fill="url(#rp-gold-grad)"
          stroke="#78350F"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Lion Tail */}
        <path
          d="M 12 10 C 22 8 28 -2 24 -12 C 22 -16 18 -18 20 -22 C 22 -26 28 -24 26 -18 C 30 -22 28 -28 24 -30 C 18 -26 18 -16 20 -8 C 22 2 16 8 8 10"
          fill="url(#rp-gold-grad)"
          stroke="#78350F"
          strokeWidth="1"
        />
        {/* Lion Tuft of Tail */}
        <path d="M 22 -24 C 26 -28 28 -22 24 -18 Z" fill="#FDE047" stroke="#78350F" strokeWidth="0.6" />
        {/* Red Tongue */}
        <path d="M -14 -18 Q -18 -18 -20 -15" stroke="#EF4444" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Lion Eye */}
        <circle cx="-6" cy="-22" r="0.9" fill="#0F172A" />
        {/* Claws */}
        <path d="M -21 -13 L -24 -12 M -21 -11 L -23 -9 M -21 21 L -24 22 M 17 24 L 20 25" stroke="#78350F" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* CENTER OVAL & 8-RAYED GOLDEN SUN */}
      <g transform="translate(100, 100)">
        {/* White Oval with double border */}
        <ellipse cx="0" cy="0" rx="25" ry="32" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
        <ellipse cx="0" cy="0" rx="23.5" ry="30.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />

        {/* Golden Sun Disk */}
        <circle cx="0" cy="0" r="11" fill="url(#rp-gold-grad)" stroke="#A16207" strokeWidth="1" />
        <circle cx="0" cy="0" r="9" fill="#FDE047" />

        {/* 8 Triple-Ray Sunbursts */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            {/* Center Main Ray */}
            <polygon points="0,-10.5 2,-19 0,-26 -2,-19" fill="url(#rp-gold-grad)" stroke="#A16207" strokeWidth="0.4" />
            <line x1="0" y1="-11" x2="0" y2="-25.5" stroke="#FEF08A" strokeWidth="0.6" />
            {/* Left Sub-Ray */}
            <polygon points="-2.5,-10.5 -1.5,-16 -4,-21.5 -4.5,-16" fill="url(#rp-gold-grad)" stroke="#A16207" strokeWidth="0.3" />
            {/* Right Sub-Ray */}
            <polygon points="2.5,-10.5 1.5,-16 4,-21.5 4.5,-16" fill="url(#rp-gold-grad)" stroke="#A16207" strokeWidth="0.3" />
          </g>
        ))}
      </g>

      {/* BOTTOM WHITE BANNER / SCROLL */}
      <g transform="translate(100, 205)">
        {/* Folded Ribbon Backs */}
        <path d="M -76 -2 L -64 12 L -56 4 Z" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.2" />
        <path d="M 76 -2 L 64 12 L 56 4 Z" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.2" />

        {/* Ribbon Ends (Swallowtails) */}
        <path
          d="M -76 -2 C -84 6 -88 16 -82 22 L -68 14 L -64 24 C -68 18 -68 10 -64 6 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M 76 -2 C 84 6 88 16 82 22 L 68 14 L 64 24 C 68 18 68 10 64 6 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Main Ribbon Center Arc */}
        <path
          id="rp-banner-path"
          d="M -70 8 C -35 22 35 22 70 8 L 66 22 C 33 34 -33 34 -66 22 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Text Arc Guide */}
        <path id="rp-text-arc" d="M -64 22 C -32 32 32 32 64 22" fill="none" />

        {/* Banner Text: REPUBLIKA NG PILIPINAS */}
        <text
          fill="#0F172A"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="1.2"
        >
          <textPath href="#rp-text-arc" startOffset="50%" textAnchor="middle">
            REPUBLIKA NG PILIPINAS
          </textPath>
        </text>
      </g>
    </svg>
  );
};

/**
 * Official Seal of Sangguniang Panlungsod • City of Dipolog (Barangay Sangkol Seal)
 * Faithfully vectorized according to the official City of Dipolog seal provided:
 * - Thick Royal Blue outer circular border with bold white "SANGGUNIANG PANLUNGSOD • CITY OF DIPOLOG"
 * - Midnight blue field with encircling ring of 24 white 5-pointed stars
 * - 8-rayed golden sunburst radiating from center
 * - Red central triangle with Dipolog Landmark Obelisk monument, coconut palm tree, and orchid/marine emblems
 */
export const BarangaySangkolSeal: React.FC<{
  className?: string;
  size?: number;
  customUrl?: string;
}> = ({ className = '', size = 72, customUrl }) => {
  const ctx = useBarangay();
  const ctxLogoUrl = ctx?.settings?.logoUrl;
  const finalUrl = customUrl || ctxLogoUrl;

  if (finalUrl) {
    return (
      <img
        src={finalUrl}
        alt="Barangay Official Seal / Logo"
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className={`shrink-0 object-contain rounded-full shadow-xs ${className}`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Colors & Gradients */}
        <linearGradient id="dipolog-blue-outer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003594" />
          <stop offset="100%" stopColor="#001F66" />
        </linearGradient>
        <linearGradient id="dipolog-sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF066" />
          <stop offset="40%" stopColor="#FFDE00" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <linearGradient id="dipolog-red-tri" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E61E2A" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>

      {/* 1. OUTER RING & BORDERS */}
      {/* Outer black accent ring */}
      <circle cx="100" cy="100" r="98" fill="#001845" stroke="#001845" strokeWidth="1" />
      {/* Outer White Separator Ring */}
      <circle cx="100" cy="100" r="96" fill="#002D80" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Blue Lettering Ring Field */}
      <circle cx="100" cy="100" r="77" fill="#001F5C" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* TEXT ARCS IN OUTER BLUE RING */}
      {/* Top Arc: SANGGUNIANG PANLUNGSOD */}
      <path id="dipolog-top-arc" d="M 28 100 A 72 72 0 0 1 172 100" fill="none" />
      <text
        fill="#FFFFFF"
        fontSize="11.5"
        fontWeight="900"
        fontFamily="'Arial Black', Impact, system-ui, sans-serif"
        letterSpacing="2.2"
      >
        <textPath href="#dipolog-top-arc" startOffset="50%" textAnchor="middle">
          SANGGUNIANG PANLUNGSOD
        </textPath>
      </text>

      {/* Bottom Arc: CITY OF DIPOLOG */}
      <path id="dipolog-bottom-arc" d="M 174 100 A 74 74 0 0 1 26 100" fill="none" />
      <text
        fill="#FFFFFF"
        fontSize="12.5"
        fontWeight="900"
        fontFamily="'Arial Black', Impact, system-ui, sans-serif"
        letterSpacing="3"
      >
        <textPath href="#dipolog-bottom-arc" startOffset="50%" textAnchor="middle">
          • CITY OF DIPOLOG •
        </textPath>
      </text>

      {/* 2. INNER DARK BLUE FIELD WITH RING OF WHITE STARS */}
      <circle cx="100" cy="100" r="75" fill="#001A4E" />

      {/* 24 ENCIRCLING WHITE 5-POINTED STARS */}
      {Array.from({ length: 24 }).map((_, index) => {
        const angle = (index * 360) / 24;
        const rad = ((angle - 90) * Math.PI) / 180;
        const r = 68.5;
        const cx = 100 + r * Math.cos(rad);
        const cy = 100 + r * Math.sin(rad);
        return (
          <g key={index} transform={`translate(${cx}, ${cy}) rotate(${angle}) scale(0.48)`}>
            <polygon
              points="0,-7 2.1,-2.2 7.3,-2.2 3.1,1.2 4.7,6.3 0,3.2 -4.7,6.3 -3.1,1.2 -7.3,-2.2 -2.1,-2.2"
              fill="#FFFFFF"
            />
          </g>
        );
      })}

      {/* 3. EIGHT-RAYED GOLDEN SUNBURST */}
      <g transform="translate(100, 100)">
        {/* 8 Primary Faceted Sun Rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            {/* Major Sun Ray */}
            <polygon
              points="0,-22 14,-38 0,-56 -14,-38"
              fill="url(#dipolog-sun-grad)"
              stroke="#D97706"
              strokeWidth="0.8"
            />
            {/* Secondary Interstitial Flank Rays */}
            <polygon
              points="-12,-32 -20,-44 -8,-40"
              fill="#FDE047"
              stroke="#D97706"
              strokeWidth="0.5"
            />
            <polygon
              points="12,-32 20,-44 8,-40"
              fill="#EAB308"
              stroke="#D97706"
              strokeWidth="0.5"
            />
            {/* Center Ray Division Line */}
            <line x1="0" y1="-22" x2="0" y2="-56" stroke="#FEF08A" strokeWidth="1" />
          </g>
        ))}

        {/* Golden Ring Under Triangle */}
        <circle cx="0" cy="0" r="34" fill="#FFDE00" stroke="#B45309" strokeWidth="1.2" />
      </g>

      {/* 4. CENTRAL RED EQUILATERAL TRIANGLE */}
      <g transform="translate(100, 104)">
        {/* Outer Red Triangle with Golden Border */}
        <polygon
          points="0,-48 40,20 -40,20"
          fill="url(#dipolog-red-tri)"
          stroke="#FFDE00"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* DIPOLOG MOTIFS INSIDE RED TRIANGLE */}
        {/* TOP: Twin Fishes Motif */}
        <path
          d="M -6 -32 C -10 -38 0 -44 0 -44 C 0 -44 10 -38 6 -32 C 2 -34 -2 -34 -6 -32 Z"
          fill="#FFFFFF"
          stroke="#FFE4E6"
          strokeWidth="0.5"
        />
        <circle cx="-3" cy="-36" r="0.6" fill="#B91C1C" />
        <circle cx="3" cy="-36" r="0.6" fill="#B91C1C" />

        {/* CENTER: Dipolog City Landmark Obelisk Monument */}
        <g transform="translate(0, -6)">
          {/* Base Steps */}
          <rect x="-7" y="21" width="14" height="2.5" fill="#FFFFFF" rx="0.5" />
          <rect x="-5.5" y="19" width="11" height="2" fill="#FFFFFF" rx="0.5" />
          <rect x="-4" y="17" width="8" height="2" fill="#FFFFFF" rx="0.5" />
          {/* Monument Pillar Column */}
          <path
            d="M -3 17 
               L -2.2 -16 
               C -2.2 -22 0 -26 0 -26 
               C 0 -26 2.2 -22 2.2 -16 
               L 3 17 Z"
            fill="#FFFFFF"
            stroke="#F1F5F9"
            strokeWidth="0.6"
          />
          {/* Monument Spire details */}
          <line x1="0" y1="-26" x2="0" y2="17" stroke="#E2E8F0" strokeWidth="0.6" />
          <ellipse cx="0" cy="-6" rx="1.6" ry="3" fill="#E2E8F0" />
        </g>

        {/* LEFT: Coconut Palm Tree of Dipolog */}
        <g transform="translate(-21, 5) scale(0.72)">
          {/* Tree Trunk */}
          <path
            d="M 6 18 C 3 10 0 2 -3 -8 L -1 -8 C 2 2 5 10 8 18 Z"
            fill="#FFFFFF"
          />
          {/* Palm Fronds */}
          <path
            d="M -2 -8 C -10 -12 -16 -6 -18 2 C -13 -3 -7 -5 -2 -7 Z"
            fill="#FFFFFF"
          />
          <path
            d="M -2 -8 C -6 -16 -14 -16 -18 -10 C -12 -10 -8 -9 -2 -7 Z"
            fill="#FFFFFF"
          />
          <path
            d="M -2 -8 C 0 -18 8 -18 12 -12 C 7 -11 3 -9 -1 -7 Z"
            fill="#FFFFFF"
          />
          <path
            d="M -2 -8 C 6 -14 14 -8 16 0 C 10 -4 4 -6 -1 -7 Z"
            fill="#FFFFFF"
          />
          {/* Coconut clusters */}
          <circle cx="-1" cy="-6" r="1.2" fill="#FFFFFF" />
          <circle cx="1" cy="-5" r="1.2" fill="#FFFFFF" />
        </g>

        {/* RIGHT: Dipolog Marine / Flora Orchid Motif */}
        <g transform="translate(20, 7) scale(0.68)">
          {/* Orchid Petals / Flora Spray */}
          <path
            d="M -3 15 C 2 8 8 2 12 -4 C 10 2 6 8 2 15 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 6 -1 C 12 -6 16 -4 18 2 C 14 0 10 0 6 -1 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 2 4 C 8 2 14 6 15 12 C 11 8 7 6 2 4 Z"
            fill="#FFFFFF"
          />
          <circle cx="4" cy="2" r="1.4" fill="#FFFFFF" />
          <circle cx="8" cy="6" r="1.2" fill="#FFFFFF" />
        </g>
      </g>
    </svg>
  );
};

// Alias export for backwards compatibility
export const DipologCitySeal = BarangaySangkolSeal;

export const DrySealStamp: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center w-28 h-28 rounded-full border-2 border-dashed border-red-700/60 p-1 select-none pointer-events-none ${className}`}>
      <div className="w-full h-full rounded-full border border-red-700/80 flex flex-col items-center justify-center text-center text-red-800/80 uppercase font-serif p-2 rotate-[-12deg]">
        <span className="text-[7px] font-bold tracking-widest">Republic of the Philippines</span>
        <span className="text-[9px] font-extrabold tracking-wider my-0.5 text-red-900">CITY OF DIPOLOG</span>
        <span className="text-[7px] font-bold text-red-800">BARANGAY SANGKOL</span>
        <span className="text-[6px] tracking-widest mt-0.5">OFFICIAL DRY SEAL</span>
        <span className="text-[5px] tracking-tighter">Valid only with embossed seal</span>
      </div>
    </div>
  );
};

export const QRCodeBox: React.FC<{ code?: string; value?: string; size?: number }> = ({
  code,
  value,
  size = 64,
}) => {
  const [dataUrl, setDataUrl] = React.useState<string>('');
  const textToEncode = value || code || 'BS-SEC-DOC-2026';

  React.useEffect(() => {
    let isMounted = true;
    import('qrcode').then((QRCodeModule) => {
      const QRCode = QRCodeModule.default || QRCodeModule;
      QRCode.toDataURL(textToEncode, {
        width: Math.max(size * 3, 160),
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
        .catch(() => {});
    });
    return () => {
      isMounted = false;
    };
  }, [textToEncode, size]);

  return (
    <div className="flex flex-col items-center bg-white p-1 rounded-sm border border-slate-300 shadow-2xs">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR for ${textToEncode}`}
          width={size}
          height={size}
          className="block object-contain"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        <div
          className="bg-slate-100 flex items-center justify-center text-[7px] text-slate-400 font-mono"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          QR
        </div>
      )}
      <span className="text-[7.5px] font-mono text-slate-700 mt-0.5 tracking-tight font-bold">
        {code || 'VERIFIED'}
      </span>
    </div>
  );
};
