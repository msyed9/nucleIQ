import React, { useState, useEffect } from "react";
import api from "../../services/api";

interface Props {
  staffId?: number;
}

const VaccinationRecord: React.FC<Props> = ({ staffId }) => {
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ vaccine_name: "", administered_date: "", next_due_date: "", batch_number: "", provider: "", notes: "" });

  useEffect(() => {
    if (staffId) fetchVaccinations();
  }, [staffId]);

  const fetchVaccinations = async () => {
    try {
      const response = await api.get(`/staff/vaccinations/?staff=${staffId}`);
      setVaccinations(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error fetching vaccinations:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/staff/vaccinations/", { ...formData, staff: staffId });
      setShowForm(false);
      fetchVaccinations();
      setFormData({ vaccine_name: "", administered_date: "", next_due_date: "", batch_number: "", provider: "", notes: "" });
    } catch (error) {
      console.error("Error saving vaccination:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Vaccination Records</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded">Add Vaccination</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vaccine Name</label>
              <input type="text" value={formData.vaccine_name} onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Administered</label>
              <input type="date" value={formData.administered_date} onChange={(e) => setFormData({ ...formData, administered_date: e.target.value })} className="w-full px-3 py-2 border rounded" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Next Due Date</label>
              <input type="date" value={formData.next_due_date} onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <input type="text" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </form>
      )}
      <div className="space-y-3">
        {vaccinations.map((v) => (
          <div key={v.id} className="bg-white border p-4 rounded">
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">{v.vaccine_name}</h4>
                <p className="text-sm text-gray-600">Administered: {v.administered_date}</p>
                {v.next_due_date && <p className="text-sm text-gray-600">Next Due: {v.next_due_date}</p>}
              </div>
              <span className="text-sm text-gray-500">{v.provider}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VaccinationRecord;
