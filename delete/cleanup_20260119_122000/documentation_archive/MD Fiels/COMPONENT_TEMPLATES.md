# Component Implementation Templates for Phase 6

This file provides copy-paste ready templates for implementing the remaining Phase 6 components.
All components follow the same pattern established in the completed components.

## Template Structure

Every component follows this pattern:

1. **Imports**: React hooks, useTranslation, api service
2. **Interfaces**: Props and data type definitions  
3. **State**: useState for data management
4. **Effects**: useEffect for data fetching
5. **Handlers**: Functions for user actions
6. **Render**: JSX with Tailwind CSS classes

## Health Records Components Template

### HealthRecords.tsx (Page)
\\\	ypescript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import HealthProfile from '../../components/staff/HealthProfile';
import MedicalCheckup from '../../components/staff/MedicalCheckup';
import VaccinationRecord from '../../components/staff/VaccinationRecord';
import InjuryReport from '../../components/staff/InjuryReport';

const HealthRecords: React.FC = () => {
    const { t } = useTranslation();
    const [view, setView] = useState<'profile' | 'checkups' | 'vaccinations' | 'injuries'>('profile');
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Staff Health Records</h1>
            
            {/* View selector tabs */}
            <div className="flex space-x-2 mb-6">
                <button onClick={() => setView('profile')} className={\px-4 py-2 rounded \\}>
                    Profile
                </button>
                <button onClick={() => setView('checkups')} className={\px-4 py-2 rounded \\}>
                    Checkups
                </button>
                <button onClick={() => setView('vaccinations')} className={\px-4 py-2 rounded \\}>
                    Vaccinations
                </button>
                <button onClick={() => setView('injuries')} className={\px-4 py-2 rounded \\}>
                    Injury Reports
                </button>
            </div>

            {/* Content based on view */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                {view === 'profile' && <HealthProfile staffId={selectedStaff?.id} />}
                {view === 'checkups' && <MedicalCheckup staffId={selectedStaff?.id} />}
                {view === 'vaccinations' && <VaccinationRecord staffId={selectedStaff?.id} />}
                {view === 'injuries' && <InjuryReport staffId={selectedStaff?.id} />}
            </div>
        </div>
    );
};

export default HealthRecords;
\\\

### HealthProfile.tsx (Component)
\\\	ypescript
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Props {
    staffId?: number;
}

