import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { openDownload } from '../../utils/downloadLink';

interface DigitalResource {
    id: string;
    title: string;
    description: string;
    resource_type: 'PDF' | 'VIDEO' | 'AUDIO' | 'LINK';
    file?: string;
    external_url?: string;
    download_count: number;
    created_at: string;
}

const DigitalResources: React.FC = () => {
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    
    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [resourceType, setResourceType] = useState<'PDF' | 'VIDEO' | 'AUDIO' | 'LINK'>('PDF');
    const [file, setFile] = useState<File | null>(null);
    const [externalUrl, setExternalUrl] = useState('');

    const { data: resources, isLoading } = useQuery<DigitalResource[]>({
        queryKey: ['digital-resources'],
        queryFn: async () => {
            const response = await axios.get('/api/library/digital/');
            return response.data;
        }
    });

    const addResourceMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await axios.post('/api/library/digital/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['digital-resources'] });
            setShowAddModal(false);
            resetForm();
            alert('Resource added successfully!');
        },
        onError: () => {
            alert('Failed to add resource');
        }
    });

    const deleteResourceMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/library/digital/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['digital-resources'] });
            alert('Resource deleted successfully');
        }
    });

    const trackAccessMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.post(`/api/library/digital/${id}/track_access/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['digital-resources'] });
        }
    });

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setResourceType('PDF');
        setFile(null);
        setExternalUrl('');
    };

    const handleSubmit = () => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('resource_type', resourceType);
        
        if (resourceType === 'LINK') {
            formData.append('external_url', externalUrl);
        } else if (file) {
            formData.append('file', file);
        }
        
        addResourceMutation.mutate(formData);
    };

    const handleView = (resource: DigitalResource) => {
        trackAccessMutation.mutate(resource.id);
        if (resource.external_url) {
            openDownload(resource.external_url);
        } else if (resource.file) {
            openDownload(resource.file);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this resource?')) {
            deleteResourceMutation.mutate(id);
        }
    };

    const getResourceIcon = (type: string) => {
        const icons: { [key: string]: string } = {
            PDF: '',
            VIDEO: '',
            AUDIO: '',
            LINK: ''
        };
        return icons[type] || '';
    };

    const filteredResources = resources?.filter(resource => {
        const typeMatch = filterType === 'ALL' || resource.resource_type === filterType;
        const searchMatch = !searchTerm || 
            resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchTerm.toLowerCase());
        return typeMatch && searchMatch;
    }) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800"> Digital Resources</h1>
                        <p className="text-gray-600 mt-1">E-Library and digital learning materials</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                         Add Resource
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Resources</div>
                    <div className="text-2xl font-bold text-gray-800">{resources?.length || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">PDFs</div>
                    <div className="text-2xl font-bold text-red-600">
                        {resources?.filter(r => r.resource_type === 'PDF').length || 0}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Videos</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {resources?.filter(r => r.resource_type === 'VIDEO').length || 0}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Downloads</div>
                    <div className="text-2xl font-bold text-green-600">
                        {resources?.reduce((sum, r) => sum + r.download_count, 0) || 0}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4 items-center bg-white p-4 rounded-lg shadow">
                <input
                    type="text"
                    placeholder=" Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="ALL">All Types</option>
                    <option value="PDF">PDF Documents</option>
                    <option value="VIDEO">Videos</option>
                    <option value="AUDIO">Audio</option>
                    <option value="LINK">External Links</option>
                </select>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12">Loading resources...</div>
                ) : filteredResources.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4"></div>
                        <p>No resources found</p>
                    </div>
                ) : (
                    filteredResources.map(resource => (
                        <div key={resource.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="text-4xl">{getResourceIcon(resource.resource_type)}</div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-800 truncate">{resource.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{resource.description}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                            {resource.resource_type}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {resource.download_count} views
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleView(resource)}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                    View/Download
                                </button>
                                <button
                                    onClick={() => handleDelete(resource.id)}
                                    className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"
                                >
                                    
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Resource Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Add Digital Resource</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Resource title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Brief description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                    value={resourceType}
                                    onChange={(e) => setResourceType(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="PDF">PDF Document</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="AUDIO">Audio</option>
                                    <option value="LINK">External Link</option>
                                </select>
                            </div>

                            {resourceType === 'LINK' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                                    <input
                                        type="url"
                                        value={externalUrl}
                                        onChange={(e) => setExternalUrl(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="https://..."
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload File *</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        accept={resourceType === 'PDF' ? '.pdf' : resourceType === 'VIDEO' ? 'video/*' : 'audio/*'}
                                    />
                                </div>
                            )}
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
                                onClick={handleSubmit}
                                disabled={!title || (resourceType === 'LINK' ? !externalUrl : !file) || addResourceMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                            >
                                {addResourceMutation.isPending ? 'Adding...' : 'Add Resource'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitalResources;
