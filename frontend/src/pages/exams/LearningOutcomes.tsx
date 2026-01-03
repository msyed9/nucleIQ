import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Chip,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Assessment as AssessmentIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface LearningOutcome {
    id: string;
    code: string;
    description: string;
    subject: string;
    subject_name?: string;
    topic?: string;
    topic_name?: string;
    bloom_level: string;
    question_count?: number;
}

interface Topic {
    id: string;
    name: string;
    subject: string;
}

const BLOOM_LEVELS = [
    { value: 'REMEMBER', label: 'Remember', color: '#E3F2FD' },
    { value: 'UNDERSTAND', label: 'Understand', color: '#C5E1A5' },
    { value: 'APPLY', label: 'Apply', color: '#FFF9C4' },
    { value: 'ANALYZE', label: 'Analyze', color: '#FFCCBC' },
    { value: 'EVALUATE', label: 'Evaluate', color: '#F8BBD0' },
    { value: 'CREATE', label: 'Create', color: '#D1C4E9' },
];

const LearningOutcomes: React.FC = () => {
    const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentOutcome, setCurrentOutcome] = useState<Partial<LearningOutcome>>({});
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [selectedSubject, setSelectedSubject] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchOutcomes();
            fetchTopics();
        }
    }, [selectedSubject]);

    const fetchOutcomes = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/exams/learning-outcomes/?subject=${selectedSubject}`);
            setOutcomes(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching learning outcomes:', error);
            showSnackbar('Failed to fetch learning outcomes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/api/tenants/subjects/');
            setSubjects(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchTopics = async () => {
        try {
            const response = await api.get(`/api/exams/topics/?subject=${selectedSubject}`);
            setTopics(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching topics:', error);
        }
    };

    const handleOpenDialog = (outcome?: LearningOutcome) => {
        if (outcome) {
            setCurrentOutcome(outcome);
        } else {
            setCurrentOutcome({
                subject: selectedSubject,
                bloom_level: 'UNDERSTAND',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentOutcome({});
    };

    const handleSaveOutcome = async () => {
        try {
            setLoading(true);
            if (currentOutcome.id) {
                await api.patch(`/api/exams/learning-outcomes/${currentOutcome.id}/`, currentOutcome);
                showSnackbar('Learning outcome updated successfully', 'success');
            } else {
                await api.post('/api/exams/learning-outcomes/', currentOutcome);
                showSnackbar('Learning outcome created successfully', 'success');
            }
            handleCloseDialog();
            fetchOutcomes();
        } catch (error: any) {
            console.error('Error saving learning outcome:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to save learning outcome', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOutcome = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this learning outcome?')) return;

        try {
            await api.delete(`/api/exams/learning-outcomes/${id}/`);
            showSnackbar('Learning outcome deleted successfully', 'success');
            fetchOutcomes();
        } catch (error) {
            console.error('Error deleting learning outcome:', error);
            showSnackbar('Failed to delete learning outcome', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const getBloomLevelColor = (level: string) => {
        return BLOOM_LEVELS.find((b) => b.value === level)?.color || '#E0E0E0';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Learning Outcomes (OBE)</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    disabled={!selectedSubject}
                >
                    Add Learning Outcome
                </Button>
            </Box>

            {/* Subject Selection */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Select Subject</InputLabel>
                                <Select
                                    value={selectedSubject}
                                    label="Select Subject"
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                >
                                    {subjects.map((subject) => (
                                        <MenuItem key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Alert severity="info">
                                Learning Outcomes define what students should be able to do after completing a course/topic. They are
                                mapped to Bloom's Taxonomy levels.
                            </Alert>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Bloom's Taxonomy Legend */}
            {selectedSubject && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Bloom's Taxonomy Levels
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {BLOOM_LEVELS.map((level) => (
                                <Chip
                                    key={level.value}
                                    label={level.label}
                                    sx={{ bgcolor: level.color, fontWeight: 'medium' }}
                                />
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Learning Outcomes Table */}
            {selectedSubject && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Code</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Topic</TableCell>
                                <TableCell>Bloom's Level</TableCell>
                                <TableCell>Questions</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {outcomes.map((outcome) => (
                                <TableRow key={outcome.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {outcome.code}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{outcome.description}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {outcome.topic_name || 'General'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={BLOOM_LEVELS.find((b) => b.value === outcome.bloom_level)?.label}
                                            size="small"
                                            sx={{ bgcolor: getBloomLevelColor(outcome.bloom_level) }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={<AssessmentIcon />}
                                            label={outcome.question_count || 0}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleOpenDialog(outcome)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeleteOutcome(outcome.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {outcomes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                            No learning outcomes found. Click "Add Learning Outcome" to create one.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {!selectedSubject && (
                <Card>
                    <CardContent>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 5 }}>
                            Please select a subject to view and manage learning outcomes.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Learning Outcome Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{currentOutcome.id ? 'Edit Learning Outcome' : 'Add Learning Outcome'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Outcome Code"
                                    value={currentOutcome.code || ''}
                                    onChange={(e) => setCurrentOutcome({ ...currentOutcome, code: e.target.value })}
                                    placeholder="e.g., LO1, CO1, PO1"
                                    helperText="Unique identifier for this learning outcome"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Bloom's Taxonomy Level</InputLabel>
                                    <Select
                                        value={currentOutcome.bloom_level || 'UNDERSTAND'}
                                        label="Bloom's Taxonomy Level"
                                        onChange={(e) => setCurrentOutcome({ ...currentOutcome, bloom_level: e.target.value })}
                                    >
                                        {BLOOM_LEVELS.map((level) => (
                                            <MenuItem key={level.value} value={level.value}>
                                                {level.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Topic (Optional)</InputLabel>
                                    <Select
                                        value={currentOutcome.topic || ''}
                                        label="Topic (Optional)"
                                        onChange={(e) => setCurrentOutcome({ ...currentOutcome, topic: e.target.value })}
                                    >
                                        <MenuItem value="">General (All Topics)</MenuItem>
                                        {topics.map((topic) => (
                                            <MenuItem key={topic.id} value={topic.id}>
                                                {topic.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    multiline
                                    rows={4}
                                    label="Learning Outcome Description"
                                    value={currentOutcome.description || ''}
                                    onChange={(e) => setCurrentOutcome({ ...currentOutcome, description: e.target.value })}
                                    placeholder="Students will be able to..."
                                    helperText="Describe what students should be able to do after achieving this outcome"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    <Typography variant="body2">
                                        <strong>Bloom's Taxonomy Guide:</strong>
                                        <br />
                                        <strong>Remember:</strong> Recall facts and basic concepts
                                        <br />
                                        <strong>Understand:</strong> Explain ideas or concepts
                                        <br />
                                        <strong>Apply:</strong> Use information in new situations
                                        <br />
                                        <strong>Analyze:</strong> Draw connections among ideas
                                        <br />
                                        <strong>Evaluate:</strong> Justify a decision or course of action
                                        <br />
                                        <strong>Create:</strong> Produce new or original work
                                    </Typography>
                                </Alert>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveOutcome} variant="contained" disabled={loading}>
                        {currentOutcome.id ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LearningOutcomes;
