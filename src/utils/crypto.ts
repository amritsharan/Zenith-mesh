// src/utils/crypto.ts

/**
 * Computes the SHA-256 hash of a string to generate a "Proof-of-Agency" Intent Hash.
 * This ensures the user's raw query is never stored directly, only the cryptographically secure fingerprint.
 * @param message The raw user query.
 * @returns The SHA-256 hexadecimal hash string.
 */
export async function computeHashOfIntent(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Use SubtleCrypto API to compute SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert buffer to byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
    
  return hashHex;
}
