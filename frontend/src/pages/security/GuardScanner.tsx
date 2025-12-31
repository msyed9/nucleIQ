import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const GuardScanner: React.FC = () => {
    const [token, setToken] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleScan = async () => {
        try {
            setError('');
            setResult(null);
            const res = await axios.post(`${API_BASE_URL}/security/passes/scan/`,
                { token, action: 'OUT' },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setResult(res.data);
            setToken(''); // Clear for next scan
        } catch (err: any) {
            setError(err.response?.data?.error || 'Scan Failed');
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">👮 Guard Scanner</h1>

            <div className="bg-white p-6 rounded shadow-lg">
                <p className="mb-2 font-semibold">Scan QR Token:</p>
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Click to scan..."
                    className="w-full border p-3 rounded mb-4 text-center text-lg box-border"
                />

                <button
                    onClick={handleScan}
                    className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700"
                >
                    VERIFY & LOG EXIT
                </button>
            </div>

            {result && (
                <div className="mt-6 bg-green-100 p-4 rounded border border-green-400 text-green-800 text-center">
                    <h2 className="text-xl font-bold">ALLOWED ✅</h2>
                    <p className="text-lg mt-2">{result.student}</p>
                </div>
            )}

            {error && (
                <div className="mt-6 bg-red-100 p-4 rounded border border-red-400 text-red-800 text-center">
                    <h2 className="text-xl font-bold">DENIED ❌</h2>
                    <p className="mt-2">{error}</p>
                </div>
            )}
        </div>
    );
};

export default GuardScanner;
