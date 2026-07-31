import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Tooltip — GestionMoMo
 *
 * Usage :
 *   <Tooltip content="Mon texte">
 *     <button>Hover me</button>
 *   </Tooltip>
 *
 * Props :
 *   content      {string|ReactNode}  Texte ou JSX affiché dans le tooltip
 *   placement    {'top'|'bottom'|'left'|'right'}  Défaut : 'top'
 *   delay        {number}  Délai avant affichage en ms (défaut : 300)
 *   disabled     {boolean} Désactive le tooltip
 *   maxWidth     {number}  Largeur max en px (défaut : 220)
 */
const Tooltip = ({
  children,
  content,
  placement = 'top',
  delay = 300,
  disabled = false,
  maxWidth = 220,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [ready, setReady] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timerRef = useRef(null);
  const GAP = 8; // espace entre trigger et tooltip

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Calcule la position idéale selon le placement voulu
    const positions = {
      top: {
        top:  triggerRect.top  + scrollY - tooltipRect.height - GAP,
        left: triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2,
      },
      bottom: {
        top:  triggerRect.bottom + scrollY + GAP,
        left: triggerRect.left   + scrollX + triggerRect.width / 2 - tooltipRect.width / 2,
      },
      left: {
        top:  triggerRect.top  + scrollY + triggerRect.height / 2 - tooltipRect.height / 2,
        left: triggerRect.left + scrollX - tooltipRect.width - GAP,
      },
      right: {
        top:  triggerRect.top   + scrollY + triggerRect.height / 2 - tooltipRect.height / 2,
        left: triggerRect.right + scrollX + GAP,
      },
    };

    // Fallback si débordement de viewport
    let chosen = placement;
    const p = positions[placement];
    if (placement === 'top'    && p.top < scrollY)           chosen = 'bottom';
    if (placement === 'bottom' && p.top + tooltipRect.height > scrollY + vh) chosen = 'top';
    if (placement === 'left'   && p.left < scrollX)          chosen = 'right';
    if (placement === 'right'  && p.left + tooltipRect.width > scrollX + vw) chosen = 'left';

    const final = { ...positions[chosen] };

    // Clamp horizontal : s'assure que le tooltip reste dans le viewport
    // Priorité au bord droit (cas du bouton notifications en bout de header)
    const rightEdge = scrollX + vw - tooltipRect.width - 8;
    const leftEdge  = scrollX + 8;
    final.left = Math.max(leftEdge, Math.min(final.left, rightEdge));

    // Clamp vertical
    final.top = Math.max(scrollY + 8, Math.min(final.top, scrollY + vh - tooltipRect.height - 8));

    setActualPlacement(chosen);
    setCoords(final);
    setReady(true);
  }, [placement]);

  const show = useCallback(() => {
    if (disabled || !content) return;
    timerRef.current = setTimeout(() => {
      setVisible(true);
      // Double rAF : 1er frame = rendu DOM, 2e frame = layout disponible
      requestAnimationFrame(() => {
        requestAnimationFrame(() => computePosition());
      });
    }, delay);
  }, [disabled, content, delay, computePosition]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
    setReady(false);
  }, []);

  // Recalcul si resize/scroll
  useEffect(() => {
    if (!visible) return;
    const recalc = () => computePosition();
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [visible, computePosition]);

  // Cleanup timer au démontage
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!content || disabled) {
    return <>{children}</>;
  }

  // Styles de la flèche selon placement
  const arrowStyles = {
    top: {
      bottom: '-5px', left: '50%', transform: 'translateX(-50%)',
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderTop: '5px solid var(--tooltip-bg)',
    },
    bottom: {
      top: '-5px', left: '50%', transform: 'translateX(-50%)',
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderBottom: '5px solid var(--tooltip-bg)',
    },
    left: {
      right: '-5px', top: '50%', transform: 'translateY(-50%)',
      borderTop: '5px solid transparent',
      borderBottom: '5px solid transparent',
      borderLeft: '5px solid var(--tooltip-bg)',
    },
    right: {
      left: '-5px', top: '50%', transform: 'translateY(-50%)',
      borderTop: '5px solid transparent',
      borderBottom: '5px solid transparent',
      borderRight: '5px solid var(--tooltip-bg)',
    },
  };

  return (
    <>
      {/* Trigger — clone l'enfant avec les gestionnaires d'événements */}
      {React.cloneElement(React.Children.only(children), {
        ref: triggerRef,
        onMouseEnter: (e) => {
          show();
          children.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          hide();
          children.props.onMouseLeave?.(e);
        },
        onFocus: (e) => {
          show();
          children.props.onFocus?.(e);
        },
        onBlur: (e) => {
          hide();
          children.props.onBlur?.(e);
        },
      })}

      {/* Tooltip portal-like : position fixed dans le document */}
      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            maxWidth: `${maxWidth}px`,
            padding: '6px 10px',
            background: 'var(--tooltip-bg)',
            color: 'var(--tooltip-text)',
            borderRadius: '7px',
            fontSize: '12px',
            fontFamily: 'var(--font)',
            fontWeight: 500,
            lineHeight: 1.45,
            letterSpacing: '0.2px',
            boxShadow: 'var(--tooltip-shadow)',
            pointerEvents: 'none',
            border: '1px solid var(--tooltip-border)',
            wordBreak: 'break-word',
            // Caché jusqu'au 2e frame (position calculée), puis animation
            opacity: ready ? 1 : 0,
            animation: ready ? 'tooltipFadeIn 0.15s ease' : 'none',
          }}
        >
          {/* Flèche */}
          <span
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              ...arrowStyles[actualPlacement],
            }}
          />
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip;
