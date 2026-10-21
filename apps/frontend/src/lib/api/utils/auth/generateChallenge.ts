function toBase64(arrayBuffer: Uint8Array<ArrayBuffer>) {
  return btoa(String.fromCharCode(...arrayBuffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function generateChallenge(crypto: Crypto, length = 32, algorithm = 'SHA-256') {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const codeVerifier = toBase64(array);

  return {
    codeVerifier,
    codeChallenge: toBase64(
      new Uint8Array(await crypto.subtle.digest(algorithm, new TextEncoder().encode(codeVerifier)))
    )
  };
}
