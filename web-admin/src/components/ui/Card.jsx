import React from 'react';

const Card = ({ children, style, padding = '20px', title, action }) => (
  <div
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding,
      boxShadow: '0 1px 4px var(--shadow)',
      transition: 'background var(--transition)',
      ...style,
    }}
  >
    {title && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
          {title}
        </h3>
        {action}
      </div>
    )}
    {children}
  </div>
);

export default Card;
