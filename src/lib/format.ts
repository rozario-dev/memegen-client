export function truncateMiddle(value: string, start = 4, end = 4): string {
  if (!value) return '';
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function formatAddress(address: string, start = 4, end = 4): string {
  return truncateMiddle(address, start, end);
}

export const compressImage = (file: File, maxSizeMB: number, maxWidth: number, maxHeight: number) => {
  return new Promise<File>((resolve, reject) => {
    const isGif = /gif$/i.test(file.type);
    if (isGif) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));

        const targetW = Math.max(1, Math.floor(maxWidth));
        const targetH = Math.max(1, Math.floor(maxHeight));
        canvas.width = targetW;
        canvas.height = targetH;

        const baseScale = Math.min(targetW / img.width, targetH / img.height, 1);
        let currentScale = baseScale;

        let outputType: string = 'image/webp';
        if (/jpe?g$/i.test(file.type)) outputType = 'image/jpeg';

        const targetBytes = Math.max(1, Math.floor(maxSizeMB * 1024 * 1024));
        let quality = 0.85;
        let attempt = 0;
        const maxAttempts = 10;

        let currentBlob: Blob | null = null;

        const renderToBlob = (): Promise<Blob> =>
          new Promise((res, rej) => {
            ctx!.clearRect(0, 0, canvas.width, canvas.height);
            const drawW = Math.max(1, Math.floor(img.width * currentScale));
            const drawH = Math.max(1, Math.floor(img.height * currentScale));
            const dx = Math.floor((targetW - drawW) / 2);
            const dy = Math.floor((targetH - drawH) / 2);
            ctx!.drawImage(img, dx, dy, drawW, drawH);
            canvas.toBlob(
              (b) => (b ? res(b) : rej(new Error('Canvas blob conversion failed'))),
              outputType,
              quality
            );
          });

        try {
          while (attempt < maxAttempts) {
            attempt += 1;
            currentBlob = await renderToBlob();
            if (currentBlob.size <= targetBytes) break;

            if (quality > 0.5) {
              quality = Math.max(0.5, quality - 0.1);
              continue;
            }
            currentScale = Math.max(0.2, currentScale * 0.9);
          }

          const outBlob = currentBlob || (await renderToBlob());
          const outExt = outputType === 'image/webp' ? '.webp' : '.jpg';
          const outName = file.name.replace(/\.[^.]+$/, '') + outExt;
          const outFile = new File([outBlob], outName, {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve(outFile);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = reader.result as string;
    };
  });
};

export function parseTokenPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    const b64 = parts.length === 3 ? parts[1] : token;
    const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

  // Helper functions for Solana token handling
  export const isSolanaCustomToken = (token: string): boolean | {address: string, chain: string} => {
    try {
      const payload = parseTokenPayload(token);
      if (!payload) return false;

      // Case 1: Supabase Web3 JWT (preferred)
      const appMeta = payload.app_metadata;
      const isWeb3Provider = appMeta?.provider === 'web3' || (Array.isArray(appMeta?.providers) && appMeta.providers.includes('web3'));
      if (isWeb3Provider) {
        const custom = payload.user_metadata?.custom_claims || {};
        let address: string | undefined = custom.address;
        let chain: string | undefined = custom.chain;

        // Fallback: try to parse from sub like "web3:solana:<address>"
        const sub: string | undefined = payload.user_metadata?.sub || payload.sub;
        if (!address && typeof sub === 'string' && sub.startsWith('web3:')) {
          const parts = sub.split(':');
          if (parts.length >= 3) {
            chain = chain || parts[1];
            address = parts.slice(2).join(':');
          }
        }

        if (address) {
          return { address, chain: (chain || 'solana') as string };
        }
      }

      // Case 2: Legacy custom token shape
      if (payload.provider === 'solana' && payload.publicKey) {
        return { address: payload.publicKey as string, chain: 'solana' };
      }

      return false;
    } catch (e) {
      return false;
    }
  };