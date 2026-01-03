import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface LibrarySettings {
    library_name: string;
    library_code: string;
    default_issue_period: number;
    max_issue_period: number;
    allow_renewals: boolean;
    max_renewals: number;
    student_max_books: number;
    staff_max_books: number;
    fine_per_day: number;
    grace_period: number;
    max_fine: number;
    notification_issue: boolean;
    notification_return: boolean;
    notification_overdue: boolean;
}

const LibrarySettings: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'general' | 'circulation' | 'fines' | 'notifications'>('general');
    
    const [settings, setSettings] = useState<LibrarySettings>({
        library_name: 'School Library',
        library_code: 'LIB001',
        default_issue_period: 14,
        max_issue_period: 30,
        allow_renewals: true,
        max_renewals: 2,
        student_max_books: 5,
        staff_max_books: 10,
        fine_per_day: 5,
        grace_period: 0,
        max_fine: 500,
        notification_issue: true,
        notification_return: true,
        notification_overdue: true
    });

    const saveSettingsMutation = useMutation({
        mutationFn: async (data: LibrarySettings) => {
            const response = await axios.patch('/api/library/settings/', data);
            return response.data;
        },
        onSuccess: () => {
            alert('Settings saved successfully!');
        },
        onError: () => {
            alert('Failed to save settings');
        }
    });

    const handleSave = () => {
        saveSettingsMutation.mutate(settings);
    };

    const handleReset = () => {
        if (window.confirm('Reset all settings to defaults?')) {
            setSettings({
                library_name: 'School Library',
                library_code: 'LIB001',
                default_issue_period: 14,
                max_issue_period: 30,
                allow_renewals: true,
                max_renewals: 2,
                student_max_books: 5,
                staff_max_books: 10,
                fine_per_day: 5,
                grace_period: 0,
                max_fine: 500,
                notification_issue: true,
                notification_return: true,
                notification_overdue: true
            });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800"> Library Settings</h1>
                <p className="text-gray-600 mt-1">Configure library rules and preferences</p>
            </div>

            <div className="bg-white rounded-lg shadow">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-4 p-4">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'general' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('circulation')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'circulation' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Circulation Rules
                        </button>
                        <button
                            onClick={() => setActiveTab('fines')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'fines' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Fines
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Notifications
                        </button>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg mb-4">General Settings</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Library Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.library_name}
                                    onChange={(e) => setSettings({...settings, library_name: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Library Code
                                </label>
                                <input
                                    type="text"
                                    value={settings.library_code}
                                    onChange={(e) => setSettings({...settings, library_code: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'circulation' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg mb-4">Circulation Rules</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Default Issue Period (days)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.default_issue_period}
                                        onChange={(e) => setSettings({...settings, default_issue_period: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maximum Issue Period (days)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.max_issue_period}
                                        onChange={(e) => setSettings({...settings, max_issue_period: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={settings.allow_renewals}
                                    onChange={(e) => setSettings({...settings, allow_renewals: e.target.checked})}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    Allow Book Renewals
                                </label>
                            </div>

                            {settings.allow_renewals && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maximum Renewals Allowed
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.max_renewals}
                                        onChange={(e) => setSettings({...settings, max_renewals: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            )}

                            <h4 className="font-semibold mt-6 mb-3">Member Limits</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Students: Max Books
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.student_max_books}
                                        onChange={(e) => setSettings({...settings, student_max_books: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Staff: Max Books
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.staff_max_books}
                                        onChange={(e) => setSettings({...settings, staff_max_books: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fines' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg mb-4">Fine Configuration</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fine Per Day ()
                                </label>
                                <input
                                    type="number"
                                    value={settings.fine_per_day}
                                    onChange={(e) => setSettings({...settings, fine_per_day: parseFloat(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">Amount charged per day for overdue books</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Grace Period (days)
                                </label>
                                <input
                                    type="number"
                                    value={settings.grace_period}
                                    onChange={(e) => setSettings({...settings, grace_period: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">Days before fine starts after due date</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Fine Per Book ()
                                </label>
                                <input
                                    type="number"
                                    value={settings.max_fine}
                                    onChange={(e) => setSettings({...settings, max_fine: parseFloat(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg mb-4">Notification Settings</h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium">Issue Confirmation</div>
                                        <div className="text-sm text-gray-600">Send notification when book is issued</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notification_issue}
                                        onChange={(e) => setSettings({...settings, notification_issue: e.target.checked})}
                                        className="w-5 h-5"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium">Return Reminder</div>
                                        <div className="text-sm text-gray-600">Send reminder before due date</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notification_return}
                                        onChange={(e) => setSettings({...settings, notification_return: e.target.checked})}
                                        className="w-5 h-5"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium">Overdue Alert</div>
                                        <div className="text-sm text-gray-600">Send alert for overdue books</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.notification_overdue}
                                        onChange={(e) => setSettings({...settings, notification_overdue: e.target.checked})}
                                        className="w-5 h-5"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saveSettingsMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LibrarySettings;
