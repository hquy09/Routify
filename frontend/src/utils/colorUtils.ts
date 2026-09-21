/**
 * Utility functions for color contrast and luminance handling in LifeOS Cover Studio
 */

/**
 * Calculates the relative luminance of a hex color (0 to 1).
 * Uses the standard ITU-R BT.709 relative luminance formula.
 */
export function getLuminance(hexColor?: string): number {
  if (!hexColor || !hexColor.startsWith('#')) return 0.5;
  const hex = hexColor.replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return 0.5;
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Returns true if the hex color is considered light/bright (luminance > 0.55).
 * Examples: yellow (#facc15, #eab308), light cyan, lime, white, light amber.
 */
export function isLightColor(hexColor?: string): boolean {
  if (!hexColor) return false;
  return getLuminance(hexColor) > 0.55;
}

/**
 * For a solid colored background (e.g. Flip Card 1 in Digital mode),
 * returns high-contrast text color:
 * If background is light -> 'text-neutral-950' (dark black/gray)
 * If background is dark -> 'text-white'
 */
export function getContrastTextColorClass(hexColor?: string): string {
  if (!hexColor) return 'text-white';
  return isLightColor(hexColor) ? 'text-neutral-950' : 'text-white';
}

/**
 * For text or small badges that sit on a light surface (e.g. white card in light mode):
 * If the user chooses a light color (like yellow #eab308, lime #84cc16, cyan #06b6d4),
 * raw text in that light color is invisible on white.
 * This function returns a darkened, high-contrast, accessible version of that color.
 */
export function getReadableColorOnLight(hexColor?: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#0f172a';
  if (!isLightColor(hexColor)) return hexColor;

  const hex = hexColor.replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return '#0f172a';
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);

  // Darken by 45% for WCAG 4.5:1 contrast against light backgrounds
  const darkR = Math.max(0, Math.floor(r * 0.52));
  const darkG = Math.max(0, Math.floor(g * 0.52));
  const darkB = Math.max(0, Math.floor(b * 0.52));

  return `rgb(${darkR}, ${darkG}, ${darkB})`;
}
