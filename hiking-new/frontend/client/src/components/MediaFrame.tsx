import type { ReactNode } from 'react';

interface MediaFrameProps {
  src?: string;
  alt: string;
  ratioClassName?: string;
  position?: string;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  children?: ReactNode;
}

const MediaFrame = ({
  src,
  alt,
  ratioClassName = 'aspect-[16/10]',
  position = 'center 42%',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  onClick,
  children,
}: MediaFrameProps) => {
  const interactive = typeof onClick === 'function';

  return (
    <div
      className={`relative overflow-hidden bg-muted ${ratioClassName} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') onClick?.();
            }
          : undefined
      }
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          className={`h-full w-full object-cover ${imgClassName}`}
          style={{ objectPosition: position }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-pine-100 to-pine-50 text-xs text-muted-foreground">
          暂无图片
        </div>
      )}
      {children}
    </div>
  );
};

export default MediaFrame;
