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
    Upload as UploadIcon,
    Download as DownloadIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Question {
    id: string;
    question_text: string;
    question_type: string;
    subject: string;
    subject_name?: string;
    topic: string;
    topic_name?: string;
    difficulty: string;
    marks: number;
    learning_outcome?: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_answer: string;
    explanation?: string;
    usage_count: number;
    is_active: boolean;
}

interface Topic {
    id: string;
    name: string;
    subject: string;
    grade_level: string;
}

interface LearningOutcome {
    id: string;
    code: string;
    description: string;
    subject: string;
    bloom_level: string;
}

const QUESTION_TYPES = [
    { value: 'MCQ', label: 'Multiple Choice' },
    { value: 'TRUE_FALSE', label: 'True/False' },
    { value: 'SHORT_ANSWER', label: 'Short Answer' },
    { value: 'LONG_ANSWER', label: 'Long Answer' },
    { value: 'FILL_BLANK', label: 'Fill in the Blank' },
    { value: 'MATCH', label: 'Matching' },
    { value: 'NUMERICAL', label: 'Numerical' },
    { value: 'ESSAY', label: 'Essay' },
];

const DIFFICULTY_LEVELS = [
    { value: 'EASY', label: 'Easy', color: 'success' },
    { value: 'MEDIUM', label: 'Medium', color: 'warning' },
    { value: 'HARD', label: 'Hard', color: 'error' },
];

