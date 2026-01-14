import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Checkbox,
    Alert,
    Snackbar,
    Tooltip,
} from '@mui/material';
import {
    RestoreFromTrash as RestoreIcon,
    DeleteForever as DeleteForeverIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface DeletedItem {
    id: string;
    entity_type: string;
    entity_type_display: string;
    name: string;
    description: string;
    deleted_at: string;
    deleted_by: string | null;
    deleted_by_email: string | null;
    created_at: string;
    can_restore: boolean;
}

interface EntityType {
    value: string;
    label: string;
}

const RecycleBin: React.FC = () => {
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [filterEntityType, setFilterEntityType] = useState('all');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Selection
    const [selected, setSelected] = useState<string[]>([]);

    // Dialogs
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'restore' | 'delete' | 'bulk-restore' | 'bulk-delete';
        item?: DeletedItem;
    }>({ open: false, type: 'restore' });

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        fetchItems();
    }, [page, rowsPerPage, filterEntityType, filterSearch, filterStartDate, filterEndDate]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', (page + 1).toString());
            params.append('page_size', rowsPerPage.toString());

            if (filterEntityType !== 'all') params.append('entity_type', filterEntityType);
            if (filterSearch) params.append('search', filterSearch);
            if (filterStartDate) params.append('start_date', filterStartDate);
            if (filterEndDate) params.append('end_date', filterEndDate);

            const response = await api.get(`/recycle-bin/?${params.toString()}`);
            setItems(response.data.results || []);
            setTotalCount(response.data.count || 0);
            if (response.data.entity_types) {
                setEntityTypes(response.data.entity_types);
            }
        } catch (error) {
            console.error('Error fetching recycle bin:', error);
            setSnackbar({ open: true, message: 'Failed to load recycle bin', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (item: DeletedItem) => {
        try {
            await api.post(`/recycle-bin/restore/${item.entity_type}/${item.id}/`);
            setSnackbar({ open: true, message: `${item.name} restored successfully`, severity: 'success' });
            fetchItems();
        } catch (error) {
            console.error('Error restoring item:', error);
            setSnackbar({ open: true, message: 'Failed to restore item', severity: 'error' });
        }
        setConfirmDialog({ open: false, type: 'restore' });
    };

    const handlePermanentDelete = async (item: DeletedItem) => {
        try {
            await api.delete(`/recycle-bin/permanent-delete/${item.entity_type}/${item.id}/?confirm=true`);
            setSnackbar({ open: true, message: `${item.name} permanently deleted`, severity: 'success' });
            fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            setSnackbar({ open: true, message: 'Failed to delete item', severity: 'error' });
        }
        setConfirmDialog({ open: false, type: 'delete' });
    };

    const handleBulkRestore = async () => {
        try {
            const itemsToRestore = items
                .filter(item => selected.includes(item.id))
                .map(item => ({ entity_type: item.entity_type, id: item.id }));

            await api.post('/recycle-bin/bulk-restore/', { items: itemsToRestore });
            setSnackbar({ open: true, message: `${itemsToRestore.length} items restored`, severity: 'success' });
            setSelected([]);
            fetchItems();
        } catch (error) {
            console.error('Error bulk restoring:', error);
            setSnackbar({ open: true, message: 'Failed to restore items', severity: 'error' });
        }
        setConfirmDialog({ open: false, type: 'bulk-restore' });
    };

    const handleBulkDelete = async () => {
        try {
            const itemsToDelete = items
                .filter(item => selected.includes(item.id))
                .map(item => ({ entity_type: item.entity_type, id: item.id }));

            await api.post('/recycle-bin/bulk-delete/', { items: itemsToDelete, confirm: true });
            setSnackbar({ open: true, message: `${itemsToDelete.length} items permanently deleted`, severity: 'success' });
            setSelected([]);
            fetchItems();
        } catch (error) {
            console.error('Error bulk deleting:', error);
            setSnackbar({ open: true, message: 'Failed to delete items', severity: 'error' });
        }
        setConfirmDialog({ open: false, type: 'bulk-delete' });
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filterEntityType !== 'all') params.append('entity_type', filterEntityType);

            const response = await api.get(`/recycle-bin/export/?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `recycle-bin-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting:', error);
            setSnackbar({ open: true, message: 'Failed to export', severity: 'error' });
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelected(items.map(item => item.id));
        } else {
            setSelected([]);
        }
    };

    const handleSelectItem = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getEntityColor = (entityType: string) => {
        switch (entityType) {
            case 'students.Student': return 'primary';
            case 'staff.Staff': return 'secondary';
            case 'fees.FeeStructure': return 'success';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Recycle Bin</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchItems}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        variant="outlined"
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            {/* Bulk Actions */}
            {selected.length > 0 && (
                <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    action={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                color="success"
                                size="small"
                                startIcon={<RestoreIcon />}
                                onClick={() => setConfirmDialog({ open: true, type: 'bulk-restore' })}
                            >
                                Restore Selected ({selected.length})
                            </Button>
                            <Button
                                color="error"
                                size="small"
                                startIcon={<DeleteForeverIcon />}
                                onClick={() => setConfirmDialog({ open: true, type: 'bulk-delete' })}
                            >
                                Delete Selected
                            </Button>
                        </Box>
                    }
                >
                    {selected.length} item(s) selected
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                size="small"
                                placeholder="Search by name..."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Entity Type</InputLabel>
                                <Select
                                    value={filterEntityType}
                                    label="Entity Type"
                                    onChange={(e) => setFilterEntityType(e.target.value)}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    {entityTypes.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Deleted From"
                                type="date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Deleted Until"
                                type="date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selected.length === items.length && items.length > 0}
                                        indeterminate={selected.length > 0 && selected.length < items.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Deleted At</TableCell>
                                <TableCell>Deleted By</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selected.includes(item.id)}
                                            onChange={() => handleSelectItem(item.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {item.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.entity_type_display}
                                            size="small"
                                            color={getEntityColor(item.entity_type) as any}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
                                            {item.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(item.deleted_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {item.deleted_by || '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Restore">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => setConfirmDialog({ open: true, type: 'restore', item })}
                                            >
                                                <RestoreIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Permanently Delete">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setConfirmDialog({ open: true, type: 'delete', item })}
                                            >
                                                <DeleteForeverIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                            Recycle bin is empty
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </Card>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, type: 'restore' })}
            >
                <DialogTitle>
                    {confirmDialog.type === 'restore' && 'Restore Item'}
                    {confirmDialog.type === 'delete' && 'Permanently Delete'}
                    {confirmDialog.type === 'bulk-restore' && 'Restore Selected Items'}
                    {confirmDialog.type === 'bulk-delete' && 'Permanently Delete Selected'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialog.type === 'restore' && (
                            <>Are you sure you want to restore <strong>{confirmDialog.item?.name}</strong>?</>
                        )}
                        {confirmDialog.type === 'delete' && (
                            <>
                                Are you sure you want to permanently delete <strong>{confirmDialog.item?.name}</strong>?
                                <br /><br />
                                <strong>This action cannot be undone.</strong>
                            </>
                        )}
                        {confirmDialog.type === 'bulk-restore' && (
                            <>Are you sure you want to restore {selected.length} item(s)?</>
                        )}
                        {confirmDialog.type === 'bulk-delete' && (
                            <>
                                Are you sure you want to permanently delete {selected.length} item(s)?
                                <br /><br />
                                <strong>This action cannot be undone.</strong>
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, type: 'restore' })}>
                        Cancel
                    </Button>
                    {confirmDialog.type === 'restore' && confirmDialog.item && (
                        <Button onClick={() => handleRestore(confirmDialog.item!)} color="success" variant="contained">
                            Restore
                        </Button>
                    )}
                    {confirmDialog.type === 'delete' && confirmDialog.item && (
                        <Button onClick={() => handlePermanentDelete(confirmDialog.item!)} color="error" variant="contained">
                            Delete Forever
                        </Button>
                    )}
                    {confirmDialog.type === 'bulk-restore' && (
                        <Button onClick={handleBulkRestore} color="success" variant="contained">
                            Restore All
                        </Button>
                    )}
                    {confirmDialog.type === 'bulk-delete' && (
                        <Button onClick={handleBulkDelete} color="error" variant="contained">
                            Delete All
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default RecycleBin;
