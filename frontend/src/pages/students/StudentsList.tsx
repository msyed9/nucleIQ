import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
} from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const StudentsList: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/students/students/', { params: { page, page_size: pageSize, search } });
      if (res.data && res.data.results) {
        setStudents(res.data.results);
        setTotal(Number(res.data.count || 0));
      } else if (Array.isArray(res.data)) {
        setStudents(res.data);
        setTotal(res.data.length);
      } else {
        setStudents([res.data]);
        setTotal(1);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/students/${id}/`);
      fetchStudents();
    } catch (e) {
      alert('Delete failed');
    }
  };
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);

  const openCreate = () => { setFormError(null); setFirstName(''); setLastName(''); setAdmissionNo(''); setEditingId(null); setCreateOpen(true); };
  const closeCreate = () => { setEditingId(null); setCreateOpen(false); };

  const openEdit = (student: any) => {
    setFormError(null);
    setFirstName(student.first_name || student.firstName || '');
    setLastName(student.last_name || student.lastName || '');
    setAdmissionNo(student.admission_no || student.admissionNo || '');
    setEditingId(student.id);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setFormError(null);
    if (!firstName.trim() || !lastName.trim()) { setFormError('First and last name are required'); return; }
    const payload: any = { first_name: firstName.trim(), last_name: lastName.trim() };
    if (admissionNo.trim()) payload.admission_no = admissionNo.trim();
    try {
      if (editingId) {
        await api.patch(`/students/students/${editingId}/`, payload);
      } else {
        await api.post('/students/students/', payload);
      }
      closeCreate();
      fetchStudents();
    } catch (e: any) {
      setFormError(e?.response?.data?.detail || 'Save failed');
    }
  };

  const columns = students.length > 0 ? Object.keys(students[0]) : ['id', 'name'];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4">Students</Typography>
          <Typography variant="body2" color="textSecondary">List of students</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search students" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button variant="contained" onClick={() => { setSearch(''); setPage(1); }}>Clear</Button>
          <Button variant="outlined" onClick={openCreate}>Add</Button>
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <TextField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <TextField label="Admission No (optional)" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} />
            {formError && <Typography color="error">{formError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate}>Cancel</Button>
          <Button variant="contained" onClick={submitCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : students.length === 0 ? (
        <Typography>No students found.</Typography>
      ) : (
        <>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((c) => (
                    <TableCell key={c}>{c}</TableCell>
                  ))}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s, i) => (
                  <TableRow key={i} hover>
                    {columns.map((c) => (
                      <TableCell key={c}>{String(s[c] ?? '')}</TableCell>
                    ))}
                    <TableCell>
                        <Button size="small" onClick={() => openEdit(s)}>Edit</Button>
                        <Button size="small" onClick={() => handleDelete(s.id)}>Delete</Button>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Typography>Page {page} — {total} items</Typography>
            <Button variant="outlined" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total}>Next</Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default StudentsList;