const QuestionBank: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({});
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Filters
    const [filters, setFilters] = useState({
        subject: '',
        topic: '',
        difficulty: '',
        question_type: '',
        search: '',
    });

    useEffect(() => {
        fetchQuestions();
        fetchSubjects();
        fetchTopics();
        fetchLearningOutcomes();
    }, [filters]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.subject) params.append('subject', filters.subject);
            if (filters.topic) params.append('topic', filters.topic);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.question_type) params.append('question_type', filters.question_type);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/api/exams/questions/?${params.toString()}`);
            setQuestions(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching questions:', error);
            showSnackbar('Failed to fetch questions', 'error');
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
            const params = filters.subject ? `?subject=${filters.subject}` : '';
            const response = await api.get(`/api/exams/topics/${params}`);
            setTopics(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching topics:', error);
        }
    };

    const fetchLearningOutcomes = async () => {
        try {
            const params = filters.subject ? `?subject=${filters.subject}` : '';
            const response = await api.get(`/api/exams/learning-outcomes/${params}`);
            setLearningOutcomes(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching learning outcomes:', error);
        }
    };

    const handleOpenDialog = (question?: Question) => {
        if (question) {
            setCurrentQuestion(question);
        } else {
            setCurrentQuestion({
                question_type: 'MCQ',
                difficulty: 'MEDIUM',
                marks: 1,
                is_active: true,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentQuestion({});
    };

    const handleSaveQuestion = async () => {
        try {
            setLoading(true);
            if (currentQuestion.id) {
                await api.patch(`/api/exams/questions/${currentQuestion.id}/`, currentQuestion);
                showSnackbar('Question updated successfully', 'success');
            } else {
                await api.post('/api/exams/questions/', currentQuestion);
                showSnackbar('Question created successfully', 'success');
            }
            handleCloseDialog();
            fetchQuestions();
        } catch (error: any) {
            console.error('Error saving question:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to save question', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;

        try {
            await api.delete(`/api/exams/questions/${id}/`);
            showSnackbar('Question deleted successfully', 'success');
            fetchQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
            showSnackbar('Failed to delete question', 'error');
        }
    };

    const handleImportQuestions = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            await api.post('/api/exams/questions/import/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showSnackbar('Questions imported successfully', 'success');
            fetchQuestions();
        } catch (error: any) {
            console.error('Error importing questions:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to import questions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportQuestions = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.subject) params.append('subject', filters.subject);
            if (filters.topic) params.append('topic', filters.topic);

            const response = await api.get(`/api/exams/questions/export/?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'questions.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting questions:', error);
            showSnackbar('Failed to export questions', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const getDifficultyColor = (difficulty: string) => {
        const level = DIFFICULTY_LEVELS.find((d) => d.value === difficulty);
        return level?.color || 'default';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Question Bank</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <input
                        accept=".xlsx,.xls,.csv"
                        style={{ display: 'none' }}
                        id="import-file"
                        type="file"
                        onChange={handleImportQuestions}
                    />
                    <label htmlFor="import-file">
                        <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                            Import
                        </Button>
                    </label>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportQuestions}>
                        Export
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                        Add Question
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    value={filters.subject}
                                    label="Subject"
                                    onChange={(e) => setFilters({ ...filters, subject: e.target.value, topic: '' })}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {subjects.map((subject) => (
                                        <MenuItem key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Topic</InputLabel>
                                <Select
                                    value={filters.topic}
                                    label="Topic"
                                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                                    disabled={!filters.subject}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {topics.map((topic) => (
                                        <MenuItem key={topic.id} value={topic.id}>
                                            {topic.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Difficulty</InputLabel>
                                <Select
                                    value={filters.difficulty}
                                    label="Difficulty"
                                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {DIFFICULTY_LEVELS.map((level) => (
                                        <MenuItem key={level.value} value={level.value}>
                                            {level.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Question Type</InputLabel>
                                <Select
                                    value={filters.question_type}
                                    label="Question Type"
                                    onChange={(e) => setFilters({ ...filters, question_type: e.target.value })}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {QUESTION_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Questions Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Question</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Subject/Topic</TableCell>
                            <TableCell>Difficulty</TableCell>
                            <TableCell>Marks</TableCell>
                            <TableCell>Usage</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {questions.map((question) => (
                            <TableRow key={question.id}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ maxWidth: 400 }}>
                                        {question.question_text.substring(0, 100)}
                                        {question.question_text.length > 100 ? '...' : ''}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={QUESTION_TYPES.find((t) => t.value === question.question_type)?.label}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{question.subject_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {question.topic_name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={question.difficulty}
                                        size="small"
                                        color={getDifficultyColor(question.difficulty) as any}
                                    />
                                </TableCell>
                                <TableCell>{question.marks}</TableCell>
                                <TableCell>{question.usage_count}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={question.is_active ? 'Active' : 'Inactive'}
                                        size="small"
                                        color={question.is_active ? 'success' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" onClick={() => handleOpenDialog(question)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDeleteQuestion(question.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Question Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{currentQuestion.id ? 'Edit Question' : 'Add Question'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Subject</InputLabel>
                                    <Select
                                        value={currentQuestion.subject || ''}
                                        label="Subject"
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, subject: e.target.value })}
                                    >
                                        {subjects.map((subject) => (
                                            <MenuItem key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Topic</InputLabel>
                                    <Select
                                        value={currentQuestion.topic || ''}
                                        label="Topic"
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, topic: e.target.value })}
                                        disabled={!currentQuestion.subject}
                                    >
                                        {topics
                                            .filter((t) => t.subject === currentQuestion.subject)
                                            .map((topic) => (
                                                <MenuItem key={topic.id} value={topic.id}>
                                                    {topic.name}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth required>
                                    <InputLabel>Question Type</InputLabel>
                                    <Select
                                        value={currentQuestion.question_type || 'MCQ'}
                                        label="Question Type"
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_type: e.target.value })}
                                    >
                                        {QUESTION_TYPES.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth required>
                                    <InputLabel>Difficulty</InputLabel>
                                    <Select
                                        value={currentQuestion.difficulty || 'MEDIUM'}
                                        label="Difficulty"
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                                    >
                                        {DIFFICULTY_LEVELS.map((level) => (
                                            <MenuItem key={level.value} value={level.value}>
                                                {level.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Marks"
                                    type="number"
                                    value={currentQuestion.marks || 1}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseFloat(e.target.value) })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    multiline
                                    rows={3}
                                    label="Question Text"
                                    value={currentQuestion.question_text || ''}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                                />
                            </Grid>

                            {/* MCQ Options */}
                            {currentQuestion.question_type === 'MCQ' && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Option A"
                                            value={currentQuestion.option_a || ''}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_a: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Option B"
                                            value={currentQuestion.option_b || ''}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_b: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Option C"
                                            value={currentQuestion.option_c || ''}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_c: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Option D"
                                            value={currentQuestion.option_d || ''}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_d: e.target.value })}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Correct Answer"
                                    value={currentQuestion.correct_answer || ''}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                                    helperText={
                                        currentQuestion.question_type === 'MCQ'
                                            ? 'Enter A, B, C, or D'
                                            : 'Enter the correct answer or answer key'
                                    }
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Explanation (Optional)"
                                    value={currentQuestion.explanation || ''}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Learning Outcome (Optional)</InputLabel>
                                    <Select
                                        value={currentQuestion.learning_outcome || ''}
                                        label="Learning Outcome (Optional)"
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, learning_outcome: e.target.value })}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {learningOutcomes
                                            .filter((lo) => lo.subject === currentQuestion.subject)
                                            .map((outcome) => (
                                                <MenuItem key={outcome.id} value={outcome.id}>
                                                    {outcome.code} - {outcome.description.substring(0, 50)}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveQuestion} variant="contained" disabled={loading}>
                        {currentQuestion.id ? 'Update' : 'Create'}
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

export default QuestionBank;
