import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

// Cuenta de forma animada hacia el valor destino (para saldo, totales, etc.)
export default function AnimatedNumber({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return <>{display.toLocaleString('es', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}</>;
}
