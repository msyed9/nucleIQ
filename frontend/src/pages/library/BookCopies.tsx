import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BarcodeLabelGenerator from '../../components/library/BarcodeLabelGenerator';

interface BookCopy {
    id: string;
    barcode: string;
    status: 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'LOST' | 'DAMAGED';
    acquired_date: string;
    price: number;
    book: string;
    book_details?: Book;
}

interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    total_copies: number;
    available_copies: number;
}

const BookCopies: React.FC = () => {
    const { bookId } = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchBarcode, setSearchBarcode] = useState('');

    // Form states
    const [barcode, setBarcode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [condition, setCondition] = useState('NEW');
    const [location, setLocation] = useState('');
    const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
    const [price, setPrice] = useState('');
    const [notes, setNotes] = useState('');

    // Fetch book details
    const { data: book } = useQuery<Book>({
        queryKey: ['book', bookId],
        queryFn: async () => {
            const response = await axios.get(`/api/library/books/${bookId}/`);
            return response.data;
        }
    });

    // Fetch copies
    const { data: copies, isLoading } = useQuery<BookCopy[]>({
        queryKey: ['book-copies', bookId],
        queryFn: async () => {
            const response = await axios.get(`/api/library/copies/?book=${bookId}`);
            return response.data;
        }
    });

    // Add copy mutation
    const addCopyMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post('/api/library/copies/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['book-copies', bookId] });
            queryClient.invalidateQueries({ queryKey: ['book', bookId] });
            setShowAddModal(false);
            resetForm();
            alert('Copy added successfully!');
        },
        onError: (error: any) => {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    });

    // Bulk add copies mutation
    const bulkAddCopiesMutation = useMutation({
        mutationFn: async (copies: any[]) => {
            const promises = copies.map(copy => axios.post('/api/library/copies/', copy));
            return await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['book-copies', bookId] });
            queryClient.invalidateQueries({ queryKey: ['book', bookId] });
            setShowAddModal(false);
            resetForm();
            alert('Successfully added copies!');
        },
        onError: () => {
            alert('Failed to add copies');
        }
    });

    // Update copy mutation
    const updateCopyMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await axios.patch(`/api/library/copies/${id}/`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['book-copies', bookId] });
            setShowEditModal(false);
            setSelectedCopy(null);
            alert('Copy updated successfully!');
        },
        onError: () => {
            alert('Failed to update copy');
        }
    });

    // Delete copy mutation
    const deleteCopyMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/library/copies/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['book-copies', bookId] });
            queryClient.invalidateQueries({ queryKey: ['book', bookId] });
            alert('Copy deleted successfully!');
        },
        onError: () => {
            alert('Failed to delete copy');
        }
    });

    const resetForm = () => {
        setBarcode('');
        setQuantity(1);
        setCondition('NEW');
        setLocation('');
        setPrice('');
        setNotes('');
        setAcquisitionDate(new Date().toISOString().split('T')[0]);
    };

    const generateBarcode = () => {
        const prefix = 'LIB';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    };

    const handleAddCopy = () => {
        if (quantity === 1) {
            const copyData = {
                book: bookId,
                barcode: barcode || generateBarcode(),
                status: 'AVAILABLE',
                acquired_date: acquisitionDate,
                price: price ? parseFloat(price) : null
            };
            addCopyMutation.mutate(copyData);
        } else {
            const copies: any[] = [];
            for (let i = 0; i < quantity; i++) {
                copies.push({
                    book: bookId,
                    barcode: generateBarcode(),
                    status: 'AVAILABLE',
                    acquired_date: acquisitionDate,
                    price: price ? parseFloat(price) : null
                });
            }
            bulkAddCopiesMutation.mutate(copies);
        }
    };

    const handleEditCopy = () => {
        if (!selectedCopy) return;
        const updateData: any = {};
        if (condition) updateData.condition = condition;
        if (location) updateData.location = location;
        if (notes) updateData.notes = notes;

        updateCopyMutation.mutate({ id: selectedCopy.id, data: updateData });
    };

    const handleDeleteCopy = (id: string) => {
        if (window.confirm('Are you sure you want to delete this copy? This action cannot be undone.')) {
            deleteCopyMutation.mutate(id);
        }
    };

    /* const handleStatusChange = (copy: BookCopy, newStatus: string) => {
        updateCopyMutation.mutate({
            id: copy.id,
            data: { status: newStatus }
        });
    }; */

    const openEditModal = (copy: BookCopy) => {
        setSelectedCopy(copy);
        setShowEditModal(true);
    };

    const openBarcodeModal = (copy: BookCopy) => {
        setSelectedCopy(copy);
        setShowBarcodeModal(true);
    };

    const getStatusBadgeClass = (status: string) => {
        const classes: { [key: string]: string } = {
            AVAILABLE: 'bg-green-100 text-green-800',
            ISSUED: 'bg-blue-100 text-blue-800',
            RESERVED: 'bg-yellow-100 text-yellow-800',
            LOST: 'bg-red-100 text-red-800',
            DAMAGED: 'bg-orange-100 text-orange-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    };

    const filteredCopies = copies?.filter(copy => {
        const statusMatch = statusFilter === 'ALL' || copy.status === statusFilter;
        const barcodeMatch = !searchBarcode || copy.barcode.toLowerCase().includes(searchBarcode.toLowerCase());
        return statusMatch && barcodeMatch;
    }) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/library/books')}
                    className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
                >
                    Back to Books
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Manage Book Copies
                        </h1>
                        {book && (
                            <div className="mt-2">
                                <h2 className="text-xl text-gray-700">{book.title}</h2>
                                <p className="text-gray-600">by {book.author}</p>
                                <div className="mt-2 flex gap-4 text-sm">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                                        Total Copies: {book.total_copies}
                                    </span>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                                        Available: {book.available_copies}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add Copies
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4 items-center bg-white p-4 rounded-lg shadow">
                <input
                    type="text"
                    placeholder=" Search by barcode..."
                    value={searchBarcode}
                    onChange={(e) => setSearchBarcode(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="ALL">All Status</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="ISSUED">Issued</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="LOST">Lost</option>
                    <option value="DAMAGED">Damaged</option>
                </select>
            </div>

            {/* Copies Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">Loading copies...</div>
                ) : filteredCopies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="text-6xl mb-4"></div>
                        <p>No copies found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acquired Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredCopies.map((copy) => (
                                <tr key={copy.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                                        {copy.barcode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(copy.status)}`}>
                                            {copy.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(copy.acquired_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {copy.price ? `$${copy.price}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openBarcodeModal(copy)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Label
                                        </button>
                                        <button
                                            onClick={() => openEditModal(copy)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCopy(copy.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Copy Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Add Book Copies</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Number of Copies
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>

                                {quantity === 1 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Barcode (optional - will auto-generate)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={barcode}
                                                onChange={(e) => setBarcode(e.target.value)}
                                                placeholder="Leave empty to auto-generate"
                                                className="flex-1 px-3 py-2 border rounded-lg"
                                            />
                                            <button
                                                onClick={() => setBarcode(generateBarcode())}
                                                className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Acquisition Date
                                    </label>
                                    <input
                                        type="date"
                                        value={acquisitionDate}
                                        onChange={(e) => setAcquisitionDate(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Purchase Price ()
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="Optional"
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCopy}
                                    disabled={addCopyMutation.isPending || bulkAddCopiesMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                                >
                                    {(addCopyMutation.isPending || bulkAddCopiesMutation.isPending)
                                        ? 'Adding...'
                                        : 'Add Copies'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Copy Modal */}
            {
                showEditModal && selectedCopy && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Edit Copy</h3>
                            <p className="text-sm text-gray-600 mb-4">Barcode: {selectedCopy.barcode}</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={selectedCopy.status}
                                        onChange={(e) => setSelectedCopy({ ...selectedCopy, status: e.target.value as any })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="AVAILABLE">Available</option>
                                        <option value="ISSUED">Issued</option>
                                        <option value="RESERVED">Reserved</option>
                                        <option value="LOST">Lost</option>
                                        <option value="DAMAGED">Damaged</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location/Shelf
                                    </label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g., A-12"
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedCopy(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditCopy}
                                    disabled={updateCopyMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                                >
                                    {updateCopyMutation.isPending ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Barcode Label Modal */}
            {
                showBarcodeModal && selectedCopy && book && (
                    <BarcodeLabelGenerator
                        barcode={selectedCopy.barcode}
                        bookTitle={book.title}
                        author={book.author}
                        onClose={() => {
                            setShowBarcodeModal(false);
                            setSelectedCopy(null);
                        }}
                    />
                )
            }
        </div >
    );
};

export default BookCopies;
