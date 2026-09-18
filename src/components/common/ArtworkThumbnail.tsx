import React, { useMemo } from 'react';

export const ArtworkThumbnail: React.FC<{
  canonicalCode: string;
  mediumEn: string;
  mediumAr: string;
  isAr: boolean;
  className?: string;
}> = ({ canonicalCode, mediumEn, mediumAr, isAr, className = "" }) => {
  // Deterministic math to generate a unique pattern based on the artwork's identity code
  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < canonicalCode.length; i++) {
      h = canonicalCode.charCodeAt(i) + ((h << 5) - h);
    }
    return Math.abs(h);
  }, [canonicalCode]);

  // Institutional Mizan Colors
  const colors = [
    ['#8C601E', '#211B17'], // Ochre & Ink
    ['#8B3A2B', '#F7F1E6'], // Brick & Ivory
    ['#4A5D4E', '#211B17'], // Sage & Ink
    ['#211B17', '#D1C4A9'], // Ink & Sand
  ];
  
  const [colorA, colorB] = colors[hash % colors.length];
  const patternType = hash % 3;

  // Pure CSS Geometric Architecture
  const patternStyle = useMemo(() => {
    if (patternType === 0) {
      return {
        backgroundImage: `radial-gradient(circle at 100% 50%, transparent 20%, ${colorA} 21%, ${colorA} 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, ${colorB} 21%, ${colorB} 34%, transparent 35%, transparent)`,
        backgroundSize: '40px 40px',
        backgroundColor: '#F7F1E6'
      };
    } else if (patternType === 1) {
      return {
        backgroundImage: `linear-gradient(45deg, ${colorA} 25%, transparent 25%, transparent 75%, ${colorA} 75%, ${colorA}), linear-gradient(45deg, ${colorA} 25%, transparent 25%, transparent 75%, ${colorA} 75%, ${colorA})`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        backgroundColor: colorB
      };
    } else {
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${colorB} 25%, transparent 25%, transparent 75%, ${colorB} 75%, ${colorB}), repeating-linear-gradient(45deg, ${colorB} 25%, ${colorA} 25%, ${colorA} 75%, ${colorB} 75%, ${colorB})`,
        backgroundPosition: '0 0, 10px 10px',
        backgroundSize: '20px 20px',
        backgroundColor: colorA
      };
    }
  }, [patternType, colorA, colorB]);

  return (
    <div className={`relative overflow-hidden rounded-md border border-sadu-gold flex items-center justify-center shadow-inner ${className}`}>
      <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={patternStyle} />
      <div className="absolute inset-0 bg-gradient-to-t from-sadu-ink via-transparent to-transparent opacity-80" />
      <span className="relative z-10 text-[9px] font-mono font-bold text-white px-2 py-0.5 bg-sadu-ink/80 rounded border border-white/20 backdrop-blur-sm truncate max-w-[90%]">
        {isAr ? mediumAr : mediumEn}
      </span>
    </div>
  );
};
