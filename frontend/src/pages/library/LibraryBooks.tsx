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

const LibraryBooks: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  useEffect(() => { fetchBooks(); /* eslint-disable-next-line */ }, [page, search]);

  const fetchBooks = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/library/books/', { params: { page, page_size: pageSize, search } });
      if (res.data && res.data.results) { setBooks(res.data.results); setTotal(Number(res.data.count || 0)); }
      else if (Array.isArray(res.data)) { setBooks(res.data); setTotal(res.data.length); }
      else { setBooks([res.data]); setTotal(1); }
    } catch (e: any) { setError(e?.response?.data?.detail || 'Failed to load books'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number | string) => { if (!confirm('Delete this book?')) return; try { await api.delete(`/library/books/${id}/`); fetchBooks(); } catch (e) { alert('Delete failed'); } };
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);

  const openCreate = () => { setTitle(''); setAuthor(''); setFormError(null); setEditingId(null); setCreateOpen(true); };
  const closeCreate = () => { setEditingId(null); setCreateOpen(false); };

  const openEdit = (book: any) => {
    setFormError(null);
    setTitle(book.title || '');
    setAuthor(book.author || '');
    setEditingId(book.id);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setFormError(null);
    if (!title.trim()) { setFormError('Title is required'); return; }
    const payload: any = { title: title.trim() };
    if (author.trim()) payload.author = author.trim();
    try {
      if (editingId) await api.patch(`/library/books/${editingId}/`, payload);
      else await api.post('/library/books/', payload);
      closeCreate(); fetchBooks();
    } catch (e: any) { setFormError(e?.response?.data?.detail || 'Create failed'); }
  };

  const columns = books.length > 0 ? Object.keys(books[0]) : ['id','title','author'];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4">Library - Books</Typography>
          <Typography variant="body2" color="textSecondary">Browse library catalog</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button variant="contained" onClick={() => { setSearch(''); setPage(1); }}>Clear</Button>
          <Button variant="outlined" onClick={openCreate}>Add</Button>
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Add Book</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextField label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            {formError && <Typography color="error">{formError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate}>Cancel</Button>
          <Button variant="contained" onClick={submitCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : books.length === 0 ? <Typography>No books found.</Typography> : (
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
                {books.map((b, i) => (
                  <TableRow key={i} hover>
                    {columns.map(c => <TableCell key={c}>{String(b[c] ?? '')}</TableCell>)}
                    <TableCell>
                        <Button size="small" onClick={() => openEdit(b)}>Edit</Button>
                        <Button size="small" onClick={() => handleDelete(b.id)}>Delete</Button>
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

export default LibraryBooks;
