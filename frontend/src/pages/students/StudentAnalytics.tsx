import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Card from '../../components/common/Card';
import ExportButton from '../../components/common/ExportButton';
import { Modal, Input, Button } from '@/design-system';
import api from '@/lib/api';

interface GenderData {
  [key: string]: number;
}

interface ClassData {
  class_name: string;
  count: number;
}

interface AgeData {
  age_range: string;
  count: number;
}

interface DrillDownStudent {
  id: string;
  admission_number: string;
  full_name: string;
  current_class?: string;
  section?: string;
  date_of_birth?: string;
  gender?: string;
  is_active?: boolean;
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

const StudentAnalytics: React.FC = () => {
  const [genderData, setGenderData] = useState<GenderData>({});
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [ageData, setAgeData] = useState<AgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<{ date_from?: string; date_to?: string }>({});

  const [drillDown, setDrillDown] = useState<{ dimension: string; value: string; label: string } | null>(null);
  const [drillDownStudents, setDrillDownStudents] = useState<DrillDownStudent[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const fetchAnalytics = async (filters: { date_from?: string; date_to?: string }) => {
    try {
      setLoading(true);
      const params = { ...filters };

      const [genderRes, classRes, ageRes] = await Promise.all([
        api.get('/students/students/analytics/by-gender/', { params }),
        api.get('/students/students/analytics/by-class/', { params }),
        api.get('/students/students/analytics/by-age/', { params })
      ]);

      setGenderData(genderRes.data);
      setClassData(classRes.data);
      setAgeData(ageRes.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    setAppliedFilters({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const resetDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({});
  };

  const openDrillDown = async (dimension: string, value: string, label: string) => {
    setDrillDown({ dimension, value, label });
    setDrillDownLoading(true);
    setDrillDownStudents([]);
    try {
      const res = await api.get('/students/students/analytics/students/', {
        params: { dimension, value, ...appliedFilters },
      });
      setDrillDownStudents(res.data);
    } catch (err) {
      console.error('Failed to load drill-down students:', err);
    } finally {
      setDrillDownLoading(false);
    }
  };

  // Transform gender data for pie chart
  const genderChartData = Object.entries(genderData).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    value
  }));

  // Recharts click handlers pass the raw datum on some chart types and a
  // wrapped `{ payload: datum }` shape on others - read defensively.
  const readChartField = (entry: any, field: string) => entry?.[field] ?? entry?.payload?.[field];

  const drillDownColumns = [
    { key: 'admission_number', label: 'Admission No.' },
    { key: 'full_name', label: 'Name' },
    { key: 'current_class', label: 'Class' },
    { key: 'section', label: 'Section' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Analytics</h1>
          <p className="text-gray-600">Visual insights into student demographics and distribution. Click a segment to drill down.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Input type="date" label="Admitted from" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" label="Admitted to" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="outline" onClick={applyDateFilter}>Apply</Button>
          <Button variant="ghost" onClick={resetDateFilter}>Reset</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card title="Gender Distribution">
          <div className="flex justify-end mb-2">
            <ExportButton
              data={genderChartData.map(({ name, value }) => ({ name, value }))}
              filename="student_gender_distribution"
              title="Student Gender Distribution"
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={(entry: any) => openDrillDown('gender', readChartField(entry, 'key'), readChartField(entry, 'name'))}
                cursor="pointer"
              >
                {genderChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Age Distribution */}
        <Card title="Age Distribution">
          <div className="flex justify-end mb-2">
            <ExportButton data={ageData} filename="student_age_distribution" title="Student Age Distribution" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age_range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                cursor="pointer"
                onClick={(entry: any) => {
                  const ageRange = readChartField(entry, 'age_range');
                  openDrillDown('age', ageRange, ageRange);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Class Distribution */}
        <div className="lg:col-span-2">
          <Card title="Class Distribution">
            <div className="flex justify-end mb-2">
              <ExportButton data={classData} filename="student_class_distribution" title="Student Class Distribution" />
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const className = readChartField(entry, 'class_name');
                    openDrillDown('class', className, className);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={!!drillDown}
        onClose={() => setDrillDown(null)}
        title={drillDown ? `Students: ${drillDown.label}` : ''}
        size="lg"
      >
        {drillDownLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <ExportButton
                data={drillDownStudents}
                filename={`students_${drillDown?.dimension}_${drillDown?.value}`}
                title={`Students - ${drillDown?.label}`}
                columns={drillDownColumns}
              />
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-2">Admission No.</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {drillDownStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="p-2">{student.admission_number}</td>
                      <td className="p-2">{student.full_name}</td>
                      <td className="p-2">{student.current_class || '—'}</td>
                      <td className="p-2">{student.section || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {drillDownStudents.length === 0 && (
                <p className="text-gray-500 text-sm p-4">No students found for this segment.</p>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default StudentAnalytics;

