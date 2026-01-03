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
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    Chip,
    Alert,
    Snackbar,
    LinearProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
    Checkbox,
    Divider,
} from '@mui/material';
import {
    Timer as TimerIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Send as SendIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface OnlineExam {
    id: string;
    name: string;
    subject: string;
    subject_name?: string;
    total_marks: number;
    duration_minutes: number;
    instructions: string;
    status: string;
    questions?: ExamQuestion[];
    start_time?: string;
    end_time?: string;
}

interface ExamQuestion {
    id: string;
    question_text: string;
    question_type: string;
    marks: number;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    image?: string;
}

interface StudentAnswer {
    question_id: string;
    answer: string;
}

const OnlineExamination: React.FC = () => {
    const [availableExams, setAvailableExams] = useState<OnlineExam[]>([]);
    const [currentExam, setCurrentExam] = useState<OnlineExam | null>(null);
    const [examStarted, setExamStarted] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [showInstructions, setShowInstructions] = useState(false);
    const [examSubmitted, setExamSubmitted] = useState(false);

    useEffect(() => {
        fetchAvailableExams();
    }, []);

    useEffect(() => {
        if (examStarted && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [examStarted, timeRemaining]);

    const fetchAvailableExams = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/exams/online-exams/available/');
            setAvailableExams(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching available exams:', error);
            showSnackbar('Failed to fetch available exams', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async (exam: OnlineExam) => {
        try {
            setLoading(true);
            const response = await api.post(`/api/exams/online-exams/${exam.id}/start/`);
            setCurrentExam(response.data);
            setTimeRemaining(exam.duration_minutes * 60);
            setExamStarted(true);
            setAnswers({});
            setCurrentQuestionIndex(0);
            showSnackbar('Exam started successfully', 'success');
        } catch (error: any) {
            console.error('Error starting exam:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to start exam', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    };

    const handleSubmitExam = async () => {
        if (!window.confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.')) {
            return;
        }

        try {
            setLoading(true);
            const studentAnswers: StudentAnswer[] = Object.entries(answers).map(([question_id, answer]) => ({
                question_id,
                answer,
            }));

            await api.post(`/api/exams/online-exams/${currentExam?.id}/submit/`, {
                answers: studentAnswers,
                time_taken: (currentExam!.duration_minutes * 60 - timeRemaining),
            });

            setExamSubmitted(true);
            setExamStarted(false);
            showSnackbar('Exam submitted successfully!', 'success');
        } catch (error: any) {
            console.error('Error submitting exam:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to submit exam', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoSubmit = async () => {
        try {
            const studentAnswers: StudentAnswer[] = Object.entries(answers).map(([question_id, answer]) => ({
                question_id,
                answer,
            }));

            await api.post(`/api/exams/online-exams/${currentExam?.id}/submit/`, {
                answers: studentAnswers,
                time_taken: currentExam!.duration_minutes * 60,
                auto_submitted: true,
            });

            setExamSubmitted(true);
            setExamStarted(false);
            showSnackbar('Time is up! Exam auto-submitted.', 'warning');
        } catch (error) {
            console.error('Error auto-submitting exam:', error);
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning') => {
        setSnackbar({ open: true, message, severity: severity as 'success' | 'error' });
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getAnsweredCount = () => {
        return Object.keys(answers).length;
    };

    const currentQuestion = currentExam?.questions?.[currentQuestionIndex];

    if (examSubmitted) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <Card sx={{ maxWidth: 600, textAlign: 'center' }}>
                    <CardContent sx={{ p: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom>
                            Exam Submitted Successfully!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            Your answers have been recorded. Results will be published after evaluation.
                        </Typography>
                        <Button variant="contained" onClick={() => window.location.reload()}>
                            Back to Exams
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    if (examStarted && currentExam) {
        return (
            <Box sx={{ p: 3 }}>
                {/* Exam Header */}
                <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6">{currentExam.name}</Typography>
                                <Typography variant="body2">{currentExam.subject_name}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <TimerIcon />
                                    <Typography variant="h5" fontWeight="bold">
                                        {formatTime(timeRemaining)}
                                    </Typography>
                                </Box>
                                {timeRemaining < 300 && (
                                    <Typography variant="caption" color="warning.light">
                                        Less than 5 minutes remaining!
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                                <Typography variant="body2">
                                    Question {currentQuestionIndex + 1} of {currentExam.questions?.length || 0}
                                </Typography>
                                <Typography variant="body2">
                                    Answered: {getAnsweredCount()} / {currentExam.questions?.length || 0}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Progress Bar */}
                <LinearProgress
                    variant="determinate"
                    value={((currentQuestionIndex + 1) / (currentExam.questions?.length || 1)) * 100}
                    sx={{ mb: 3, height: 8, borderRadius: 4 }}
                />

                {/* Question Card */}
                {currentQuestion && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Question {currentQuestionIndex + 1}
                                </Typography>
                                <Chip label={`${currentQuestion.marks} marks`} color="primary" />
                            </Box>

                            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                                {currentQuestion.question_text}
                            </Typography>

                            {currentQuestion.image && (
                                <Box sx={{ my: 2 }}>
                                    <img
                                        src={currentQuestion.image}
                                        alt="Question"
                                        style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }}
                                    />
                                </Box>
                            )}

                            <Divider sx={{ my: 3 }} />

                            {/* Answer Options */}
                            {currentQuestion.question_type === 'MCQ' && (
                                <RadioGroup
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                >
                                    {['A', 'B', 'C', 'D'].map((option) => {
                                        const optionKey = `option_${option.toLowerCase()}` as keyof ExamQuestion;
                                        const optionText = currentQuestion[optionKey];
                                        if (!optionText) return null;

                                        return (
                                            <FormControlLabel
                                                key={option}
                                                value={option}
                                                control={<Radio />}
                                                label={
                                                    <Typography variant="body1" sx={{ py: 1 }}>
                                                        <strong>{option}.</strong> {optionText as string}
                                                    </Typography>
                                                }
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: answers[currentQuestion.id] === option ? 'primary.main' : 'divider',
                                                    borderRadius: 2,
                                                    p: 2,
                                                    mb: 1,
                                                    bgcolor: answers[currentQuestion.id] === option ? 'primary.50' : 'transparent',
                                                }}
                                            />
                                        );
                                    })}
                                </RadioGroup>
                            )}

                            {currentQuestion.question_type === 'TRUE_FALSE' && (
                                <RadioGroup
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                >
                                    <FormControlLabel
                                        value="True"
                                        control={<Radio />}
                                        label="True"
                                        sx={{
                                            border: '1px solid',
                                            borderColor: answers[currentQuestion.id] === 'True' ? 'primary.main' : 'divider',
                                            borderRadius: 2,
                                            p: 2,
                                            mb: 1,
                                        }}
                                    />
                                    <FormControlLabel
                                        value="False"
                                        control={<Radio />}
                                        label="False"
                                        sx={{
                                            border: '1px solid',
                                            borderColor: answers[currentQuestion.id] === 'False' ? 'primary.main' : 'divider',
                                            borderRadius: 2,
                                            p: 2,
                                        }}
                                    />
                                </RadioGroup>
                            )}

                            {['SHORT_ANSWER', 'LONG_ANSWER', 'FILL_BLANK', 'NUMERICAL', 'ESSAY'].includes(
                                currentQuestion.question_type
                            ) && (
                                    <TextField
                                        fullWidth
                                        multiline={currentQuestion.question_type !== 'NUMERICAL'}
                                        rows={currentQuestion.question_type === 'ESSAY' ? 8 : currentQuestion.question_type === 'LONG_ANSWER' ? 4 : 2}
                                        placeholder="Type your answer here..."
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                        variant="outlined"
                                    />
                                )}
                        </CardContent>
                    </Card>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Button
                        variant="outlined"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    >
                        Previous
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {currentQuestionIndex < (currentExam.questions?.length || 0) - 1 ? (
                            <Button variant="contained" onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<SendIcon />}
                                onClick={handleSubmitExam}
                                disabled={loading}
                            >
                                Submit Exam
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Question Navigator */}
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Question Navigator
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {currentExam.questions?.map((q, index) => (
                                <Button
                                    key={q.id}
                                    variant={currentQuestionIndex === index ? 'contained' : 'outlined'}
                                    color={answers[q.id] ? 'success' : 'inherit'}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    sx={{ minWidth: 50 }}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    // Available Exams List
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Online Examinations
            </Typography>

            <Grid container spacing={3}>
                {availableExams.map((exam) => (
                    <Grid item xs={12} md={6} lg={4} key={exam.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {exam.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {exam.subject_name}
                                </Typography>

                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip icon={<TimerIcon />} label={`${exam.duration_minutes} mins`} size="small" />
                                    <Chip label={`${exam.total_marks} marks`} size="small" color="primary" />
                                    <Chip
                                        label={exam.status}
                                        size="small"
                                        color={exam.status === 'SCHEDULED' ? 'success' : 'default'}
                                    />
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => {
                                            setCurrentExam(exam);
                                            setShowInstructions(true);
                                        }}
                                    >
                                        View Instructions
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {availableExams.length === 0 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 5 }}>
                                <Typography variant="body1" color="text.secondary">
                                    No exams available at the moment.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* Instructions Dialog */}
            <Dialog open={showInstructions} onClose={() => setShowInstructions(false)} maxWidth="md" fullWidth>
                <DialogTitle>Exam Instructions</DialogTitle>
                <DialogContent>
                    {currentExam && (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    Important: Once you start the exam, the timer will begin and cannot be paused!
                                </Typography>
                            </Alert>

                            <Typography variant="h6" gutterBottom>
                                {currentExam.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Subject: {currentExam.subject_name}
                            </Typography>

                            <Box sx={{ my: 2 }}>
                                <Typography variant="body2">
                                    <strong>Duration:</strong> {currentExam.duration_minutes} minutes
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Total Marks:</strong> {currentExam.total_marks}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                                {currentExam.instructions || 'No specific instructions provided.'}
                            </Typography>

                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    • Answer all questions to the best of your ability
                                    <br />
                                    • You can navigate between questions using the navigation buttons
                                    <br />
                                    • Your answers are automatically saved as you type
                                    <br />
                                    • The exam will auto-submit when time runs out
                                    <br />• Make sure you have a stable internet connection
                                </Typography>
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowInstructions(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShowInstructions(false);
                            if (currentExam) handleStartExam(currentExam);
                        }}
                        disabled={loading}
                    >
                        Start Exam
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

export default OnlineExamination;
