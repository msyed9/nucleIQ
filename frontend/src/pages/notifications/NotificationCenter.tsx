import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Archive, Filter } from 'lucide-react';
import api from '../../services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  is_read: boolean;
  created_at: string;
  time_ago: string;
  icon?: string;
  action_url?: string;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/notifications/', {
        params: filter === 'unread' ? { is_read: false } : {}
      });
      setNotifications(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/notifications/unread_count/');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/notifications/${id}/mark_read/`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/notifications/mark_all_read/');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const archiveNotification = async (id: number) => {
    try {
      await api.post(`/notifications/notifications/${id}/archive/`);
      fetchNotifications();
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/notifications/${id}/`);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      INFO: 'bg-blue-100 text-blue-800',
      SUCCESS: 'bg-green-100 text-green-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800',
      REMINDER: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || colors.INFO;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'border-gray-300',
      MEDIUM: 'border-blue-400',
      HIGH: 'border-orange-400',
      URGENT: 'border-red-500'
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Mark All Read
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${getPriorityColor(
                notification.priority
              )} ${!notification.is_read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getTypeColor(
                        notification.notification_type
                      )}`}
                    >
                      {notification.notification_type}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-sm text-gray-500">{notification.time_ago} ago</p>
                </div>

                <div className="flex gap-2 ml-4">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={() => archiveNotification(notification.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
