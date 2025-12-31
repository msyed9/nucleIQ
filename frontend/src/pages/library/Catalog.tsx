/**
 * Library Catalog Component
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Library.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const LibraryCatalog: React.FC = () => {
    const [books, setBooks] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const tenantId = localStorage.getItem('current_tenant') || localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/library/books/`, { headers: getAuthHeaders() });
            setBooks(res.data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBooks = books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="library-container">
            <h1>📚 Library Catalog</h1>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by Title or Author..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="book-grid">
                    {filteredBooks.map(book => (
                        <div className="book-card" key={book.id}>
                            <div className="book-cover">
                                {book.cover_image ? <img src={book.cover_image} alt={book.title} /> : <div className="placeholder">📖</div>}
                            </div>
                            <div className="book-info">
                                <h3>{book.title}</h3>
                                <p className="author">by {book.author}</p>
                                <div className="meta">
                                    <span className="badge">{book.category}</span>
                                    <span className="status">
                                        {book.available_copies_calc > 0 ? '✅ Available' : '❌ Out of Stock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LibraryCatalog;
