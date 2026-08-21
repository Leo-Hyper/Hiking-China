import React from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, X } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { ACCEPTED_TYPES, MAX_FILE_SIZE, processFile } from './image-process';

interface CommentImageControlProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

const CommentImageControl: React.FC<CommentImageControlProps> = ({ value, onChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file: File | undefined = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!Object.prototype.hasOwnProperty.call(ACCEPTED_TYPES, file.type)) {
      toast.error('仅支持 JPG、PNG、WebP、GIF 格式');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('图片大小不能超过 5MB');
      return;
    }
    processFile(file)
      .then((dataUrl: string) => onChange([dataUrl]))
      .catch(() => toast.error('图片读取失败，请重试'));
  };

  if (value.length > 0) {
    return (
      <div className="relative inline-block rounded-lg overflow-hidden bg-muted">
        <Image src={value[0]} alt="" className="h-10 w-10 object-cover" />
        <button
          type="button"
          onClick={() => onChange([])}
          className="absolute top-0.5 right-0.5 w-5 h-5 bg-ink/50 hover:bg-destructive text-paper rounded-full flex items-center justify-center transition-colors"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <label className="inline-flex min-h-7 cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-pine-700">
      <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
      <ImageIcon size={14} />
      图片
    </label>
  );
};

export default CommentImageControl;
