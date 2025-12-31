import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import './ResultEntry.css';

interface Exam {
    id: string;
    name: string;
    exam_name?: string;
    subject: string;
    subject_name: string;
    grade_level: string;
    grade_level_name: string;
    total_marks: number;
    passing_marks: number;
    sections: string[];
}

interface Section {
    id: string;
    name: string;
    grade_level: string;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    roll_number: string;
    photo?: string;
}

interface ResultEntry {
    student_id: string;
    marks_obtained: string;
    is_absent: boolean;
    remarks: string;
}

const ResultEntry: React.FC = () => {
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [results, setResults] = useState<Map<string, ResultEntry>>(new Map());
    const queryClient = useQueryClient();

    // Fetch exams
    const { data: exams, isLoading: examsLoading } = useQuery({
        queryKey: ['exams'],
        queryFn: async () => {
            const response = await axios.get('/api/exams/exams/');
            return response.data;
        }
    });

    // Fetch sections
    const { data: sections } = useQuery({
        queryKey: ['sections'],
        queryFn: async () => {
            const response = await axios.get('/api/tenants/sections/');
            return response.data;
        }
    });

    // Fetch students for selected section
    const { data: students, isLoading: studentsLoading } = useQuery({
        queryKey: ['students', selectedSection],
        queryFn: async () => {
            const response = await axios.get(`/api/students/students/?section=${selectedSection}`);
            return response.data;
        },
        enabled: !!selectedSection
    });

    // Fetch existing results
    const { data: existingResults } = useQuery({
        queryKey: ['results', selectedExam, selectedSection],
        queryFn: async () => {
            const response = await axios.get(`/api/exams/results/?exam=${selectedExam}&section=${selectedSection}`);
            return response.data;
        },
        enabled: !!selectedExam && !!selectedSection
    });

    // Load existing results into form
    useEffect(() => {
        if (existingResults && existingResults.length > 0) {
            const newResults = new Map<string, ResultEntry>();
            existingResults.forEach((result: any) => {
                newResults.set(result.student, {
                    student_id: result.student,
                    marks_obtained: result.marks_obtained.toString(),
                    is_absent: result.is_absent,
                    remarks: result.remarks || ''
                });
            });
            setResults(newResults);
        }
    }, [existingResults]);

    // Bulk entry mutation
    const bulkEntryMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post('/api/exams/results/bulk_entry/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['results'] });
            alert('Results saved successfully!');
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.message || 'Failed to save results'}`);
        }
    });

    const selectedExamData = exams?.find((e: Exam) => e.id === selectedExam);

    const handleMarksChange = (studentId: string, marks: string) => {
        const current = results.get(studentId) || {
            student_id: studentId,
            marks_obtained: '',
            is_absent: false,
            remarks: ''
        };
        
        setResults(new Map(results.set(studentId, {
            ...current,
            marks_obtained: marks,
            is_absent: false
        })));
    };

    const handleAbsentToggle = (studentId: string) => {
        const current = results.get(studentId) || {
            student_id: studentId,
            marks_obtained: '0',
            is_absent: false,
            remarks: ''
        };
        
        setResults(new Map(results.set(studentId, {
            ...current,
            is_absent: !current.is_absent,
            marks_obtained: !current.is_absent ? '0' : current.marks_obtained
        })));
    };

    const handleRemarksChange = (studentId: string, remarks: string) => {
        const current = results.get(studentId) || {
            student_id: studentId,
            marks_obtained: '',
            is_absent: false,
            remarks: ''
        };
        
        setResults(new Map(results.set(studentId, {
            ...current,
            remarks
        })));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedExam || !selectedSection) {
            alert('Please select exam and section');
            return;
        }

        const resultsArray = Array.from(results.values());
        
        bulkEntryMutation.mutate({
            exam_id: selectedExam,
            section_id: selectedSection,
            results: resultsArray
        });
    };

    const calculatePercentage = (marks: string) => {
        if (!selectedExamData || !marks) return 0;
        return ((parseFloat(marks) / selectedExamData.total_marks) * 100).toFixed(2);
    };

    return (
        <div className="result-entry-container">
            <div className="page-header">
                <h1>📝 Result Entry</h1>
                <p>Enter exam results for students</p>
            </div>

            <div className="result-entry-card">
                {/* Selection Section */}
                <div className="selection-section">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="exam">Select Exam *</label>
                            <select
                                id="exam"
                                value={selectedExam}
                                onChange={(e) => {
                                    setSelectedExam(e.target.value);
                                    setResults(new Map());
                                }}
                                disabled={examsLoading}
                            >
                                <option value="">-- Select Exam --</option>
                                {exams?.map((exam: Exam) => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.name} - {exam.subject_name} ({exam.grade_level_name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="section">Select Section *</label>
                            <select
                                id="section"
                                value={selectedSection}
                                onChange={(e) => {
                                    setSelectedSection(e.target.value);
                                    setResults(new Map());
                                }}
                            >
                                <option value="">-- Select Section --</option>
                                {sections?.map((section: Section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedExamData && (
                        <div className="exam-info">
                            <div className="info-item">
                                <span className="label">Total Marks:</span>
                                <span className="value">{selectedExamData.total_marks}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Passing Marks:</span>
                                <span className="value">{selectedExamData.passing_marks}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Subject:</span>
                                <span className="value">{selectedExamData.subject_name}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Table */}
                {selectedExam && selectedSection && (
                    <form onSubmit={handleSubmit}>
                        {studentsLoading ? (
                            <div className="loading">Loading students...</div>
                        ) : students && students.length > 0 ? (
                            <>
                                <div className="results-table-container">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th>Roll No.</th>
                                                <th>Student Name</th>
                                                <th>Marks Obtained</th>
                                                <th>Percentage</th>
                                                <th>Absent</th>
                                                <th>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student: Student) => {
                                                const result = results.get(student.id);
                                                const marks = result?.marks_obtained || '';
                                                const isAbsent = result?.is_absent || false;
                                                const percentage = calculatePercentage(marks);
                                                const isPassing = parseFloat(marks) >= (selectedExamData?.passing_marks || 0);

                                                return (
                                                    <tr key={student.id} className={isAbsent ? 'absent-row' : ''}>
                                                        <td>{student.roll_number}</td>
                                                        <td className="student-name">
                                                            {student.photo && (
                                                                <img 
                                                                    src={student.photo} 
                                                                    alt={`${student.first_name} ${student.last_name}`}
                                                                    className="student-photo"
                                                                />
                                                            )}
                                                            {student.first_name} {student.last_name}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={selectedExamData?.total_marks}
                                                                value={marks}
                                                                onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                                                disabled={isAbsent}
                                                                className="marks-input"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td>
                                                            <span className={`percentage ${isPassing ? 'pass' : 'fail'}`}>
                                                                {marks ? `${percentage}%` : '-'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <label className="checkbox-label">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAbsent}
                                                                    onChange={() => handleAbsentToggle(student.id)}
                                                                />
                                                                <span className="checkmark"></span>
                                                            </label>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={result?.remarks || ''}
                                                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                                                className="remarks-input"
                                                                placeholder="Optional remarks"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setResults(new Map());
                                            setSelectedExam('');
                                            setSelectedSection('');
                                        }}
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={bulkEntryMutation.isPending}
                                    >
                                        {bulkEntryMutation.isPending ? 'Saving...' : 'Save Results'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="no-data">
                                <p>No students found in this section.</p>
                            </div>
                        )}
                    </form>
                )}

                {!selectedExam && !selectedSection && (
                    <div className="no-selection">
                        <p>👆 Please select an exam and section to begin entering results</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultEntry;
