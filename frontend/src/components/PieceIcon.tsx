import React from 'react';
import { PieceType, PieceColor } from '../rules/chessRules';

interface PieceIconProps {
  type: PieceType;
  color: PieceColor;
  theme?: 'wood' | 'metallic';
  className?: string;
}

export const PieceIcon: React.FC<PieceIconProps> = ({ type, color, theme = 'wood', className = 'w-full h-full' }) => {
  // Determine color variables based on selected theme
  const isMetallic = theme === 'metallic';
  
  // Traditional light wood vs dark mahogany wood colors
  const strokeColor = isMetallic
    ? (color === 'w' ? '#855800' : '#1e293b') // Dark Gold/Bronze vs Dark Slate
    : (color === 'w' ? '#5c3a21' : '#1a0d00'); // Wood outlines
    
  const fillColor = isMetallic
    ? (color === 'w' ? 'url(#goldGradient)' : 'url(#silverGradient)') // Gradient fills
    : (color === 'w' ? '#e2c59d' : '#321f11'); // Solid wood fills
    
  const secondaryColor = isMetallic
    ? (color === 'w' ? '#fffae6' : '#f1f5f9') // Highlights
    : (color === 'w' ? '#ebd4b7' : '#462c19'); // Solid wood highlights

  const renderSvg = () => {
    switch (type) {
      case 'sdaach': // King (Sdaach) - Taller wide stupa spire
        return (
          <svg viewBox="0 0 100 100" className={className}>
            <ellipse cx="50" cy="82" rx="32" ry="12" fill={fillColor} stroke={strokeColor} strokeWidth="3.5" />
            <path d="M 28 78 Q 50 72 72 78 L 62 48 Q 50 53 38 48 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3.5" />
            {/* Stupa spire tiers */}
            <path d="M 38 48 C 38 32 62 32 62 48" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
            <path d="M 43 38 C 43 25 57 25 57 38" fill={secondaryColor} stroke={strokeColor} strokeWidth="2.5" />
            {/* Top pointed spire */}
            <path d="M 50 28 L 50 8" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
            <polygon points="50,4 45,12 55,12" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
            <circle cx="50" cy="50" r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          </svg>
        );

      case 'neang': // Queen (Neang) - Medium stupa spire
        return (
          <svg viewBox="0 0 100 100" className={className}>
            <ellipse cx="50" cy="82" rx="28" ry="11" fill={fillColor} stroke={strokeColor} strokeWidth="3.5" />
            <path d="M 30 78 Q 50 73 70 78 L 62 52 Q 50 56 38 52 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3.5" />
            {/* Spire tier */}
            <path d="M 40 52 C 40 38 60 38 60 52" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="28" r="8" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="18" r="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          </svg>
        );

      case 'koul': // Bishop (Koul) - Round stupa dome with small top spire
        return (
          <svg viewBox="0 0 100 100" className={className}>
            <ellipse cx="50" cy="82" rx="26" ry="10" fill={fillColor} stroke={strokeColor} strokeWidth="3.5" />
            <path d="M 32 78 L 36 56 Q 50 42 64 56 L 68 78 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3.5" />
            {/* Small rounded top knob */}
            <circle cx="50" cy="44" r="11" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="27" r="5" fill={secondaryColor} stroke={strokeColor} strokeWidth="2.5" />
            <line x1="33" y1="66" x2="67" y2="66" stroke={strokeColor} strokeWidth="3.5" />
          </svg>
        );

      case 'sesh': // Knight (Sesh) - Traditional Horse
        return (
          <svg viewBox="0 0 100 100" className={className}>
            {/* Base */}
            <ellipse cx="50" cy="85" rx="28" ry="8" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
            {/* Horse body shape */}
            <path d="M 28 82 C 28 82 22 58 35 44 C 48 30 62 25 70 30 C 78 35 82 48 76 56 C 70 64 62 60 58 54 C 54 48 50 42 50 42 C 50 42 42 50 43 66 C 44 82 28 82 28 82 Z" fill={fillColor} stroke={strokeColor} strokeWidth="3.5" />
            {/* Mane detail */}
            <path d="M 33 46 C 26 36 38 24 48 18 C 52 14 56 16 58 22" fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="64" cy="42" r="3.5" fill={secondaryColor} stroke={strokeColor} strokeWidth="1" />
          </svg>
        );

      case 'touk': // Rook (Touk) - Rounded low base stupa / boat
        return (
          <svg viewBox="0 0 100 100" className={className}>
            <path d="M 18 52 C 32 42 68 42 82 52 C 78 70 72 78 50 82 C 28 78 22 70 18 52 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3.5" />
            <rect x="42" y="32" width="16" height="20" fill={fillColor} stroke={strokeColor} strokeWidth="3.5" />
            <circle cx="50" cy="24" r="6" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
            <line x1="18" y1="52" x2="82" y2="52" stroke={strokeColor} strokeWidth="3.5" />
          </svg>
        );

      case 'trey': // Pawn (Trey) - Flat wooden disk (as seen in image)
        return (
          <svg viewBox="0 0 100 100" className={className}>
            {/* 3D thickness/shadow rim */}
            <ellipse cx="50" cy="56" rx="34" ry="16" fill={color === 'w' ? '#aa7a44' : '#180f08'} />
            {/* Main disk face */}
            <ellipse cx="50" cy="50" rx="34" ry="16" fill={fillColor} stroke={strokeColor} strokeWidth="4" />
            {/* Concentric detail rings inside the disk */}
            <ellipse cx="50" cy="50" rx="22" ry="10" fill="none" stroke={strokeColor} strokeWidth="2.5" />
            <ellipse cx="50" cy="50" rx="10" ry="4" fill={secondaryColor} stroke={strokeColor} strokeWidth="1.5" />
          </svg>
        );

      case 'trey_kaet': // Promoted Pawn - Flipped flat disk with mini ornament on top
        return (
          <svg viewBox="0 0 100 100" className={className}>
            {/* 3D thickness/shadow rim */}
            <ellipse cx="50" cy="62" rx="34" ry="16" fill={color === 'w' ? '#aa7a44' : '#180f08'} />
            {/* Main disk face */}
            <ellipse cx="50" cy="56" rx="34" ry="16" fill={secondaryColor} stroke={strokeColor} strokeWidth="4" />
            <ellipse cx="50" cy="56" rx="22" ry="10" fill="none" stroke={strokeColor} strokeWidth="2.5" />
            {/* Spire point popping out of disk to represent promotion */}
            <path d="M 42 56 Q 50 18 58 56" fill={fillColor} stroke={strokeColor} strokeWidth="3.5" />
            <circle cx="50" cy="22" r="5" fill={secondaryColor} stroke={strokeColor} strokeWidth="2" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {isMetallic && (
        <svg width="0" height="0" className="absolute hidden">
          <defs>
            <radialGradient id="goldGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fff5cc" />
              <stop offset="30%" stopColor="#ffd700" />
              <stop offset="70%" stopColor="#cca300" />
              <stop offset="100%" stopColor="#997a00" />
            </radialGradient>
            <radialGradient id="silverGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
          </defs>
        </svg>
      )}
      {renderSvg()}
    </>
  );
};
