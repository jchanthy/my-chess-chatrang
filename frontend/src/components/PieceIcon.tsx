import React from 'react';
import { PieceType, PieceColor } from '../rules/chessRules';

interface PieceIconProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const PieceIcon: React.FC<PieceIconProps> = ({ type, color, className = 'w-full h-full' }) => {
  const strokeColor = color === 'w' ? '#B8860B' : '#FFFFFF'; // Golden for White, White for Black
  const fillColor = color === 'w' ? '#FFD700' : '#4B5563';   // Bright Gold vs Dark Charcoal/Gray
  const secondaryColor = color === 'w' ? '#FFF8DC' : '#1F2937'; // Light cream vs deep charcoal

  // Custom SVGs representing Cambodian Chess (Ouk Chatrang) structures
  switch (type) {
    case 'sdaach': // King (Ang / Sdaach) - Royal Stupa / Crown
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="80" rx="35" ry="12" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
          <path d="M 25 75 Q 50 65 75 75 L 65 40 Q 50 45 35 40 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
          <path d="M 35 40 Q 50 20 65 40" fill="none" stroke={strokeColor} strokeWidth="3" />
          <path d="M 50 35 L 50 10" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="50,5 45,12 55,12" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
          <circle cx="50" cy="50" r="6" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );

    case 'neang': // Queen (Neang) - Mini Crown/Stupa
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="80" rx="30" ry="10" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
          <path d="M 30 75 Q 50 68 70 75 L 62 45 Q 50 50 38 45 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
          <path d="M 40 45 Q 50 25 60 45" fill="none" stroke={strokeColor} strokeWidth="3" />
          <circle cx="50" cy="20" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
        </svg>
      );

    case 'koul': // Bishop (Koul) - Dome/Pillar with horizontal bands
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="80" rx="28" ry="10" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
          <path d="M 30 75 L 35 50 Q 50 35 65 50 L 70 75 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
          <circle cx="50" cy="35" r="10" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
          <line x1="32" y1="62" x2="68" y2="62" stroke={strokeColor} strokeWidth="3" />
          <line x1="34" y1="50" x2="66" y2="50" stroke={strokeColor} strokeWidth="3" />
        </svg>
      );

    case 'sesh': // Knight (Sesh) - Stylized Horse Head
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <path d="M 25 85 C 25 85 20 65 30 50 C 40 35 55 30 65 35 C 75 40 80 50 75 58 C 70 65 60 62 55 58 C 50 54 48 45 48 45 C 48 45 38 52 40 68 C 42 84 25 85 25 85 Z" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
          <path d="M 30 50 C 25 40 35 30 45 25 C 48 20 52 20 55 25" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="62" cy="46" r="3.5" fill={secondaryColor} stroke={strokeColor} strokeWidth="1" />
        </svg>
      );

    case 'touk': // Rook (Touk) - Boat shape
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <path d="M 15 45 C 30 35 70 35 85 45 C 80 65 75 75 50 80 C 25 75 20 65 15 45 Z" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
          <rect x="42" y="25" width="16" height="20" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
          <line x1="15" y1="45" x2="85" y2="45" stroke={strokeColor} strokeWidth="3" />
          <line x1="20" y1="58" x2="80" y2="58" stroke={strokeColor} strokeWidth="2" />
        </svg>
      );

    case 'trey': // Pawn (Trey) - Cowrie Shell (oval shape with lines inside)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="50" rx="25" ry="32" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
          <path d="M 50 18 Q 42 50 50 82" fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d="M 38 35 Q 46 50 38 65" fill="none" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M 62 35 Q 54 50 62 65" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'trey_kaet': // Promoted Pawn (Trey Kaet) - Cowrie shell flipped or with miniature queen ornament
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="60" rx="25" ry="25" fill={secondaryColor} stroke={strokeColor} strokeWidth="3" />
          <circle cx="50" cy="60" r="12" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          {/* Crown Ornament on top of the shell */}
          <path d="M 35 35 L 42 22 L 50 30 L 58 22 L 65 35 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </svg>
      );

    default:
      return null;
  }
};
