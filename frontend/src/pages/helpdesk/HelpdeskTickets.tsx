import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Container, Typography, Box, CircularProgress, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const HelpdeskTickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  useEffect(() => { fetchTickets(); }, [page, search]);

  const fetchTickets = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/helpdesk/tickets/', { params: { page, page_size: pageSize, search } });
      if (res.data && res.data.results) { setTickets(res.data.results); setTotal(Number(res.data.count || 0)); }
      else if (Array.isArray(res.data)) { setTickets(res.data); setTotal(res.data.length); }
      else { setTickets([res.data]); setTotal(1); }
    } catch (e: any) { setError(e?.response?.data?.detail || 'Failed to load tickets'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number | string) => { if (!confirm('Delete this ticket?')) return; try { await api.delete(`/helpdesk/tickets/${id}/`); fetchTickets(); } catch (e) { alert('Delete failed'); } };

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);

  const openCreate = () => { setTitle(''); setDescription(''); setFormError(null); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  
  const openEdit = (ticket: any) => {
    setFormError(null);
    setTitle(ticket.title || '');
    setDescription(ticket.description || '');
    setEditingId(ticket.id);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setFormError(null);
    if (!title.trim()) { setFormError('Title is required'); return; }
    try {
      if (editingId) await api.patch(`/helpdesk/tickets/${editingId}/`, { title: title.trim(), description: description.trim() });
      else await api.post('/helpdesk/tickets/', { title: title.trim(), description: description.trim() });
      closeCreate(); fetchTickets();
    } catch (e: any) { setFormError(e?.response?.data?.detail || 'Create failed'); }
  };

  const columns = tickets.length > 0 ? Object.keys(tickets[0]) : ['id','title','status'];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4">Helpdesk Tickets</Typography>
          <Typography variant="body2" color="textSecondary">View and manage support tickets</Typography>
        </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button variant="contained" onClick={() => { setSearch(''); setPage(1); }}>Clear</Button>
          <Button variant="outlined" onClick={openCreate}>Add</Button>
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Create Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} />
            {formError && <Typography color="error">{formError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate}>Cancel</Button>
          <Button variant="contained" onClick={submitCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : tickets.length === 0 ? <Typography>No tickets found.</Typography> : (
        <>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map(c => <TableCell key={c}>{c}</TableCell>)}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((t,i) => (
                  <TableRow key={i} hover>
                    {columns.map(c => <TableCell key={c}>{String(t[c] ?? '')}</TableCell>)}
                    <TableCell>
                        <Button size="small" onClick={() => openEdit(t)}>Edit</Button>
                        <Button size="small" onClick={() => handleDelete(t.id)}>Delete</Button>
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

export default HelpdeskTickets;
