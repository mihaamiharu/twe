/**
 * Simple obfuscation utility to prevent casual inspection of sensitive challenge data (e.g. solution selectors) in API responses.
 * This is NOT strong encryption, but effective enough for client-side trust models.
 */

// Simple static key
const KEY = 'twe-secure-challenge-key-2024';

export function obfuscate(text: string): string {
  if (!text) return text;
  try {
    const xor = text
      .split('')
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length),
        ),
      )
      .join('');
    // Return as Base64 to be safe for JSON
    return btoa(xor);
  } catch (e) {
    console.error('Obfuscation failed', e);
    return text;
  }
}

export function deobfuscate(encoded: string): string {
  if (!encoded) return encoded;
  try {
    const xor = atob(encoded);
    return xor
      .split('')
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length),
        ),
      )
      .join('');
  } catch (e) {
    console.error('Deobfuscation failed', e);
    return encoded;
  }
}
