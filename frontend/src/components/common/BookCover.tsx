import React, { useEffect, useMemo, useState } from 'react';

type BookCoverProps = {
  title: string;
  isbn?: string | null;
  coverUrl?: string | null;
  subtitle?: string | null;
  className?: string;
};

const palette = [
  '#6B4F3A',
  '#563F2E',
  '#D9B98F',
  '#C0392B',
  '#6F6A61',
  '#2B2B2B',
];

const hashText = (text: string) =>
  text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

const fallbackCover = (title: string, subtitle?: string | null, isbn?: string | null) => {
  const safeTitle = title || 'BookStore';
  const words = safeTitle.split(/\s+/).filter(Boolean);
  const line1 = words.slice(0, 3).join(' ');
  const line2 = words.slice(3, 7).join(' ');
  const color = palette[hashText(safeTitle) % palette.length];
  const safeSubtitle = subtitle || 'BookStore';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="540" viewBox="0 0 360 540">
      <rect width="360" height="540" fill="${color}"/>
      <rect x="30" y="30" width="300" height="480" rx="8" fill="none" stroke="rgba(255,255,255,0.34)" stroke-width="2"/>
      <rect x="54" y="74" width="72" height="4" rx="2" fill="rgba(255,255,255,0.70)"/>
      <rect x="54" y="92" width="42" height="4" rx="2" fill="rgba(255,255,255,0.42)"/>
      <text x="54" y="228" font-family="Arial, sans-serif" font-size="33" font-weight="800" fill="#fff">
        <tspan x="54">${escapeSvg(line1)}</tspan>
        <tspan x="54" dy="44">${escapeSvg(line2)}</tspan>
      </text>
      <text x="54" y="436" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,0.86)">
        ${escapeSvg(safeSubtitle)}
      </text>
      <text x="54" y="468" font-family="Arial, sans-serif" font-size="15" fill="rgba(255,255,255,0.68)">
        ${escapeSvg(isbn ? `ISBN ${isbn}` : 'BookStore')}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const escapeSvg = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  isbn,
  coverUrl,
  subtitle,
  className = '',
}) => {
  const primaryUrl = coverUrl?.trim() || '';
  const fallbackUrl = useMemo(() => fallbackCover(title, subtitle, isbn), [title, subtitle, isbn]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [primaryUrl]);

  return (
    <img
      src={!failed && primaryUrl ? primaryUrl : fallbackUrl}
      alt={title}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};
