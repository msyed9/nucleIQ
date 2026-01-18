import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Alumni.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const AlumniPortal: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('jobs');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            const tenantId = localStorage.getItem('current_tenant');
            const headers = {
                Authorization: `Bearer ${token}`,
                'X-Tenant-ID': tenantId || ''
            };
            const [jobRes, campRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/alumni/jobs/`, { headers }),
                axios.get(`${API_BASE_URL}/alumni/campaigns/`, { headers })
            ]);
            setJobs(jobRes.data);
            setCampaigns(campRes.data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            <div className="alumni-hero">
                <h1 className="text-4xl font-bold mb-2">🎓 Alumni Network</h1>
                <p className="text-lg opacity-90">Connect, Give Back, and Grow Together</p>

                <div className="mt-8 flex justify-center space-x-4">
                    <button
                        className={`px-6 py-2 rounded-full font-semibold ${activeTab === 'jobs' ? 'bg-white text-blue-600' : 'bg-blue-700 text-white'}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        Job Board
                    </button>
                    <button
                        className={`px-6 py-2 rounded-full font-semibold ${activeTab === 'campaigns' ? 'bg-white text-blue-600' : 'bg-blue-700 text-white'}`}
                        onClick={() => setActiveTab('campaigns')}
                    >
                        Fundraising
                    </button>
                </div>
            </div>

            <div className="alumni-grid">
                {activeTab === 'jobs' && jobs.map(job => (
                    <div key={job.id} className="job-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                                <p className="text-gray-600 font-medium">{job.company}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{job.location}</span>
                        </div>
                        <p className="mt-4 text-gray-500 line-clamp-3">{job.description}</p>
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-gray-400">Posted by {job.posted_by_name}</span>
                            <a
                                href={job.apply_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 font-semibold hover:underline"
                            >
                                Apply Now →
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <div className="alumni-grid">
                {activeTab === 'campaigns' && campaigns.map(camp => {
                    const progress = Math.min((camp.collected_amount / camp.goal_amount) * 100, 100);
                    return (
                        <div key={camp.id} className="campaign-card p-6">
                            <h3 className="font-bold text-xl mb-2">{camp.title}</h3>
                            <p className="text-gray-600 mb-4">{camp.description}</p>

                            <div className="mb-2 flex justify-between text-sm font-semibold">
                                <span>₹{camp.collected_amount} raised</span>
                                <span className="text-gray-400">of ₹{camp.goal_amount}</span>
                            </div>
                            <div className="campaign-progress">
                                <div className="campaign-bar" style={{ width: `${progress}%` }}></div>
                            </div>

                            <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition">
                                Donate Now
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AlumniPortal;
