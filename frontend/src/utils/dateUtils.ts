/**
 * Date & Time Utilities for Routify
 *
 * Ensures all dates and times are handled in the user's local timezone
 * WITHOUT unintended UTC shifts (e.g. +7h or -7h).
 */

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Returns "YYYY-MM-DD" in local time.
 */
export const toLocalDateString = (d: Date = new Date()): string => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Returns "HH:mm" in local time.
 */
export const toLocalTimeString = (d: Date = new Date()): string => {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Returns "YYYY-MM-DDTHH:mm" in local time for HTML datetime-local input.
 */
export const toLocalInputString = (d: Date = new Date()): string => {
  return `${toLocalDateString(d)}T${toLocalTimeString(d)}`;
};

/**
 * Parse any backend datetime string ("2026-09-20T14:00:00", "2026-09-20 14:00:00", etc.)
 * to HTML input format "YYYY-MM-DDTHH:mm".
 * Does NOT convert timezones or call toISOString().
 */
export const parseBackendDatetimeToLocalInput = (str?: string | null): string => {
  if (!str || !str.trim()) return '';
  const trimmed = str.trim().replace(' ', 'T');
  if (trimmed.length >= 16) {
    return trimmed.slice(0, 16);
  }
  if (trimmed.length === 10) {
    // Just a date "YYYY-MM-DD"
    return `${trimmed}T00:00`;
  }
  return trimmed;
};

/**
 * Formats a local input string ("YYYY-MM-DDTHH:mm") to backend format ("YYYY-MM-DDTHH:mm:ss").
 * Does NOT convert to UTC / toISOString(), preserving exact local user time.
 */
export const formatDatetimeForBackend = (val?: string | null): string | undefined => {
  if (!val || !val.trim()) return undefined;
  const trimmed = val.trim().replace(' ', 'T');
  // If "YYYY-MM-DDTHH:mm:ss", return first 19 chars
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 19);
  }
  // If "YYYY-MM-DDTHH:mm", append ":00"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  // If "YYYY-MM-DD", append "T00:00:00"
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00`;
  }
  return trimmed;
};

// Aliases for compatibility
export const isoToLocalInput = parseBackendDatetimeToLocalInput;
export const localInputToISO = formatDatetimeForBackend;
