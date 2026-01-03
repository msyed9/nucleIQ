import React, { useState, useEffect } from 'react';
import api from '../../services/api';


const LeaveBalance: React.FC = () => {

    const [balances, setBalances] = useState<any[]>([]);

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const response = await api.get('/hr/leave-balances/');
            setBalances(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching leave balances:', error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Leave Balance</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {balances.map((balance) => (
                    <div key={balance.id} className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-semibold text-lg mb-2">{balance.leave_type_name}</h3>
                        <div className="space-y-1 text-sm">
                            <p>Total: {balance.total_quota} days</p>
                            <p>Used: {balance.used} days</p>
                            <p className="text-green-600 font-semibold">Available: {balance.available} days</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveBalance;
