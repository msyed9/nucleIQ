import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TicketBoard: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/helpdesk/tickets/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTickets(res.data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">🎫 Helpdesk</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white p-4 rounded shadow border-l-4 border-l-yellow-500">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded">{ticket.category}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{ticket.subject}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ticket.description}</p>

                        <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                            <span>By: {ticket.raiser}</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TicketBoard;
