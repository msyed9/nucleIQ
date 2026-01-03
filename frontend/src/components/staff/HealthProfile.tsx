import React, { useState, useEffect } from "react";
import api from "../../services/api";

interface Props {
  staffId?: number;
  onSuccess?: () => void;
}

const HealthProfile: React.FC<Props> = ({ staffId, onSuccess }) => {
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    blood_group: "",
    known_allergies: "",
    chronic_conditions: "",
    current_medications: "",
    emergency_contact_medical: "",
    emergency_contact_phone_medical: "",
    preferred_hospital: "",
    health_insurance_provider: "",
    health_insurance_policy_number: "",
    health_insurance_coverage_amount: "",
    health_insurance_policy_expiry: "",
  });

  useEffect(() => {
    if (staffId) fetchProfile();
  }, [staffId]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/staff/health-profiles/?staff=${staffId}`);
      const data = response.data.results?.[0] || response.data?.[0];
      if (data) {
        setProfile(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching health profile:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (profile?.id) {
        await api.patch(`/staff/health-profiles/${profile.id}/`, formData);
      } else {
        await api.post("/staff/health-profiles/", { ...formData, staff: staffId });
      }
      fetchProfile();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving health profile:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Height (cm)</label>
          <input type="number" step="0.01" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
          <input type="number" step="0.01" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full px-3 py-2 border rounded" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Blood Group</label>
        <select value={formData.blood_group} onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })} className="w-full px-3 py-2 border rounded">
          <option value="">Select</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Known Allergies</label>
        <textarea value={formData.known_allergies} onChange={(e) => setFormData({ ...formData, known_allergies: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Chronic Conditions</label>
        <textarea value={formData.chronic_conditions} onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Current Medications</label>
        <textarea value={formData.current_medications} onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Emergency Contact (Medical)</label>
          <input type="text" value={formData.emergency_contact_medical} onChange={(e) => setFormData({ ...formData, emergency_contact_medical: e.target.value })} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Emergency Phone</label>
          <input type="text" value={formData.emergency_contact_phone_medical} onChange={(e) => setFormData({ ...formData, emergency_contact_phone_medical: e.target.value })} className="w-full px-3 py-2 border rounded" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Preferred Hospital</label>
        <input type="text" value={formData.preferred_hospital} onChange={(e) => setFormData({ ...formData, preferred_hospital: e.target.value })} className="w-full px-3 py-2 border rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Insurance Provider</label>
          <input type="text" value={formData.health_insurance_provider} onChange={(e) => setFormData({ ...formData, health_insurance_provider: e.target.value })} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Policy Number</label>
          <input type="text" value={formData.health_insurance_policy_number} onChange={(e) => setFormData({ ...formData, health_insurance_policy_number: e.target.value })} className="w-full px-3 py-2 border rounded" />
        </div>
      </div>
      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Health Profile</button>
    </form>
  );
};

export default HealthProfile;
