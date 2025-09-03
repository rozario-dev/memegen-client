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
        // 固定画布尺寸为 maxWidth x maxHeight，严格满足像素要求
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));

        const targetW = Math.max(1, Math.floor(maxWidth));
        const targetH = Math.max(1, Math.floor(maxHeight));
        canvas.width = targetW;
        canvas.height = targetH;

        // 初始以“等比缩放填充至画布内并居中”的方式绘制
        const baseScale = Math.min(targetW / img.width, targetH / img.height, 1);
        let currentScale = baseScale;

        // 选择有损格式以便质量参数有效
        let outputType: string = 'image/webp';
        if (/jpe?g$/i.test(file.type)) outputType = 'image/jpeg';

        const targetBytes = Math.max(1, Math.floor(maxSizeMB * 1024 * 1024));
        let quality = 0.85;
        let attempt = 0;
        const maxAttempts = 10;

        let currentBlob: Blob | null = null;

        const renderToBlob = (): Promise<Blob> =>
          new Promise((res, rej) => {
            // 清空背景，保持透明/空白区域
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
            // 质量降到阈值仍超限，进一步降低绘制比例（保持导出尺寸不变）
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
