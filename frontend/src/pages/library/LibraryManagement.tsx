import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import './LibraryManagement.css';

interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    total_copies: number;
    available_copies: number;
    cover_image?: string;
}

interface BookCopy {
    id: string;
    barcode: string;
    status: string;
    book: string;
}

interface LibraryMember {
    id: string;
    member_type: string;
    student?: any;
    staff?: any;
    max_books_allowed: number;
    books_issued_count: number;
    total_fines_due: number;
}

interface BookIssue {
    id: string;
    copy: string;
    member: string;
    issued_date: string;
    due_date: string;
    returned_date?: string;
    fine_amount: number;
    fine_paid: boolean;
    status: string;
    copy_details?: BookCopy;
    member_details?: LibraryMember;
}

const LibraryManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'issue' | 'return' | 'issued'>('issue');
    const [barcode, setBarcode] = useState('');
    const [memberId, setMemberId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    // Fetch books
    const { data: books } = useQuery<Book[]>({
        queryKey: ['books'],
        queryFn: async () => {
            const response = await axios.get('/api/library/books/');
            return response.data;
        }
    });

    // Fetch issued books
    const { data: issuedBooks, isLoading: issuedLoading } = useQuery<BookIssue[]>({
        queryKey: ['issued-books'],
        queryFn: async () => {
            const response = await axios.get('/api/library/issues/?status=ISSUED');
            return response.data;
        }
    });

    // Fetch library members
    const { data: members } = useQuery<LibraryMember[]>({
        queryKey: ['library-members'],
        queryFn: async () => {
            const response = await axios.get('/api/library/members/');
            return response.data;
        }
    });

    // Issue book mutation
    const issueBookMutation = useMutation({
        mutationFn: async (data: { barcode: string; member_id: string }) => {
            const response = await axios.post('/api/library/issues/issue/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issued-books'] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
            setBarcode('');
            setMemberId('');
            alert('Book issued successfully!');
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.error || 'Failed to issue book'}`);
        }
    });

    // Return book mutation
    const returnBookMutation = useMutation({
        mutationFn: async (issueId: string) => {
            const response = await axios.post(`/api/library/issues/${issueId}/return_book/`);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['issued-books'] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
            if (data.fine_amount > 0) {
                alert(`Book returned! Fine: ₹${data.fine_amount}`);
            } else {
                alert('Book returned successfully!');
            }
        },
        onError: () => {
            alert('Failed to return book');
        }
    });

    const handleIssueBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode || !memberId) {
            alert('Please enter both barcode and member ID');
            return;
        }
        issueBookMutation.mutate({ barcode, member_id: memberId });
    };

    const handleReturnBook = (issueId: string) => {
        if (window.confirm('Are you sure you want to return this book?')) {
            returnBookMutation.mutate(issueId);
        }
    };

    const filteredBooks = books?.filter((book) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            book.title.toLowerCase().includes(search) ||
            book.author.toLowerCase().includes(search) ||
            book.isbn.toLowerCase().includes(search) ||
            book.category.toLowerCase().includes(search)
        );
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="library-container">
            <div className="page-header">
                <h1>📚 Library Management</h1>
                <p>Issue and return books, manage library circulation</p>
            </div>

            {/* Tab Navigation */}
            <div className="library-tabs">
                <button
                    className={`tab ${activeTab === 'issue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('issue')}
                >
                    📤 Issue Book
                </button>
                <button
                    className={`tab ${activeTab === 'return' ? 'active' : ''}`}
                    onClick={() => setActiveTab('return')}
                >
                    📥 Return Book
                </button>
                <button
                    className={`tab ${activeTab === 'issued' ? 'active' : ''}`}
                    onClick={() => setActiveTab('issued')}
                >
                    📋 Issued Books
                </button>
            </div>

            {/* Issue Book Tab */}
            {activeTab === 'issue' && (
                <div className="tab-content">
                    <div className="issue-card">
                        <h2>Issue Book to Member</h2>
                        <form onSubmit={handleIssueBook} className="issue-form">
                            <div className="form-group">
                                <label htmlFor="barcode">Book Barcode *</label>
                                <input
                                    type="text"
                                    id="barcode"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    placeholder="Scan or enter barcode"
                                    className="form-input"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="member">Library Member *</label>
                                <select
                                    id="member"
                                    value={memberId}
                                    onChange={(e) => setMemberId(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">-- Select Member --</option>
                                    {members?.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.student ?
                                                `${member.student.first_name} ${member.student.last_name} (Student)` :
                                                `${member.staff?.first_name} ${member.staff?.last_name} (Staff)`
                                            } - Books: {member.books_issued_count}/{member.max_books_allowed}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={issueBookMutation.isPending}
                            >
                                {issueBookMutation.isPending ? 'Issuing...' : '📤 Issue Book'}
                            </button>
                        </form>
                    </div>

                    {/* Available Books */}
                    <div className="books-section">
                        <div className="section-header">
                            <h3>Available Books</h3>
                            <input
                                type="text"
                                placeholder="🔍 Search books..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="books-grid">
                            {filteredBooks?.filter(b => b.available_copies > 0).map((book) => (
                                <div key={book.id} className="book-card">
                                    {book.cover_image && (
                                        <img src={book.cover_image} alt={book.title} className="book-cover" />
                                    )}
                                    <div className="book-info">
                                        <h4 className="book-title">{book.title}</h4>
                                        <p className="book-author">by {book.author}</p>
                                        <p className="book-category">{book.category}</p>
                                        <div className="book-availability">
                                            <span className="available-badge">
                                                {book.available_copies}/{book.total_copies} Available
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Return Book Tab */}
            {activeTab === 'return' && (
                <div className="tab-content">
                    <div className="return-card">
                        <h2>Return Issued Books</h2>
                        {issuedLoading ? (
                            <div className="loading">Loading...</div>
                        ) : issuedBooks && issuedBooks.length > 0 ? (
                            <div className="issued-table-container">
                                <table className="issued-table">
                                    <thead>
                                        <tr>
                                            <th>Barcode</th>
                                            <th>Member</th>
                                            <th>Issued Date</th>
                                            <th>Due Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issuedBooks.map((issue) => (
                                            <tr key={issue.id} className={isOverdue(issue.due_date) ? 'overdue-row' : ''}>
                                                <td>{issue.copy}</td>
                                                <td>Member #{issue.member}</td>
                                                <td>{formatDate(issue.issued_date)}</td>
                                                <td>{formatDate(issue.due_date)}</td>
                                                <td>
                                                    {isOverdue(issue.due_date) ? (
                                                        <span className="status-badge overdue">⚠️ Overdue</span>
                                                    ) : (
                                                        <span className="status-badge issued">✅ Issued</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-return"
                                                        onClick={() => handleReturnBook(issue.id)}
                                                        disabled={returnBookMutation.isPending}
                                                    >
                                                        📥 Return
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📚</div>
                                <p>No books currently issued</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Issued Books Tab */}
            {activeTab === 'issued' && (
                <div className="tab-content">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📚</div>
                            <div className="stat-content">
                                <div className="stat-value">{issuedBooks?.length || 0}</div>
                                <div className="stat-label">Total Issued</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {issuedBooks?.filter(i => isOverdue(i.due_date)).length || 0}
                                </div>
                                <div className="stat-label">Overdue</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📖</div>
                            <div className="stat-content">
                                <div className="stat-value">{books?.length || 0}</div>
                                <div className="stat-label">Total Books</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {books?.reduce((sum, b) => sum + b.available_copies, 0) || 0}
                                </div>
                                <div className="stat-label">Available</div>
                            </div>
                        </div>
                    </div>

                    <div className="issued-list-card">
                        <h3>All Issued Books</h3>
                        {issuedLoading ? (
                            <div className="loading">Loading...</div>
                        ) : issuedBooks && issuedBooks.length > 0 ? (
                            <div className="issued-table-container">
                                <table className="issued-table">
                                    <thead>
                                        <tr>
                                            <th>Barcode</th>
                                            <th>Member</th>
                                            <th>Issued Date</th>
                                            <th>Due Date</th>
                                            <th>Days Left</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issuedBooks.map((issue) => {
                                            const daysLeft = Math.ceil((new Date(issue.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                            return (
                                                <tr key={issue.id} className={isOverdue(issue.due_date) ? 'overdue-row' : ''}>
                                                    <td>{issue.copy}</td>
                                                    <td>Member #{issue.member}</td>
                                                    <td>{formatDate(issue.issued_date)}</td>
                                                    <td>{formatDate(issue.due_date)}</td>
                                                    <td>
                                                        <span className={`days-badge ${daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'warning' : 'normal'}`}>
                                                            {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isOverdue(issue.due_date) ? (
                                                            <span className="status-badge overdue">⚠️ Overdue</span>
                                                        ) : (
                                                            <span className="status-badge issued">✅ Issued</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-return"
                                                            onClick={() => handleReturnBook(issue.id)}
                                                            disabled={returnBookMutation.isPending}
                                                        >
                                                            📥 Return
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📚</div>
                                <p>No books currently issued</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryManagement;
