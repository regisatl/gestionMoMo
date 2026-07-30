const notificationService = require('../services/notificationService');

// GET /api/notifications — notifications de l'utilisateur connecté
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const result = await notificationService.getForUser(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read — marquer comme lue
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user._id);
    if (!notification) return res.status(404).json({ error: 'Notification introuvable.' });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all — tout marquer comme lu
exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user._id);
    res.json({ message: 'Toutes les notifications marquées comme lues.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteOne(req.params.id, req.user._id);
    res.json({ message: 'Notification supprimée.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/notifications/broadcast — super_admin seulement
exports.broadcast = async (req, res, next) => {
  try {
    const { title, message, type, targetRole } = req.body;
    await notificationService.broadcast({ title, message, type, targetRole });
    res.json({ message: `Notification envoyée à tous les ${targetRole || 'utilisateurs'}.` });
  } catch (err) {
    next(err);
  }
};
