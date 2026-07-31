/**
 * PlexusBackground — Web Admin
 *
 * Animated network / plexus illustration rendered with inline SVG + CSS animations.
 * No external dependencies — uses requestAnimationFrame for smooth drift.
 *
 * Color logic (same rule as the mobile version):
 *   light mode → dark nodes & lines  (like the reference screenshot)
 *   dark mode  → light nodes & lines (inverted)
 *
 * Rendered as position:fixed / absolute behind all content.
 * pointer-events: none — fully non-interactive.
 */

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/* ── Configuration ─────────────────────────────────────────────── */
const NODE_COUNT      = 42;
const CONNECTION_DIST = 160;   // px — max distance to draw a line
const NODE_SPEED      = 0.18;  // px per frame — drift speed

/* Seeded pseudo-random for stable initial layout */
function mulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNodes(w, h, seed = 99) {
  const rand = mulberry32(seed);
  return Array.from({ length: NODE_COUNT }, () => {
    const vx = (rand() - 0.5) * 2 * NODE_SPEED;
    const vy = (rand() - 0.5) * 2 * NODE_SPEED;
    return {
      /* Bias nodes toward the right side, same aesthetic as screenshot */
      x:  w * 0.25 + rand() * w * 0.76,
      y:  rand() * h,
      r:  2 + rand() * 5,
      vx: vx === 0 ? NODE_SPEED : vx,
      vy: vy === 0 ? NODE_SPEED : vy,
    };
  });
}

/* ── Component ─────────────────────────────────────────────────── */
const PlexusBackground = ({ fixed = false }) => {
  const { isDark } = useTheme();
  const canvasRef  = useRef(null);
  const nodesRef   = useRef(null);
  const rafRef     = useRef(null);

  /* Colors derived from theme — same logic as mobile */
  const nodeColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(25,25,25,0.20)';
  const lineColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,15,15,0.09)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* Size canvas to its CSS container */
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      /* Re-initialise nodes on resize so they stay inside bounds */
      nodesRef.current = buildNodes(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* Animation loop */
    const tick = () => {
      const { width: w, height: h } = canvas;
      const nodes = nodesRef.current;
      if (!nodes) return;

      ctx.clearRect(0, 0, w, h);

      /* Move nodes — bounce off walls */
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
      }

      /* Draw lines */
      ctx.strokeStyle = lineColor;
      ctx.lineWidth   = 0.9;
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const dx = nodes[a].x - nodes[b].x;
          const dy = nodes[a].y - nodes[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            /* Fade line opacity with distance */
            const alpha = 1 - dist / CONNECTION_DIST;
            ctx.globalAlpha = alpha * (isDark ? 0.5 : 0.4);
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }

      /* Draw nodes */
      ctx.globalAlpha = 1;
      ctx.fillStyle   = nodeColor;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [isDark, nodeColor, lineColor]); /* Re-run when theme flips */

  const positionStyle = fixed
    ? { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }
    : { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' };

  return (
    <canvas
      ref={canvasRef}
      style={{
        ...positionStyle,
        width:  '100%',
        height: '100%',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
};

export default PlexusBackground;
