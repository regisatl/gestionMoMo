import React from 'react';

const COLORS = {
  completed:  { bg: '#DCFCE7', color: '#16A34A' },
  pending:    { bg: '#FEF3C7', color: '#D97706' },
  processing: { bg: '#DBEAFE', color: '#2563EB' },
  failed:     { bg: '#FEE2E2', color: '#DC2626' },
  cancelled:  { bg: '#F3F4F6', color: '#6B7280' },
  active:     { bg: '#DCFCE7', color: '#16A34A' },
  inactive:   { bg: '#F3F4F6', color: '#6B7280' },
  suspended:  { bg: '#FEE2E2', color: '#DC2626' },
  pending_v:  { bg: '#FEF3C7', color: '#D97706' },
  merchant:   { bg: '#EFF6FF', color: '#0A66C2' },
  super_admin:{ bg: '#F5F3FF', color: '#7C3AED' },
  client:     { bg: '#F0FDF4', color: '#16A34A' },
};

const LABELS = {
  completed: 'Complété', pending: 'En attente', processing: 'En cours',
  failed: 'Échoué', cancelled: 'Annulé', active: 'Actif',
  inactive: 'Inactif', suspended: 'Suspendu',
  merchant: 'Marchand', super_admin: 'Super Admin', client: 'Client',
};

const Badge = ({ status, label, style }) => {
  const c = COLORS[status] || { bg: 'var(--surface)', color: 'var(--text-secondary)' };
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        background: c.bg, color: c.color,
        borderRadius: '9999px',
        padding: '3px 10px',
        fontSize: '11px', fontWeight: 600,
        fontFamily: 'var(--font)', letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label || LABELS[status] || status}
    </span>
  );
};

export default Badge;
