import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ImageProps extends React.ComponentPropsWithoutRef<'img'> {
  loading?: 'eager' | 'lazy';
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      alt = '',
      className,
      loading = 'lazy',
      decoding = 'async',
      ...props
    },
    ref,
  ) => (
    <img
      {...props}
      ref={ref}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cn('bg-muted/30', className)}
    />
  ),
);

Image.displayName = 'Image';

export default Image;
