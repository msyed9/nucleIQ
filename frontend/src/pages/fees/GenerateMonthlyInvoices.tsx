import React, { useState } from 'react';
import { Button, Typography, Box, Container } from '@mui/material';
import axios from 'axios';

const GenerateMonthlyInvoices: React.FC = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerateInvoices = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/fees/invoices/generate_monthly/');
      if (response.status === 200) {
        setSuccess('Monthly invoices generated successfully!');
      }
    } catch (err) {
      setError('Failed to generate monthly invoices. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, p: 3, boxShadow: 3, borderRadius: 2, backgroundColor: '#fff' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Generate Invoices
        </Typography>

        {error && <Typography color="error" align="center">{error}</Typography>}
        {success && <Typography color="primary" align="center">{success}</Typography>}

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleGenerateInvoices}
          >
            Generate Invoices
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default GenerateMonthlyInvoices;