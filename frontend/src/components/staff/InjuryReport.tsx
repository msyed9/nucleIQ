import React, { useState, useEffect } from "react";
import api from "../../services/api";

interface Props {
  staffId?: number;
}

const InjuryReport: React.FC<Props> = ({ staffId }) => {
  const [injuries, setInjuries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ incident_date: "", location: "", description: "", severity: "MINOR", treatment_given: "", hospital_visit: false, days_off: 0 });

  useEffect(() => {
    if (staffId) fetchInjuries();
  }, [staffId]);

  const fetchInjuries = async () => {
    try {
      const response = await api.get(`/staff/injury-reports/?staff=${staffId}`);
      setInjuries(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error fetching injuries:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/staff/injury-reports/", { ...formData, staff: staffId });
      setShowForm(false);
      fetchInjuries();
    } catch (error) {
      console.error("Error saving injury:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Injury Reports</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-red-600 text-white rounded">Report Injury</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Incident Date</label>
              <input type="date" value={formData.incident_date} onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border rounded" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="w-full px-3 py-2 border rounded">
                <option value="MINOR">Minor</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hospital Visit</label>
              <select value={formData.hospital_visit.toString()} onChange={(e) => setFormData({ ...formData, hospital_visit: e.target.value === 'true' })} className="w-full px-3 py-2 border rounded">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Days Off</label>
              <input type="number" value={formData.days_off} onChange={(e) => setFormData({ ...formData, days_off: Number(e.target.value) })} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Submit Report</button>
        </form>
      )}
      <div className="space-y-3">
        {injuries.map((i) => (
          <div key={i.id} className={`border p-4 rounded ${i.severity === 'SEVERE' ? 'border-red-500 bg-red-50' : 'bg-white'}`}>
            <div className="flex justify-between mb-2">
              <span className="font-medium">{i.incident_date} - {i.location}</span>
              <span className={`px-2 py-1 text-xs rounded ${i.severity === 'SEVERE' ? 'bg-red-600 text-white' : i.severity === 'MODERATE' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}>{i.severity}</span>
            </div>
            <p className="text-sm">{i.description}</p>
            {i.hospital_visit && <p className="text-sm text-red-600 mt-2">Hospital visit required</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InjuryReport;
