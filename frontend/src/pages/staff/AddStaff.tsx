import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Container } from '@mui/material';
import axios from 'axios';

const AddStaff: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
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
      const response = await axios.post('/api/staff/staff/', formData);
      if (response.status === 201) {
        setSuccess('Staff member added successfully!');
        setFormData({ name: '', email: '', role: '' });
      }
    } catch (err) {
      setError('Failed to add staff member. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, p: 3, boxShadow: 3, borderRadius: 2, backgroundColor: '#fff' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Add Staff Member
        </Typography>

        {error && <Typography color="error" align="center">{error}</Typography>}
        {success && <Typography color="primary" align="center">{success}</Typography>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
            required
          />

          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Add Staff
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default AddStaff;