import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, ArrowLeftRight, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_CONFIG = {
  success:     { icon: CheckCircle,    bg: 'var(--toast-success-bg)',     border: 'var(--toast-success-border)', text: 'var(--toast-success-text)' },
  error:       { icon: XCircle,        bg: 'var(--toast-error-bg)',       border: 'var(--toast-error-border)',   text: 'var(--toast-error-text)' },
  warning:     { icon: AlertTriangle,  bg: 'var(--toast-warning-bg)',     border: 'var(--toast-warning-border)', text: 'var(--toast-warning-text)' },
  info:        { icon: Info,           bg: 'var(--toast-info-bg)',        border: 'var(--toast-info-border)',    text: 'var(--toast-info-text)' },
  transaction: { icon: ArrowLeftRight, bg: 'var(--toast-info-bg)',        border: 'var(--toast-info-border)',    text: 'var(--toast-info-text)' },
};

const ToastItem = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 220);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `4px solid ${cfg.border}`,
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        width: '360px',
        maxWidth: 'calc(100vw - 48px)',
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
      }}
    >
      {/* Icône */}
      <Icon
        size={20}
        strokeWidth={2}
        color={cfg.border}
        style={{ flexShrink: 0, marginTop: '1px' }}
      />

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px',
          color: cfg.text, lineHeight: '1.4',
        }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{
            fontFamily: 'var(--font)', fontWeight: 400, fontSize: '12px',
            color: cfg.text, opacity: 0.75, marginTop: '3px', lineHeight: '1.4',
          }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Fermer */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px', flexShrink: 0, color: cfg.text, opacity: 0.5,
          display: 'flex', alignItems: 'center',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
