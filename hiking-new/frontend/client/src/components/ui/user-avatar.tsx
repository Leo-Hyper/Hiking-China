import * as React from 'react';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@client/src/utils/base-path';
import { Image } from './image';

interface UserAvatarProps {
  src?: string;
  name?: string;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

const LEGACY_PLACEHOLDER_HOST = 'bytednsdoc.com';

function isLegacyPlaceholder(src?: string): boolean {
  return !!src && src.includes(LEGACY_PLACEHOLDER_HOST);
}

export function UserAvatar({
  src,
  name,
  className,
  fallbackClassName,
  alt = '',
}: UserAvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const usableSrc = src && !isLegacyPlaceholder(src) ? resolveImageUrl(src) : '';
  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  if (!usableSrc || failed) {
    return (
      <span
        aria-label={name || '用户头像'}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-pine-600 font-semibold text-paper',
          'text-[0.7em]',
          fallbackClassName,
          className,
        )}
      >
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={usableSrc}
      alt={alt}
      className={cn('shrink-0 rounded-full object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
