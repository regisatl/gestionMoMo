/**
 * useToast — raccourci pratique pour déclencher des toasts
 * depuis n'importe quel composant.
 *
 * Usage :
 *   const toast = useToast();
 *   toast.success('Transaction créée', 'Réf: TXN-00042');
 *   toast.error('Connexion impossible');
 *   toast.warning('Solde insuffisant');
 *   toast.info('Mise à jour disponible');
 *   toast.transaction('Dépôt reçu', '+ 5 000 XOF');
 *
 * Ou directement :
 *   toast.show({ type: 'success', title: '...', message: '...', duration: 4000 });
 */
import { useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';

const useToast = () => {
  const { addToast } = useNotifications();

  const show = useCallback(
    ({ type = 'info', title, message, duration }) =>
      addToast({ type, title, message, duration }),
    [addToast],
  );

  const success     = useCallback((title, message, duration) => addToast({ type: 'success',     title, message, duration }), [addToast]);
  const error       = useCallback((title, message, duration) => addToast({ type: 'error',       title, message, duration }), [addToast]);
  const warning     = useCallback((title, message, duration) => addToast({ type: 'warning',     title, message, duration }), [addToast]);
  const info        = useCallback((title, message, duration) => addToast({ type: 'info',        title, message, duration }), [addToast]);
  const transaction = useCallback((title, message, duration) => addToast({ type: 'transaction', title, message, duration }), [addToast]);

  return { show, success, error, warning, info, transaction };
};

export default useToast;
