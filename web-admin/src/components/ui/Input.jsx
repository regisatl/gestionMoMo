import React, { useState } from 'react';

const Input = ({
  label, value, onChange, placeholder, type = 'text',
  error, icon, style, required, disabled, name, id,
}) => {
  const [focused, setFocused] = useState(false);

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
        {icon && (
          <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', fontSize: '16px', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          id={id || name}
          name={name}
          type={type}
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
            padding: icon ? '0 14px 0 38px' : '0 14px',
            background: 'var(--input-bg)',
            border: `1.5px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-primary)' : 'var(--input-border)'}`,
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
