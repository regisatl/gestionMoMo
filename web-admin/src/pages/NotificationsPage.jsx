import React from 'react';
import { CheckCheck, AlertCircle, AlertTriangle, Info, ArrowLeftRight, Settings, Bell } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICONS = {
  success:     CheckCheck,
  error:       AlertCircle,
  warning:     AlertTriangle,
  info:        Info,
  transaction: ArrowLeftRight,
  system:      Settings,
};

const TYPE_COLORS = {
  success: '#16A34A', error: '#DC2626', warning: '#D97706',
  info: '#0284C7', transaction: '#0A66C2', system: '#6B7280',
};

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
        </p>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead} icon={<CheckCheck size={14} strokeWidth={2} />}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Liste */}
      <Card padding="0">
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <Bell size={48} color="var(--text-secondary)" strokeWidth={1.5} />
            </div>
            <p style={{ fontFamily: 'var(--font)', color: 'var(--text-secondary)', fontSize: '15px' }}>Aucune notification</p>
          </div>
        ) : notifications.map((n, idx) => (
          <div
            key={n._id}
            onClick={() => !n.isRead && markAsRead(n._id)}
            style={{
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              padding: '16px 20px',
              background: n.isRead ? 'transparent' : 'var(--color-primary-alpha)',
              borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: n.isRead ? 'default' : 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { if (!n.isRead) e.currentTarget.style.background = 'rgba(10,102,194,0.18)'; }}
            onMouseLeave={(e) => { if (!n.isRead) e.currentTarget.style.background = 'var(--color-primary-alpha)'; else e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              background: `${TYPE_COLORS[n.type] || '#6B7280'}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {(() => { const Icon = TYPE_ICONS[n.type] || Info; return <Icon size={18} color={TYPE_COLORS[n.type] || '#6B7280'} strokeWidth={2} />; })()}
            </div>

            {/* Contenu */}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font)', fontWeight: n.isRead ? 500 : 700, fontSize: '14px', color: 'var(--text)' }}>
                {n.title}
              </div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 400, fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                {n.message}
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: '11px', color: 'var(--text-disabled)', marginTop: '6px' }}>
                {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Indicateur non lu */}
            {!n.isRead && (
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: '6px' }} />
            )}
          </div>
        ))}
      </Card>
    </div>
  );
};

export default NotificationsPage;
