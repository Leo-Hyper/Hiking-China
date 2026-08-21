'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  motion,
  useSpring,
  useTransform,
  type SpringOptions,
} from 'framer-motion';

interface SpotlightProps {
  className?: string;
  fill?: string;
  size?: number;
  springOptions?: SpringOptions;
}

function Spotlight({
  className,
  fill = 'white',
  size = 200,
  springOptions = { bounce: 0 },
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);

  const spotlightLeft = useTransform(
    mouseX,
    (x: number) => `${x - size / 2}px`,
  );
  const spotlightTop = useTransform(mouseY, (y: number) => `${y - size / 2}px`);

  useEffect(() => {
    if (containerRef.current) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.style.overflow = 'hidden';
        setParentElement(parent);
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!parentElement) return;
      const { left, top } = parentElement.getBoundingClientRect();
      mouseX.set(event.clientX - left);
      mouseY.set(event.clientY - top);
    },
    [mouseX, mouseY, parentElement],
  );

  useEffect(() => {
    if (!parentElement) return;

    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);

    parentElement.addEventListener('mousemove', handleMouseMove);
    parentElement.addEventListener('mouseenter', handleEnter);
    parentElement.addEventListener('mouseleave', handleLeave);

    return () => {
      parentElement.removeEventListener('mousemove', handleMouseMove);
      parentElement.removeEventListener('mouseenter', handleEnter);
      parentElement.removeEventListener('mouseleave', handleLeave);
    };
  }, [parentElement, handleMouseMove]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute rounded-full blur-xl transition-opacity duration-200',
        isHovered ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={{
        width: size,
        height: size,
        left: spotlightLeft,
        top: spotlightTop,
        background: `radial-gradient(circle at center, ${fill}, transparent 80%)`,
      }}
    />
  );
}

export { Spotlight };
export type { SpotlightProps };
