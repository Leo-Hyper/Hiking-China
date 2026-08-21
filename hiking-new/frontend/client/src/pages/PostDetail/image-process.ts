export const MAX_FILE_SIZE: number = 5 * 1024 * 1024;

export const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader: FileReader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const COMPRESS_SIZE_THRESHOLD: number = 1024 * 1024;
const COMPRESS_MAX_EDGE: number = 1600;

const compressToDataUrl = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const objectUrl: string = URL.createObjectURL(file);
    const img: HTMLImageElement = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const scale: number = Math.min(
          1,
          COMPRESS_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const width: number = Math.round(img.naturalWidth * scale);
        const height: number = Math.round(img.naturalHeight * scale);
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas context unavailable'));
          return;
        }
        const isPng: boolean = file.type === 'image/png';
        if (!isPng) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85));
      } catch (err) {
        reject(err instanceof Error ? err : new Error('compress failed'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('image decode failed'));
    };
    img.src = objectUrl;
  });

export const processFile = (file: File): Promise<string> => {
  const compressible: boolean =
    file.size > COMPRESS_SIZE_THRESHOLD &&
    (file.type === 'image/jpeg' || file.type === 'image/png');
  if (!compressible) return readFileAsDataUrl(file);
  return compressToDataUrl(file).catch(() => readFileAsDataUrl(file));
};
