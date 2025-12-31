import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
} from '@mui/material';

const AttendanceAggregates: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetchAggregates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchAggregates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/attendance/aggregates/', {
        params: { page, page_size: pageSize, search },
      });

      if (res.data && res.data.results) {
        setRows(res.data.results);
        setTotal(Number(res.data.count || 0));
      } else if (Array.isArray(res.data)) {
        setRows(res.data);
        setTotal(res.data.length);
      } else {
        setRows([res.data]);
        setTotal(1);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load attendance aggregates');
    } finally {
      setLoading(false);
    }
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => {
    const max = Math.max(1, Math.ceil(total / pageSize));
    setPage(p => Math.min(max, p + 1));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4">Attendance Aggregates</Typography>
          <Typography variant="body2" color="textSecondary">Overview of attendance summaries by period / class</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button variant="contained" onClick={() => { setSearch(''); setPage(1); }}>Clear</Button>
        </Box>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : rows.length === 0 ? (
        <Typography>No aggregate data available.</Typography>
      ) : (
        <>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((c) => (
                    <TableCell key={c}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c}>{String(r[c] ?? '')}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" onClick={handlePrev} disabled={page === 1}>Previous</Button>
            <Typography>Page {page} — {total} items</Typography>
            <Button variant="outlined" onClick={handleNext} disabled={page * pageSize >= total}>Next</Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default AttendanceAggregates;
