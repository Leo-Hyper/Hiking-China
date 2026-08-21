import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

const CountUpNumber = ({
  value,
  decimals = 0,
  duration = 1.4,
  className,
}: CountUpNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState<string>(() =>
    reducedMotion ? value.toFixed(decimals) : (0).toFixed(decimals),
  );

  useEffect(() => {
    if (!inView) return undefined;
    if (reducedMotion) {
      setDisplay(value.toFixed(decimals));
      return undefined;
    }
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest: number) => setDisplay(latest.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, reducedMotion, value, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};

export default CountUpNumber;
