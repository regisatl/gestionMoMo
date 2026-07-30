import React from 'react';

const styles = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', borderRadius: '10px', fontFamily: 'var(--font)',
    fontWeight: 600, cursor: 'pointer', border: 'none',
    transition: 'opacity 0.15s, transform 0.1s',
    whiteSpace: 'nowrap', letterSpacing: '0.2px',
  },
  variants: {
    primary:   { background: 'var(--color-primary)',       color: '#fff' },
    secondary: { background: 'var(--surface)',             color: 'var(--text)',             border: '1px solid var(--border)' },
    outline:   { background: 'transparent',                color: 'var(--color-primary)',    border: '1.5px solid var(--color-primary)' },
    ghost:     { background: 'transparent',                color: 'var(--color-primary)' },
    danger:    { background: 'var(--color-error)',         color: '#fff' },
    success:   { background: 'var(--color-success)',       color: '#fff' },
  },
  sizes: {
    sm: { fontSize: '12px', padding: '6px 12px', height: '32px' },
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
      {loading ? <span style={{ fontSize: '14px' }}>⏳</span> : icon}
      {children}
    </button>
  );
};

export default Button;
