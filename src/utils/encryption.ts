export const SECRET_KEY = 'foodie_secure_key_v1';

export const encryptData = (data: any): string => {
  try {
    const json = JSON.stringify(data);
    // Simple XOR cipher
    const xor = json.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
    // Base64 encode
    return btoa(xor);
  } catch (e) {
    console.error("Encryption failed", e);
    return '';
  }
};

export const decryptData = (encrypted: string): any => {
  try {
    // Base64 decode
    const xor = atob(encrypted);
    // Simple XOR cipher (symmetric)
    const json = xor.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
    return JSON.parse(json);
  } catch (e) {
    throw new Error('Invalid encrypted file');
  }
};
