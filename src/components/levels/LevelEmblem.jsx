import { useId } from 'react';

/**
 * Emblemas de nivel dibujados a medida (SVG), con la estética de
 * KoreManager: hexágono de "placa" deportiva, pelota con costura, galones
 * que se suman con cada nivel, estrella de veterano y laureles de leyenda.
 * Dibuja con `currentColor`, así que el color lo pone el contenedor.
 *
 * @param {{ tier: 0|1|2|3|4|5, size?: number, locked?: boolean, className?: string, title?: string }} props
 */
export default function LevelEmblem({ tier = 0, size = 48, locked = false, className = '', title }) {
  const uid = useId().replace(/:/g, '');
  const grad = `lvl-grad-${uid}`;
  const shine = `lvl-shine-${uid}`;
  const legend = tier >= 5 && !locked;
  const chevrons = Math.max(0, Math.min(3, tier - 1)); // 0..3 galones
  const HEX = 'M32 3.5 56.7 17.75v28.5L32 60.5 7.3 46.25v-28.5Z';

  // Posición de la pelota: centrada en niveles bajos, sube cuando hay galones
  const ballY = tier >= 4 ? 27 : chevrons ? 24 : 31;
  const ballR = tier >= 4 ? 7 : chevrons ? 8.5 : 11;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${className} ${locked ? 'opacity-40 grayscale' : ''}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={grad} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8A2BE2" />
          <stop offset="1" stopColor="#CCFF00" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Placa */}
      {legend ? (
        <>
          <path d={HEX} fill="#0F0F1A" />
          <path d={HEX} fill={`url(#${grad})`} fillOpacity=".22" />
          <path d={HEX} fill={`url(#${shine})`} />
        </>
      ) : (
        <path d={HEX} fill="currentColor" fillOpacity={tier === 0 ? 0.04 : 0.12} />
      )}
      <path
        d={HEX}
        stroke={legend ? `url(#${grad})` : 'currentColor'}
        strokeWidth={legend ? 3.5 : 2.5}
        strokeDasharray={tier === 0 ? '5 4' : undefined}
      />
      {tier >= 3 && !legend && <path d="M32 9 51.6 20.3v23.4L32 55 12.4 43.7V20.3Z" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.2" />}

      {/* Laureles de leyenda */}
      {legend && (
        <g fill="#CCFF00">
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <ellipse cx={15 + i * 1.2} cy={40 - i * 7} rx="3.2" ry="1.6" transform={`rotate(${-50 + i * 12} ${15 + i * 1.2} ${40 - i * 7})`} />
              <ellipse cx={49 - i * 1.2} cy={40 - i * 7} rx="3.2" ry="1.6" transform={`rotate(${50 - i * 12} ${49 - i * 1.2} ${40 - i * 7})`} />
            </g>
          ))}
        </g>
      )}

      {/* Nivel 0: silueta vacía */}
      {tier === 0 && (
        <g stroke="currentColor" strokeWidth="2.5">
          <circle cx="32" cy="26" r="6" />
          <path d="M21 44c1.8-6 6-9 11-9s9.2 3 11 9" />
        </g>
      )}

      {/* Pelota con costura */}
      {tier >= 1 && (
        <g stroke={legend ? '#0F0F1A' : 'currentColor'} strokeWidth={legend ? 2 : 2.5}>
          <circle cx="32" cy={ballY} r={ballR} fill={legend ? '#CCFF00' : 'currentColor'} fillOpacity={legend ? 1 : 0.18} stroke={legend ? '#CCFF00' : 'currentColor'} />
          <path d={`M${32 - ballR * 0.92} ${ballY - ballR * 0.35}c${ballR * 0.7} ${ballR * 0.25} ${ballR * 0.95} ${ballR * 0.75} ${ballR * 0.85} ${ballR * 1.25}`} />
          <path d={`M${32 + ballR * 0.92} ${ballY + ballR * 0.35}c${-ballR * 0.7} ${-ballR * 0.25} ${-ballR * 0.95} ${-ballR * 0.75} ${-ballR * 0.85} ${-ballR * 1.25}`} />
        </g>
      )}

      {/* Galones */}
      {Array.from({ length: legend ? 0 : chevrons }, (_, i) => (
        <path
          key={i}
          d={`M22 ${37 + i * 5.5} 32 ${42 + i * 5.5} 42 ${37 + i * 5.5}`}
          stroke="currentColor"
          strokeWidth="3"
        />
      ))}

      {/* Estrella de veterano / corona de leyenda */}
      {tier === 4 && (
        <path d="M32 8.5l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5Z" fill="currentColor" />
      )}
      {tier >= 5 && (
        <g>
          <path d="M23 50.5h18l1.8-7-5.3 3.3L32 40.5l-5.5 6.3-5.3-3.3Z" fill={legend ? `url(#${grad})` : 'currentColor'} fillOpacity={legend ? 1 : 0.5} stroke={legend ? 'none' : 'currentColor'} strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
