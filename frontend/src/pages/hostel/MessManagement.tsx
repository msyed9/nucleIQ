import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, UtensilsCrossed, Users, TrendingUp, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface MessRegistration {
    id: number;
    allocation: number;
    student_name?: string;
    meal_plan: string;
    dietary_preference: string;
    allergies: string;
    monthly_fee: number;
    start_date: string;
    end_date?: string;
    is_active: boolean;
}

interface MessMenu {
    id: number;
    building: number;
    building_name?: string;
    week_start_date: string;
    day_of_week: string;
    meal_type: string;
    items: string;
    calories?: number;
    protein_grams?: number;
    is_active: boolean;
}

interface MenuFormData {
    building: string;
    week_start_date: string;
    day_of_week: string;
    meal_type: string;
    items: string;
    calories: string;
    protein_grams: string;
}

const MessManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'registrations' | 'menu'>('menu');
    const [registrations, setRegistrations] = useState<MessRegistration[]>([]);
    const [menus, setMenus] = useState<MessMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState<MessMenu | null>(null);
    const [menuFormData, setMenuFormData] = useState<MenuFormData>({
        building: '',
        week_start_date: '',
        day_of_week: '',
        meal_type: '',
        items: '',
        calories: '',
        protein_grams: '',
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'registrations') {
                const response = await api.get('/api/hostel/mess-registrations/');
                setRegistrations(response.data.results || response.data);
            } else {
                const response = await api.get('/api/hostel/mess-menus/');
                setMenus(response.data.results || response.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleMenuSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                building: parseInt(menuFormData.building),
                week_start_date: menuFormData.week_start_date,
                day_of_week: menuFormData.day_of_week,
                meal_type: menuFormData.meal_type,
                items: menuFormData.items,
                calories: menuFormData.calories ? parseInt(menuFormData.calories) : null,
                protein_grams: menuFormData.protein_grams ? parseFloat(menuFormData.protein_grams) : null,
            };

            if (editingMenu) {
                await api.put(`/api/hostel/mess-menus/${editingMenu.id}/`, payload);
                toast.success('Menu updated successfully');
            } else {
                await api.post('/api/hostel/mess-menus/', payload);
                toast.success('Menu created successfully');
            }

            setShowMenuForm(false);
            setEditingMenu(null);
            resetMenuForm();
            fetchData();
        } catch (error: any) {
            console.error('Error saving menu:', error);
            toast.error(error.response?.data?.detail || 'Failed to save menu');
        }
    };

    const handleDeleteMenu = async (id: number) => {
        if (!confirm('Are you sure you want to delete this menu item?')) return;

        try {
            await api.delete(`/api/hostel/mess-menus/${id}/`);
            toast.success('Menu deleted successfully');
            fetchData();
        } catch (error: any) {
            console.error('Error deleting menu:', error);
            toast.error(error.response?.data?.detail || 'Failed to delete menu');
        }
    };

    const handleEditMenu = (menu: MessMenu) => {
        setEditingMenu(menu);
        setMenuFormData({
            building: menu.building.toString(),
            week_start_date: menu.week_start_date,
            day_of_week: menu.day_of_week,
            meal_type: menu.meal_type,
            items: menu.items,
            calories: menu.calories?.toString() || '',
            protein_grams: menu.protein_grams?.toString() || '',
        });
        setShowMenuForm(true);
    };

    const resetMenuForm = () => {
        setMenuFormData({
            building: '',
            week_start_date: '',
            day_of_week: '',
            meal_type: '',
            items: '',
            calories: '',
            protein_grams: '',
        });
    };

    const filteredRegistrations = registrations.filter((reg) =>
        reg.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.meal_plan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMenus = menus.filter((menu) =>
        menu.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.day_of_week.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.meal_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeRegistrations = registrations.filter((r) => r.is_active).length;
    const totalRevenue = registrations.reduce((sum, r) => sum + (r.is_active ? r.monthly_fee : 0), 0);

    const getMealPlanBadge = (plan: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            FULL: { bg: 'bg-green-100', text: 'text-green-800' },
            TWO_MEALS: { bg: 'bg-blue-100', text: 'text-blue-800' },
            BREAKFAST_ONLY: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
            LUNCH_ONLY: { bg: 'bg-orange-100', text: 'text-orange-800' },
            DINNER_ONLY: { bg: 'bg-purple-100', text: 'text-purple-800' },
        };
        const badge = badges[plan] || { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {plan.replace('_', ' ')}
            </span>
        );
    };

    const getDietaryBadge = (diet: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            VEG: { bg: 'bg-green-100', text: 'text-green-800' },
            NON_VEG: { bg: 'bg-red-100', text: 'text-red-800' },
            JAIN: { bg: 'bg-orange-100', text: 'text-orange-800' },
            VEGAN: { bg: 'bg-teal-100', text: 'text-teal-800' },
        };
        const badge = badges[diet] || { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {diet.replace('_', ' ')}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mess Management</h1>
                    <p className="text-gray-600 mt-1">Manage mess registrations, menus, and meal planning</p>
                </div>
                {activeTab === 'menu' && (
                    <button
                        onClick={() => {
                            setEditingMenu(null);
                            resetMenuForm();
                            setShowMenuForm(!showMenuForm);
                        }}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Menu Item
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Registrations</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{registrations.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Students</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{activeRegistrations}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Monthly Revenue</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Menu Items</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{menus.length}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <UtensilsCrossed className="text-orange-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'menu'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar size={18} />
                            Weekly Menu
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'registrations'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users size={18} />
                            Registrations
                        </div>
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'menu' ? 'menu items' : 'registrations'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Menu Form */}
            {showMenuForm && activeTab === 'menu' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {editingMenu ? 'Edit Menu Item' : 'Add Menu Item'}
                    </h2>
                    <form onSubmit={handleMenuSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
                                <input
                                    type="date"
                                    value={menuFormData.week_start_date}
                                    onChange={(e) => setMenuFormData({ ...menuFormData, week_start_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                                <select
                                    value={menuFormData.day_of_week}
                                    onChange={(e) => setMenuFormData({ ...menuFormData, day_of_week: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Day</option>
                                    <option value="MONDAY">Monday</option>
                                    <option value="TUESDAY">Tuesday</option>
                                    <option value="WEDNESDAY">Wednesday</option>
                                    <option value="THURSDAY">Thursday</option>
                                    <option value="FRIDAY">Friday</option>
                                    <option value="SATURDAY">Saturday</option>
                                    <option value="SUNDAY">Sunday</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                                <select
                                    value={menuFormData.meal_type}
                                    onChange={(e) => setMenuFormData({ ...menuFormData, meal_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Meal</option>
                                    <option value="BREAKFAST">Breakfast</option>
                                    <option value="LUNCH">Lunch</option>
                                    <option value="SNACKS">Snacks</option>
                                    <option value="DINNER">Dinner</option>
                                </select>
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Items (comma-separated)</label>
                                <textarea
                                    value={menuFormData.items}
                                    onChange={(e) => setMenuFormData({ ...menuFormData, items: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="e.g., Idli, Sambar, Chutney, Coffee"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Calories (Optional)</label>
                                <input
                                    type="number"
                                    value={menuFormData.calories}
                                    onChange={(e) => setMenuFormData({ ...menuFormData, calories: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 450"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g) (Optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={menuFormData.protein_grams}
                                    onChange={(e) => setMenuFormData({ ...menuFormData, protein_grams: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 12.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Building ID</label>
                                <input
                                    type="number"
                                    value={menuFormData.building}
                                    onChange={(e) => setMenuFormData({ ...menuFormData, building: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter building ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMenuForm(false);
                                    setEditingMenu(null);
                                    resetMenuForm();
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                {editingMenu ? 'Update Menu' : 'Add Menu'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content */}
            {activeTab === 'menu' ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Week Start</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Day</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Meal Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Menu Items</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Calories</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Protein (g)</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredMenus.map((menu) => (
                                    <tr key={menu.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(menu.week_start_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{menu.day_of_week}</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">{menu.meal_type}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-md">{menu.items}</td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{menu.calories || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{menu.protein_grams || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditMenu(menu)}
                                                    className="p-1 text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMenu(menu.id)}
                                                    className="p-1 text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredMenus.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No menu items found. Add your first menu item to get started.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Meal Plan</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Dietary Pref.</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Allergies</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Monthly Fee</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Start Date</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredRegistrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{reg.student_name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm">{getMealPlanBadge(reg.meal_plan)}</td>
                                        <td className="px-4 py-3 text-sm">{getDietaryBadge(reg.dietary_preference)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{reg.allergies || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                            ₹{reg.monthly_fee.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                                            {new Date(reg.start_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${reg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {reg.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredRegistrations.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No registrations found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessManagement;
