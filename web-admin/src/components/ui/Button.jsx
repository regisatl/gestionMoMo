import React from 'react';

/* ── Spinner SVG inline — animé en CSS, aucune dépendance ── */
const SPIN_KEYFRAMES = `
@keyframes btn-spin {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}
`;

const Spinner = ({ size = 15, color = 'currentColor' }) => (
  <>
    <style>{SPIN_KEYFRAMES}</style>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'btn-spin 0.75s linear infinite', flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Arc de fond */}
      <circle
        cx="12" cy="12" r="9"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      {/* Arc animé */}
      <path
        d="M12 3 a9 9 0 0 1 9 9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  </>
);

const styles = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', borderRadius: '10px', fontFamily: 'var(--font)',
    fontWeight: 600, cursor: 'pointer', border: 'none',
    transition: 'opacity 0.15s, transform 0.1s',
    whiteSpace: 'nowrap', letterSpacing: '0.2px',
  },
  variants: {
    primary:   { background: 'var(--color-primary)',   color: '#fff' },
    secondary: { background: 'var(--surface)',         color: 'var(--text)',          border: '1px solid var(--border)' },
    outline:   { background: 'transparent',            color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)' },
    ghost:     { background: 'transparent',            color: 'var(--color-primary)' },
    danger:    { background: 'var(--color-error)',     color: '#fff' },
    success:   { background: 'var(--color-success)',   color: '#fff' },
  },
  sizes: {
    sm: { fontSize: '12px', padding: '6px 12px',  height: '32px' },
    md: { fontSize: '14px', padding: '8px 16px',  height: '38px' },
    lg: { fontSize: '15px', padding: '10px 22px', height: '44px' },
  },
};

const Button = ({
  children, onClick, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
  icon, type = 'button', style, ...props
}) => {
  const isDisabled = disabled || loading;

  /* Couleur du spinner selon la variante */
  const spinnerColor = ['primary', 'danger', 'success'].includes(variant) ? '#fff' : 'var(--color-primary)';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...styles.base,
        ...styles.variants[variant],
        ...styles.sizes[size],
        ...(fullWidth && { width: '100%' }),
        ...(isDisabled && { opacity: 0.55, cursor: 'not-allowed' }),
        ...style,
      }}
      onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      onMouseDown={(e) => { if (!isDisabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      {...props}
    >
      {loading ? <Spinner size={parseInt(styles.sizes[size].fontSize) + 2} color={spinnerColor} /> : icon}
      {children}
    </button>
  );
};

export default Button;
