/**
 * Modal — Web Admin
 *
 * Reusable modal dialog with:
 *   - PlexusBackground rendered inside the full-screen overlay
 *   - Fade + scale-up entrance animation (CSS keyframes via style tag)
 *   - Backdrop click closes the modal
 *   - Optional title + close button in header
 *   - Keyboard: Escape closes the modal
 *
 * Usage:
 *   <Modal open={show} onClose={() => setShow(false)} title="Nouveau marchand">
 *     ...content...
 *   </Modal>
 *
 * Props:
 *   open     boolean   — visibility
 *   onClose  function  — close handler
 *   title    string    — optional header title
 *   width    number    — card width in px (default 480)
 *   children node      — modal body content
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PlexusBackground from './PlexusBackground';

const ANIM_STYLE = `
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);   }
}
@keyframes backdropIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

const Modal = ({ open, onClose, title, width = 480, children }) => {
  const cardRef = useRef(null);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* Trap focus inside modal when open */
  useEffect(() => {
    if (open && cardRef.current) {
      cardRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Inject animation keyframes once */}
      <style>{ANIM_STYLE}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
          animation: 'backdropIn 0.18s ease forwards',
        }}
      >
        {/* Plexus behind the card */}
        <PlexusBackground />

        {/* Card — stop backdrop click propagation */}
        <div
          ref={cardRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: `${width}px`,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            outline: 'none',
            animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          {(title || onClose) && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}>
              {title && (
                <h2 style={{
                  margin: 0, fontFamily: 'var(--font)',
                  fontWeight: 700, fontSize: '16px', color: 'var(--text)',
                }}>
                  {title}
                </h2>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '30px', height: '30px', borderRadius: '8px',
                    border: 'none', background: 'var(--surface)',
                    cursor: 'pointer', color: 'var(--text-secondary)',
                    transition: 'background 0.12s, color 0.12s',
                    marginLeft: 'auto',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div style={{ padding: '20px' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
