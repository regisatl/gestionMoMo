import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label, value, onChange, placeholder, type = 'text',
  error, icon, style, required, disabled, name, id,
}) => {
  const [focused, setFocused]       = useState(false);
  const [showPwd, setShowPwd]       = useState(false);

  const isPassword = type === 'password';
  // Type effectif de l'<input> : si password et visible → 'text'
  const effectiveType = isPassword ? (showPwd ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label
          htmlFor={id || name}
          style={{ fontFamily: 'var(--font)', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}
        >
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Icône gauche */}
        {icon && (
          <span style={{
            position: 'absolute', left: '12px',
            color: 'var(--text-secondary)', display: 'flex',
            alignItems: 'center', pointerEvents: 'none', lineHeight: 1,
          }}>
            {icon}
          </span>
        )}

        <input
          id={id || name}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: '42px',
            // padding gauche si icône, padding droit si password (place pour l'œil)
            paddingLeft:  icon ? '38px' : '14px',
            paddingRight: isPassword ? '42px' : '14px',
            background: 'var(--input-bg)',
            border: `1.5px solid ${
              error ? 'var(--color-error)'
              : focused ? 'var(--color-primary)'
              : 'var(--input-border)'
            }`,
            borderRadius: '10px',
            fontFamily: 'var(--font)',
            fontSize: '14px',
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.15s',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        {/* Bouton œil — uniquement sur les champs password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            tabIndex={-1}
            aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            style={{
              position: 'absolute', right: '11px',
              background: 'none', border: 'none', padding: '4px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: focused ? 'var(--color-primary)' : 'var(--text-disabled)',
              transition: 'color 0.15s',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = focused ? 'var(--color-primary)' : 'var(--text-disabled)'}
          >
            {showPwd
              ? <EyeOff size={16} strokeWidth={2} />
              : <Eye    size={16} strokeWidth={2} />
            }
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
