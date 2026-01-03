import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import api from '../../services/api';

interface SMSMessage {
  id: number;
  recipient_phone: string;
  recipient_name: string;
  message: string;
  message_type: 'TRANSACTIONAL' | 'PROMOTIONAL' | 'OTP';
  status: 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'REJECTED';
  sent_at?: string;
  delivered_at?: string;
  credits_used: number;
  character_count: number;
  sms_parts: number;
  created_at: string;
}

const SMSMessaging: React.FC = () => {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [formData, setFormData] = useState({
    recipient_phone: '',
    recipient_name: '',
    message: '',
    message_type: 'TRANSACTIONAL'
  });

  useEffect(() => {
    fetchMessages();
    fetchBalance();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/sms-messages/');
      setMessages(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await api.get('/notifications/sms-messages/balance/');
      setBalance(response.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const sendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notifications/sms-messages/', formData);
      setShowSendModal(false);
      setFormData({
        recipient_phone: '',
        recipient_name: '',
        message: '',
        message_type: 'TRANSACTIONAL'
      });
      fetchMessages();
      fetchBalance();
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4 text-yellow-600" />,
      QUEUED: <Clock className="w-4 h-4 text-blue-600" />,
      SENT: <Send className="w-4 h-4 text-blue-600" />,
      DELIVERED: <CheckCircle className="w-4 h-4 text-green-600" />,
      FAILED: <XCircle className="w-4 h-4 text-red-600" />,
      REJECTED: <XCircle className="w-4 h-4 text-red-600" />
    };
    return icons[status as keyof typeof icons] || icons.PENDING;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      QUEUED: 'bg-blue-100 text-blue-800',
      SENT: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const characterCount = formData.message.length;
  const smsParts = Math.ceil(characterCount / 160);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Messaging</h1>
          <p className="text-gray-600 mt-1">Send SMS messages to students, staff, and parents</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send SMS
        </button>
      </div>

      {/* Balance Card */}
      {balance && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 mb-1">SMS Credits Balance</p>
              <p className="text-3xl font-bold">{balance.credits || 0}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-blue-200" />
          </div>
        </div>
      )}

      {/* Messages Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parts/Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading messages...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages found</p>
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{message.recipient_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{message.recipient_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{message.message}</div>
                      <div className="text-xs text-gray-500">{message.character_count} chars</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{message.message_type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(message.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {message.sms_parts} parts / {message.credits_used} credits
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {message.sent_at ? new Date(message.sent_at).toLocaleString() : 'Not sent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send SMS Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Send SMS</h2>
            <form onSubmit={sendSMS} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.recipient_phone}
                  onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Type
                </label>
                <select
                  value={formData.message_type}
                  onChange={(e) => setFormData({ ...formData, message_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TRANSACTIONAL">Transactional</option>
                  <option value="PROMOTIONAL">Promotional</option>
                  <option value="OTP">OTP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{characterCount} / 1000 characters</span>
                  <span>{smsParts} SMS part{smsParts !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send SMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSMessaging;
