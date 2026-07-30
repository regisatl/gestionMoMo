import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_STYLES = {
  success:     { bg: '#DCFCE7', border: '#16A34A', text: '#14532D', icon: '✓' },
  error:       { bg: '#FEE2E2', border: '#DC2626', text: '#7F1D1D', icon: '✕' },
  warning:     { bg: '#FEF3C7', border: '#D97706', text: '#78350F', icon: '!' },
  info:        { bg: '#E0F2FE', border: '#0284C7', text: '#0C4A6E', icon: 'i' },
  transaction: { bg: '#EFF6FF', border: '#0A66C2', text: '#1E3A5F', icon: '↔' },
};

const ToastItem = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const s = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        background: s.bg, borderLeft: `4px solid ${s.border}`,
        borderRadius: '10px', padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        maxWidth: '360px', width: '100%',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
        marginBottom: '8px',
      }}
    >
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        background: s.border, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, flexShrink: 0,
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px', color: s.text }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontFamily: 'var(--font)', fontWeight: 400, fontSize: '12px', color: s.text, opacity: 0.8, marginTop: '2px' }}>
            {toast.message}
          </div>
        )}
      </div>
      <button onClick={dismiss} style={{ color: s.text, opacity: 0.5, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>
        ✕
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      zIndex: 9999, display: 'flex', flexDirection: 'column-reverse',
      alignItems: 'flex-end',
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
