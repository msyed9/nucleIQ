import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    documents: any[];
    loading: boolean;
    onVerify: (doc: any) => void;
    onRefresh: () => void;
}

const DocumentList: React.FC<Props> = ({ documents, loading, onVerify, onRefresh }) => {
    const { t } = useTranslation();

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'VERIFIED': 'bg-green-100 text-green-800',
            'EXPIRED': 'bg-red-100 text-red-800',
            'REJECTED': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                        <tr key={doc.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{doc.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{doc.document_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{doc.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(doc.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{doc.expiry_date || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(doc.status)}`}>
                                    {doc.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <a href={doc.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">View</a>
                                {doc.status === 'PENDING' && (
                                    <button onClick={() => onVerify(doc)} className="text-green-600 hover:text-green-900">Verify</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {documents.length === 0 && (
                <div className="text-center py-8 text-gray-500">No documents found</div>
            )}
        </div>
    );
};

export default DocumentList;
