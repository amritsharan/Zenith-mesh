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

/**
 * Computes the hash of a complete block in the blockchain.
 */
export async function computeBlockHash(
  index: number,
  timestamp: string,
  data: string,
  intentHash: string,
  previousHash: string,
  nonce: number
): Promise<string> {
  const blockString = `${index}-${timestamp}-${data}-${intentHash}-${previousHash}-${nonce}`;
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(blockString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Performs Proof-of-Work to mine a block by finding a nonce that yields a hash starting with the required prefix.
 */
export async function mineBlock(
  index: number,
  timestamp: string,
  data: string,
  intentHash: string,
  previousHash: string,
  difficulty: number
): Promise<{ nonce: number; hash: string }> {
  let nonce = 0;
  const target = '0'.repeat(difficulty);
  while (true) {
    const hash = await computeBlockHash(index, timestamp, data, intentHash, previousHash, nonce);
    if (hash.startsWith(target)) {
      return { nonce, hash };
    }
    nonce++;
    if (nonce % 200 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}
