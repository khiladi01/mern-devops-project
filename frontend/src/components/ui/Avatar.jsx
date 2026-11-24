import { useEffect, useState } from 'react';
import { initials } from '../../utils/format';

// Soft tinted fallbacks, picked deterministically from the person's name.
const TINTS = [
  'bg-brand-100 text-brand-800',
  'bg-[#fde6dc] text-[#9a3c14]',
  'bg-[#d9f2e8] text-[#0d6b49]',
  'bg-[#fbeccb] text-[#7a5200]',
  'bg-[#f8dfe9] text-[#8f2c58]',
  'bg-[#e4e0fa] text-[#40329a]',
];

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

const hash = (s = '') => [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

/**
 * Initials are always rendered underneath; the photo fades in on top once it
 * has loaded. A slow or broken image therefore never leaves an empty circle.
 */
export default function Avatar({ name, src, size = 'md', className = '' }) {
  const [state, setState] = useState('loading'); // loading | loaded | failed

  useEffect(() => setState('loading'), [src]);

  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold ${TINTS[hash(name) % TINTS.length]} ${SIZES[size]} ${className}`}
    >
      {initials(name)}
      {src && state !== 'failed' && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  );
}
