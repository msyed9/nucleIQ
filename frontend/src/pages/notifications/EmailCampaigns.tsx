import React, { useState, useEffect } from 'react';
import { Mail, Send, Calendar, Users, TrendingUp, Plus } from 'lucide-react';
import api from '../../services/api';

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  body: string;
  recipient_type: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  delivery_rate: number;
  open_rate: number;
  created_at: string;
}

const EmailCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    recipient_type: 'ALL_STUDENTS',
    recipient_emails: []
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/email-campaigns/');
      setCampaigns(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notifications/email-campaigns/', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        subject: '',
        body: '',
        recipient_type: 'ALL_STUDENTS',
        recipient_emails: []
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const sendCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;
    
    try {
      await api.post(`/notifications/email-campaigns/${id}/send/`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      SENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.DRAFT;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600 mt-1">Create and manage email campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No campaigns found</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                  <p className="text-sm text-gray-600">{campaign.subject}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {campaign.status}
                </span>
              </div>

              {campaign.status === 'SENT' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">Recipients</span>
                    </div>
                    <p className="text-lg font-semibold">{campaign.total_recipients}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Send className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">Sent</span>
                    </div>
                    <p className="text-lg font-semibold">{campaign.sent_count}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">Delivery Rate</span>
                    </div>
                    <p className="text-lg font-semibold">{campaign.delivery_rate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">Open Rate</span>
                    </div>
                    <p className="text-lg font-semibold">{campaign.open_rate.toFixed(1)}%</p>
                  </div>
                </div>
              )}

              {campaign.status === 'DRAFT' && (
                <button
                  onClick={() => sendCampaign(campaign.id)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Campaign
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Email Campaign</h2>
            <form onSubmit={createCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Type
                </label>
                <select
                  value={formData.recipient_type}
                  onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL_STUDENTS">All Students</option>
                  <option value="ALL_STAFF">All Staff</option>
                  <option value="ALL_PARENTS">All Parents</option>
                  <option value="SPECIFIC_CLASS">Specific Class</option>
                  <option value="SPECIFIC_DEPARTMENT">Specific Department</option>
                  <option value="CUSTOM_LIST">Custom List</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Body
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaigns;
