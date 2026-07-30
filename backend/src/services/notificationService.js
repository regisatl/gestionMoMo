const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser, emitToRole, emitToAll } = require('./socketService');

/**
 * Crée une notification et l'envoie en temps réel via Socket.IO
 */
const create = async ({ userId, title, message, type = 'info', resourceType = null, resourceId = null }) => {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    resourceType,
    resourceId,
  });

  // Push temps réel
  emitToUser(userId.toString(), 'notification:new', notification);

  return notification;
};

/**
 * Envoie une notification à tous les utilisateurs d'un rôle (broadcast)
 */
const broadcast = async ({ title, message, type = 'info', targetRole = 'all' }) => {
  let userFilter = {};
  if (targetRole !== 'all') userFilter.role = targetRole;

  const users = await User.find({ ...userFilter, status: 'active' }).select('_id');

  const notifications = await Notification.insertMany(
    users.map((u) => ({
      userId: u._id,
      title,
      message,
      type,
      isBroadcast: true,
      broadcastRole: targetRole,
    }))
  );

  // Émission en temps réel
  if (targetRole === 'all') {
    emitToAll('notification:new', { title, message, type, isBroadcast: true });
  } else {
    emitToRole(targetRole, 'notification:new', { title, message, type, isBroadcast: true });
  }

  return notifications;
};

/**
 * Récupère les notifications d'un utilisateur
 */
const getForUser = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { userId };
  if (unreadOnly) filter.isRead = false;

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

/**
 * Marque une notification comme lue
 */
const markRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
const markAllRead = async (userId) => {
  return Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

/**
 * Supprime une notification
 */
const deleteOne = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, userId });
};

module.exports = { create, broadcast, getForUser, markRead, markAllRead, deleteOne };
