import React, { useState, useEffect } from "react";
import api from "../../services/api";

interface Props {
  staffId?: number;
}

const MedicalCheckup: React.FC<Props> = ({ staffId }) => {
  const [checkups, setCheckups] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ checkup_date: "", checkup_type: "ANNUAL", findings: "", recommendations: "", next_checkup_date: "" });

  useEffect(() => {
    if (staffId) fetchCheckups();
  }, [staffId]);

  const fetchCheckups = async () => {
    try {
      const response = await api.get(`/staff/medical-checkups/?staff=${staffId}`);
      setCheckups(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error fetching checkups:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/staff/medical-checkups/", { ...formData, staff: staffId });
      setShowForm(false);
      fetchCheckups();
    } catch (error) {
      console.error("Error saving checkup:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Medical Checkups</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded">Add Checkup</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Checkup Date</label>
            <input type="date" value={formData.checkup_date} onChange={(e) => setFormData({ ...formData, checkup_date: e.target.value })} className="w-full px-3 py-2 border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={formData.checkup_type} onChange={(e) => setFormData({ ...formData, checkup_type: e.target.value })} className="w-full px-3 py-2 border rounded">
              <option value="ANNUAL">Annual</option>
              <option value="PRE_EMPLOYMENT">Pre-Employment</option>
              <option value="ROUTINE">Routine</option>
              <option value="SPECIFIC">Specific Concern</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Findings</label>
            <textarea value={formData.findings} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recommendations</label>
            <textarea value={formData.recommendations} onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </form>
      )}
      <div className="space-y-3">
        {checkups.map((c) => (
          <div key={c.id} className="bg-white border p-4 rounded">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{c.checkup_type}</span>
              <span className="text-sm text-gray-600">{c.checkup_date}</span>
            </div>
            <p className="text-sm">{c.findings}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicalCheckup;
