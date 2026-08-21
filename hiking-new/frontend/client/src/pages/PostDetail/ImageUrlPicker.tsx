import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { Camera, ImagePlus, Upload, X } from 'lucide-react';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from './image-process';
import { upload } from '@client/src/api';

interface ImageUrlPickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  compact?: boolean;
  allowUrl?: boolean;
}

const PRESET_IMAGES: string[] = [
  '/img/首页.jpeg',
  '/img/徒步装备.avif',
  '/img/四姑娘山.jpg',
  '/img/雨崩村.webp',
  '/img/虎跳峡.jpg',
  '/img/黄山.jpg',
  '/img/香山.jpeg',
  '/img/喀纳斯.jpg',
];

const ImageUrlPicker: React.FC<ImageUrlPickerProps> = ({
  value,
  onChange,
  maxFiles = 9,
  compact = false,
  allowUrl = true,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPresets, setShowPresets] = useState<boolean>(false);

  const addUrl = (): void => {
    const url: string = urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorMsg('请输入有效的图片链接');
      return;
    }
    if (value.length >= maxFiles) {
      setErrorMsg(`最多只能添加 ${maxFiles} 张图片`);
      return;
    }
    setErrorMsg('');
    onChange([...value, url]);
    setUrlInput('');
  };

  const addPreset = (path: string): void => {
    if (value.length >= maxFiles) {
      setErrorMsg(`最多只能添加 ${maxFiles} 张图片`);
      return;
    }
    setErrorMsg('');
    onChange([...value, withBasePath(path)]);
  };

  const removeImage = (index: number): void => {
    const next: string[] = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  const processFiles = useCallback(
    (files: File[]) => {
      const remaining: number = maxFiles - value.length;
      if (remaining <= 0) {
        toast.error(`最多只能添加 ${maxFiles} 张图片`);
        return;
      }
      if (files.length > remaining) {
        toast.error(`最多只能添加 ${maxFiles} 张图片`);
      }
      const sliced: File[] = files.slice(0, remaining);
      if (sliced.length === 0) return;
      upload(sliced)
        .then((data: { urls: string[] }) => onChange([...value, ...(data.urls || [])]))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : '上传失败，请重试')
        );
    },
    [value, maxFiles, onChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.some((r: FileRejection) => r.errors.some(e => e.code === 'file-too-large'))) {
        toast.error('图片大小不能超过 5MB');
      }
      if (fileRejections.some((r: FileRejection) => r.errors.some(e => e.code === 'file-invalid-type'))) {
        toast.error('仅支持 JPG、PNG、WebP、GIF 格式');
      }
      processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const captureInputRef = useRef<HTMLInputElement | null>(null);

  const handleCaptureChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files: File[] = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length > 0) processFiles(files);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: maxFiles > 1,
    disabled: value.length >= maxFiles,
  });

  const previewGrid: React.ReactNode =
    value.length > 0 ? (
      <div className={compact ? 'grid grid-cols-1 gap-3 mb-3' : 'grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3'}>
        {value.map((url: string, i: number) => (
          <div
            key={i}
            className={
              compact
                ? 'relative group rounded-lg overflow-hidden bg-muted max-w-[200px]'
                : 'relative group rounded-lg overflow-hidden bg-muted aspect-square'
            }
          >
            <Image src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-ink/50 hover:bg-destructive text-paper rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all before:absolute before:-inset-2 before:content-['']"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    ) : null;

  const urlRow: React.ReactNode = allowUrl ? (
    <div className={compact ? 'mt-3' : 'mt-4'}>
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrlInput(e.target.value)}
          type="text"
          placeholder="或粘贴图片链接..."
          className="flex-1 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim()}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-pine-300 disabled:opacity-50"
        >
          添加
        </button>
      </div>
    </div>
  ) : null;

  const presetBlock: React.ReactNode = (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setShowPresets((v: boolean) => !v)}
        className="inline-block py-2 -my-2 text-xs text-muted-foreground transition-colors hover:text-pine-600"
      >
        {showPresets ? '收起预设图片 ▲' : '从预设图片中选择 ▼'}
      </button>
      {showPresets && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {PRESET_IMAGES.map((path: string) => (
            <button
              key={path}
              type="button"
              onClick={() => addPreset(path)}
              className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-pine-500 transition-colors"
            >
              <Image src={withBasePath(path)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="image-uploader">
        {previewGrid}
        {value.length < maxFiles && (
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-pine-300 px-3 text-xs text-pine-700 transition-colors hover:border-pine-500 hover:bg-pine-50">
            <input {...getInputProps()} className="sr-only" />
            <ImagePlus size={14} />
            从相册/文件选择图片
          </label>
        )}
        {urlRow}
        {presetBlock}
        {errorMsg && <p className="text-xs text-destructive mt-2">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div>
      {previewGrid}
      {value.length < maxFiles ? (
        <>
        <div
          {...getRootProps({
            className: `hidden md:block rounded-2xl border-2 border-dashed px-6 py-10 md:py-14 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-pine-500 bg-pine-50'
                : 'border-pine-300/60 bg-muted/30 hover:border-pine-400'
            }`,
          })}
        >
          <input {...getInputProps()} />
          <ImagePlus size={40} className="mx-auto text-muted-foreground/50" strokeWidth={1.5} />
          <p className="mt-4 text-sm md:text-base text-muted-foreground">
            点击选择或拖拽图片到此处
          </p>
          <p className="mt-1.5 text-xs md:text-sm text-muted-foreground/70">
            支持 JPG、PNG、WebP、GIF，单张不超过 5MB，最多 {maxFiles} 张
          </p>
        </div>
        <input
          ref={captureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple={maxFiles > 1}
          className="hidden"
          onChange={handleCaptureChange}
        />
        <div className="md:hidden flex gap-2">
          <button
            type="button"
            onClick={() => open()}
            className="flex-1 min-h-11 rounded-lg bg-pine-700 text-paper text-sm font-medium flex items-center justify-center gap-2 active:bg-pine-800"
          >
            <Upload size={18} />
            上传图片
          </button>
          <button
            type="button"
            onClick={() => captureInputRef.current?.click()}
            className="flex-1 min-h-11 rounded-lg border border-border bg-card text-sm font-medium text-ink flex items-center justify-center gap-2 active:bg-muted"
          >
            <Camera size={18} />
            拍摄照片
          </button>
        </div>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-6 py-4 text-center text-xs text-muted-foreground/70">
          已达到最大图片数量
        </p>
      )}
      {urlRow}
      {presetBlock}
      {errorMsg && <p className="text-xs text-destructive mt-2">{errorMsg}</p>}
    </div>
  );
};

export default ImageUrlPicker;
