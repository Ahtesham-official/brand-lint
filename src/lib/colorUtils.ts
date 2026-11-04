// Color utility functions for BrandLint
// Calculates RGB distance, Delta-E approximation, relative luminance, and WCAG AA contrast ratio

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// CIE76 color difference approximation in RGB space with human perceptual weighting
export function calculateColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 999;

  // Redmean formula - perceptual distance approximation
  const rMean = (rgb1.r + rgb2.r) / 2;
  const deltaR = rgb1.r - rgb2.r;
  const deltaG = rgb1.g - rgb2.g;
  const deltaB = rgb1.b - rgb2.b;

  const weightR = 2 + rMean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rMean) / 256;

  const distance = Math.sqrt(
    weightR * deltaR * deltaR +
    weightG * deltaG * deltaG +
    weightB * deltaB * deltaB
  );

  // Normalize distance to 0 - 100 scale
  return Math.round((distance / 765) * 100 * 10) / 10;
}

// Relative luminance based on WCAG standard
export function calculateRelativeLuminance(rgb: RGB): number {
  const transform = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  const R = transform(rgb.r);
  const G = transform(rgb.g);
  const B = transform(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// WCAG Contrast Ratio between two colors: (L1 + 0.05) / (L2 + 0.05)
export function calculateContrastRatio(hexForeground: string, hexBackground: string): number {
  const rgb1 = hexToRgb(hexForeground);
  const rgb2 = hexToRgb(hexBackground);
  if (!rgb1 || !rgb2) return 1.0;

  const lum1 = calculateRelativeLuminance(rgb1);
  const lum2 = calculateRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

// Checks if color matches any in the approved palette within distance threshold
export function checkColorPaletteMatch(
  detectedHex: string,
  approvedPalette: string[],
  threshold: number = 18
): { isCompliant: boolean; closestColor: string; minDistance: number } {
  let minDistance = 999;
  let closestColor = approvedPalette[0] || '#000000';

  for (const approved of approvedPalette) {
    const dist = calculateColorDistance(detectedHex, approved);
    if (dist < minDistance) {
      minDistance = dist;
      closestColor = approved;
    }
  }

  return {
    isCompliant: minDistance <= threshold,
    closestColor,
    minDistance,
  };
}

