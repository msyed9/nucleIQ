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

const TransportAllocations: React.FC = () => {
  const [allocs, setAllocs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  useEffect(() => { fetchAllocations(); /* eslint-disable-next-line */ }, [page, search]);

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/transport/allocations/', { params: { page, page_size: pageSize, search } });
      if (res.data && res.data.results) {
        setAllocs(res.data.results);
        setTotal(Number(res.data.count || 0));
      } else if (Array.isArray(res.data)) {
        setAllocs(res.data);
        setTotal(res.data.length);
      } else {
        setAllocs([res.data]);
        setTotal(1);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load transport allocations');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Delete this allocation?')) return;
    try { await api.delete(`/transport/allocations/${id}/`); fetchAllocations(); } catch (e) { alert('Delete failed'); }
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);

  const openCreate = () => { setStudentId(''); setRouteId(''); setFormError(null); setEditingId(null); setCreateOpen(true); };
  const closeCreate = () => { setEditingId(null); setCreateOpen(false); };

  const getId = (v: any) => { if (!v && v !== 0) return ''; if (typeof v === 'object') return String(v.id ?? ''); return String(v); };

  const openEdit = (alloc: any) => {
    setFormError(null);
    setStudentId(getId(alloc.student));
    setRouteId(getId(alloc.route));
    setEditingId(alloc.id);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setFormError(null);
    if (!studentId.trim() || !routeId.trim()) { setFormError('Student and route are required'); return; }
    const payload = { student: Number(studentId), route: Number(routeId) };
    try {
      if (editingId) await api.patch(`/transport/allocations/${editingId}/`, payload);
      else await api.post('/transport/allocations/', payload);
      closeCreate(); fetchAllocations();
    } catch (e: any) { setFormError(e?.response?.data?.detail || 'Create failed'); }
  };

  const columns = allocs.length > 0 ? Object.keys(allocs[0]) : ['id', 'student', 'route'];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4">Transport Allocations</Typography>
          <Typography variant="body2" color="textSecondary">Student transport allocations and routes</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button variant="contained" onClick={() => { setSearch(''); setPage(1); }}>Clear</Button>
          <Button variant="outlined" onClick={openCreate}>Add</Button>
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>New Transport Allocation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
            <TextField label="Route ID" value={routeId} onChange={(e) => setRouteId(e.target.value)} required />
            {formError && <Typography color="error">{formError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate}>Cancel</Button>
          <Button variant="contained" onClick={submitCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : allocs.length === 0 ? <Typography>No allocations available.</Typography> : (
        <>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((c) => <TableCell key={c}>{c}</TableCell>)}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocs.map((a,i) => (
                  <TableRow key={i} hover>
                    {columns.map((c) => <TableCell key={c}>{String(a[c] ?? '')}</TableCell>)}
                    <TableCell>
                        <Button size="small" onClick={() => openEdit(a)}>Edit</Button>
                        <Button size="small" onClick={() => handleDelete(a.id)}>Delete</Button>
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

export default TransportAllocations;