const HealthProfile: React.FC<Props> = ({ staffId }) => {
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        height: '',
        weight: '',
        blood_group: '',
        known_allergies: '',
        chronic_conditions: '',
        current_medications: '',
        emergency_contact_medical: '',
        emergency_contact_phone_medical: '',
        preferred_hospital: '',
        health_insurance_provider: '',
        health_insurance_policy_number: '',
        health_insurance_coverage_amount: '',
        health_insurance_policy_expiry: ''
    });

    useEffect(() => {
        if (staffId) {
            fetchProfile();
        }
    }, [staffId]);

    const fetchProfile = async () => {
        try {
            const response = await api.get(\/staff/health-profiles/?staff=\\);
            const data = response.data.results?.[0] || response.data?.[0];
            if (data) {
                setProfile(data);
                setFormData(data);
            }
        } catch (error) {
            console.error('Error fetching health profile:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (profile?.id) {
                await api.patch(\/staff/health-profiles/\/\, formData);
            } else {
                await api.post('/staff/health-profiles/', { ...formData, staff: staffId });
            }
            fetchProfile();
        } catch (error) {
            console.error('Error saving health profile:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Height (cm)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
            </div>

            {/* Add more fields following the same pattern */}
            
            <div>
                <label className="block text-sm font-medium mb-1">Known Allergies</label>
                <textarea
                    value={formData.known_allergies}
                    onChange={(e) => setFormData({ ...formData, known_allergies: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                />
            </div>

            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save Health Profile
            </button>
        </form>
    );
};

export default HealthProfile;
\\\

## Training Management Components Template

### TrainingManagement.tsx (Page)
\\\	ypescript
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import TrainingForm from '../../components/staff/TrainingForm';
import TrainingEnrollment from '../../components/staff/TrainingEnrollment';

const TrainingManagement: React.FC = () => {
    const [programs, setPrograms] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<any>(null);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const response = await api.get('/staff/training-programs/');
            setPrograms(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching training programs:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Training Management</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Create Training Program
                </button>
            </div>

            <div className="grid gap-4">
                {programs.map((program) => (
                    <div key={program.id} className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-semibold text-lg mb-2">{program.program_name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">
                                {program.start_date} to {program.end_date}
                            </span>
                            <button
                                onClick={() => setSelectedProgram(program)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <TrainingForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchPrograms();
                    }}
                />
            )}
        </div>
    );
};

export default TrainingManagement;
\\\

## Appraisal Management Components Template

### AppraisalManagement.tsx (Page)
\\\	ypescript
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AppraisalCycleForm from '../../components/staff/AppraisalCycleForm';
import AppraisalForm from '../../components/staff/AppraisalForm';

const AppraisalManagement: React.FC = () => {
    const [cycles, setCycles] = useState<any[]>([]);
    const [appraisals, setAppraisals] = useState<any[]>([]);
    const [showCycleForm, setShowCycleForm] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<any>(null);

    useEffect(() => {
        fetchCycles();
    }, []);

    const fetchCycles = async () => {
        try {
            const response = await api.get('/staff/appraisal-cycles/');
            setCycles(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching cycles:', error);
        }
    };

    const fetchAppraisals = async (cycleId: number) => {
        try {
            const response = await api.get(\/staff/appraisals/?appraisal_cycle=\\);
            setAppraisals(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching appraisals:', error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Appraisal Management</h1>
            
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Appraisal Cycles</h2>
                    <button
                        onClick={() => setShowCycleForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Create New Cycle
                    </button>
                </div>

                {cycles.map((cycle) => (
                    <div key={cycle.id} className="border-b py-3 flex justify-between items-center">
                        <div>
                            <h3 className="font-medium">{cycle.name}</h3>
                            <p className="text-sm text-gray-600">
                                {cycle.start_date} to {cycle.end_date}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedCycle(cycle);
                                fetchAppraisals(cycle.id);
                            }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                        >
                            View Appraisals
                        </button>
                    </div>
                ))}
            </div>

            {showCycleForm && (
                <AppraisalCycleForm
                    onClose={() => setShowCycleForm(false)}
                    onSuccess={() => {
                        setShowCycleForm(false);
                        fetchCycles();
                    }}
                />
            )}
        </div>
    );
};

export default AppraisalManagement;
\\\

## API Integration Pattern

All components follow this API integration pattern:

1. **Fetching Data:**
\\\	ypescript
const fetchData = async () => {
    try {
        const response = await api.get('/staff/endpoint/');
        setData(response.data.results || response.data || []);
    } catch (error) {
        console.error('Error fetching data:', error);
        // Optionally show error toast
    }
};
\\\

2. **Creating Data:**
\\\	ypescript
const handleCreate = async (formData: any) => {
    try {
        await api.post('/staff/endpoint/', formData);
        onSuccess();
    } catch (error) {
        console.error('Error creating:', error);
    }
};
\\\

3. **Updating Data:**
\\\	ypescript
const handleUpdate = async (id: number, formData: any) => {
    try {
        await api.patch(\/staff/endpoint/\/\, formData);
        onSuccess();
    } catch (error) {
        console.error('Error updating:', error);
    }
};
\\\

4. **Custom Actions:**
\\\	ypescript
const handleCustomAction = async (id: number, data: any) => {
    try {
        await api.post(\/staff/endpoint/\/custom_action/\, data);
        onSuccess();
    } catch (error) {
        console.error('Error:', error);
    }
};
\\\

## Form Pattern

All forms follow this pattern:

\\\	ypescript
const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    // ... more fields
});

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API call here
};

return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium mb-1">Field Label</label>
            <input
                type="text"
                value={formData.field1}
                onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
                className="w-full px-3 py-2 border rounded"
            />
        </div>
        
        <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
                Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Submit
            </button>
        </div>
    </form>
);
\\\

Use these templates to quickly implement the remaining components!
