import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Container } from '@mui/material';
import axios from 'axios';

const BulkAllocateFeeStructure: React.FC = () => {
  const [formData, setFormData] = useState({
    studentIds: '',
    feeStructureId: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        fee_structure_id: formData.feeStructureId,
        student_ids: formData.studentIds
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };

      const response = await axios.post('/api/fees/allocations/bulk_allocate/', payload);
      if (response.status === 200) {
        setSuccess('Fee structure allocated successfully!');
        setFormData({ studentIds: '', feeStructureId: '' });
      }
    } catch (err) {
      setError('Failed to allocate fee structure. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, p: 3, boxShadow: 3, borderRadius: 2, backgroundColor: '#fff' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Bulk Allocate Fee Structure
        </Typography>

        {error && <Typography color="error" align="center">{error}</Typography>}
        {success && <Typography color="primary" align="center">{success}</Typography>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Student IDs (comma-separated)"
            name="studentIds"
            value={formData.studentIds}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Fee Structure ID"
            name="feeStructureId"
            value={formData.feeStructureId}
            onChange={handleChange}
            margin="normal"
            required
          />

          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Allocate Fee Structure
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default BulkAllocateFeeStructure; 