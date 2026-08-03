/**
 * Loader.jsx — GestionMoMo Web Admin
 * Animation "réseau MoMo" entièrement CSS, sans CSS custom properties dans les keyframes.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

const KEYFRAMES = `
@keyframes gm-pulse {
  0%,100% { transform:scale(1);    }
  50%      { transform:scale(1.10); }
}
@keyframes gm-wave {
  0%   { transform:scale(0.5); opacity:0.75; }
  100% { transform:scale(2.3); opacity:0;    }
}
@keyframes gm-spin {
  from { transform:rotate(0deg);   }
  to   { transform:rotate(360deg); }
}
@keyframes gm-dot-pop {
  0%,100% { transform:scale(1);   opacity:0.7; }
  50%     { transform:scale(1.5); opacity:1;   }
}
@keyframes gm-travel {
  0%   { stroke-dashoffset:220; opacity:0; }
  8%   { opacity:1; }
  92%  { opacity:1; }
  100% { stroke-dashoffset:0;   opacity:0; }
}
@keyframes gm-blink {
  0%,100% { opacity:1;   }
  50%     { opacity:0.35; }
}
@keyframes gm-fadein {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0);   }
}
@keyframes gm-halo {
  0%,100% { opacity:0.18; transform:scale(1);    }
  50%     { opacity:0.42; transform:scale(1.08); }
}
`;

/* 4 nœuds fixes (positions absolues calculées, pas de keyframes avec vars) */
const NODES = [
  { top: '5px',  left: '65px', color: '#60B4FF', delay: '0s'    },
  { top: '65px', left: '125px',color: '#0A66C2', delay: '0.5s'  },
  { top: '125px',left: '65px', color: '#60B4FF', delay: '1s'    },
  { top: '65px', left: '5px',  color: '#0A66C2', delay: '1.5s'  },
];

/* Les mêmes positions pour les lignes SVG */
const NODE_SVG = [
  { x: 70,  y: 10  },
  { x: 130, y: 70  },
  { x: 70,  y: 130 },
  { x: 10,  y: 70  },
];

const WAVES = [
  { delay: '0s' },
  { delay: '0.65s' },
  { delay: '1.3s' },
];

const Loader = ({ message, overlay = false }) => {
  const { t } = useTranslation();
  // Si message commence par "loader." c'est une clé i18n → on traduit.
  // Sinon on affiche tel quel. Si absent → loader.default.
  const label = message
    ? (message.startsWith('loader.') ? t(message) : message)
    : t('loader.default');

  return (
  <>
    <style>{KEYFRAMES}</style>
    <div style={{
      position: overlay ? 'fixed' : 'relative',
      inset: overlay ? 0 : 'auto',
      zIndex: overlay ? 9999 : 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: overlay ? '100vh' : '220px',
      background: overlay ? 'rgba(255,255,255,0.82)' : 'transparent',
      backdropFilter: overlay ? 'blur(6px)' : 'none',
      animation: 'gm-fadein 0.3s ease',
    }}>

      {/* ── Zone animation 140×140 ── */}
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>

        {/* Ondes concentriques */}
        {WAVES.map((w, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '35px', left: '35px',
            width: '70px', height: '70px',
            borderRadius: '50%',
            border: '1.5px solid #0A66C2',
            animation: `gm-wave 2s ease-out ${w.delay} infinite`,
          }} />
        ))}

        {/* Lignes + particules SVG */}
        <svg width="140" height="140" style={{ position: 'absolute', top: 0, left: 0 }}>
          {NODE_SVG.map((n, i) => (
            <g key={i}>
              {/* Ligne fixe grise */}
              <line x1="70" y1="70" x2={n.x} y2={n.y}
                stroke="rgba(10,102,194,0.13)" strokeWidth="1" />
              {/* Particule voyageuse */}
              <line x1="70" y1="70" x2={n.x} y2={n.y}
                stroke={i % 2 === 0 ? '#60B4FF' : '#0A66C2'}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="220"
                style={{ animation: `gm-travel 2.8s ease-in-out ${NODES[i].delay} infinite` }}
              />
            </g>
          ))}
        </svg>

        {/* Anneau tournant portant les 4 nœuds */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '140px', height: '140px',
          animation: 'gm-spin 4s linear infinite',
        }}>
          {NODES.map((n, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: n.top, left: n.left,
              width: '10px', height: '10px',
              borderRadius: '50%',
              background: n.color,
              boxShadow: `0 0 8px ${n.color}80`,
              animation: `gm-dot-pop 2s ease-in-out ${n.delay} infinite`,
            }} />
          ))}
        </div>

        {/* Halo du logo */}
        <div style={{
          position: 'absolute',
          top: '35px', left: '35px',
          width: '70px', height: '70px',
          borderRadius: '20px',
          background: '#0A66C2',
          animation: 'gm-halo 2s ease-in-out infinite',
        }} />

        {/* Logo central */}
        <div style={{
          position: 'absolute',
          top: '40px', left: '40px',
          width: '60px', height: '60px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg,#0A66C2,#0A3A6B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 3px rgba(10,102,194,0.18), 0 8px 24px rgba(10,102,194,0.4)',
          animation: 'gm-pulse 2s ease-in-out infinite',
        }}>
          <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
            {/* M */}
            <path d="M10 46 L10 18 L26 38 L42 18 L42 46"
              stroke="white" strokeWidth="5.5"
              strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            {/* Point accent */}
            <circle cx="50" cy="32" r="6.5" fill="#60B4FF"/>
            <circle cx="50" cy="32" r="3"   fill="white"/>
          </svg>
        </div>
      </div>

      {/* ── Texte ── */}
      <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <span style={{
          fontFamily: 'Manrope, var(--font, sans-serif)',
          fontWeight: 800, fontSize: '15px',
          color: 'var(--text, #111)',
          letterSpacing: '0.2px',
        }}>
          GestionMoMo
        </span>

        {label && (
          <span style={{
            fontFamily: 'Manrope, var(--font, sans-serif)',
            fontSize: '12px',
            color: 'var(--text-secondary, #6B7280)',
            animation: 'gm-blink 1.8s ease-in-out infinite',
          }}>
            {label}
          </span>
        )}

        {/* Points rebondissants */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: '5px', height: '5px',
              borderRadius: '50%',
              background: '#0A66C2',
              animation: `gm-dot-pop 1.4s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  </>
  );
};

export default Loader;
