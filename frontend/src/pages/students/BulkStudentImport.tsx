import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Upload,
  Download,
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import api from '../../services/api';

interface ValidationRow {
  row_number: number;
  first_name: string;
  last_name: string;
  admission_number: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: string[];
  warnings: string[];
  preview: ValidationRow[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  students?: Array<{
    id: string;
    admission_number: string;
    name: string;
  }>;
}

const BulkStudentImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/students/download_import_template/', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/students/bulk_import/?dry_run=true', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setValidationResult(response.data);
    } catch (error: any) {
      console.error('Validation error:', error);
      alert(error.response?.data?.error || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/students/bulk_import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
      setValidationResult(null);
      setFile(null);
    } catch (error: any) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error.response?.data?.error || 'Import failed'],
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (rowNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowNumber)) {
      newExpanded.delete(rowNumber);
    } else {
      newExpanded.add(rowNumber);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bulk Student Import
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 1: Download Template
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Download the Excel template with required fields and sample data.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadTemplate}
            sx={{ mt: 1 }}
          >
            Download Template
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 2: Upload File
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Upload your completed Excel/CSV file.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <input
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              id="bulk-import-file"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="bulk-import-file">
              <Button
                variant="contained"
                component="span"
                startIcon={<Upload />}
              >
                Choose File
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {file.name}
              </Typography>
            )}
          </Box>

          {file && !validationResult && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleValidate}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Validate Data
            </Button>
          )}

          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {validationResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Validation Results
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                label={`Total: ${validationResult.total_rows}`}
                color="default"
              />
              <Chip
                icon={<CheckCircle />}
                label={`Valid: ${validationResult.valid_rows}`}
                color="success"
              />
              <Chip
                icon={<Error />}
                label={`Invalid: ${validationResult.invalid_rows}`}
                color="error"
              />
            </Box>

            {validationResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Errors Found:
                </Typography>
                {validationResult.errors.slice(0, 5).map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error}
                  </Typography>
                ))}
                {validationResult.errors.length > 5 && (
                  <Typography variant="body2">
                    ...and {validationResult.errors.length - 5} more
                  </Typography>
                )}
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings:
                </Typography>
                {validationResult.warnings.slice(0, 5).map((warning, index) => (
                  <Typography key={index} variant="body2">
                    • {warning}
                  </Typography>
                ))}
                {validationResult.warnings.length > 5 && (
                  <Typography variant="body2">
                    ...and {validationResult.warnings.length - 5} more
                  </Typography>
                )}
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Admission Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationResult.preview.map((row) => (
                    <React.Fragment key={row.row_number}>
                      <TableRow>
                        <TableCell>{row.row_number}</TableCell>
                        <TableCell>
                          {row.first_name} {row.last_name}
                        </TableCell>
                        <TableCell>{row.admission_number}</TableCell>
                        <TableCell>
                          {row.valid ? (
                            <Chip
                              icon={<CheckCircle />}
                              label="Valid"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<Error />}
                              label="Invalid"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {(row.errors.length > 0 || row.warnings.length > 0) && (
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(row.row_number)}
                            >
                              {expandedRows.has(row.row_number) ? (
                                <ExpandLess />
                              ) : (
                                <ExpandMore />
                              )}
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0 }}>
                          <Collapse in={expandedRows.has(row.row_number)}>
                            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                              {row.errors.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="subtitle2" color="error">
                                    Errors:
                                  </Typography>
                                  {row.errors.map((error, idx) => (
                                    <Typography key={idx} variant="body2" color="error">
                                      • {error}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {row.warnings.length > 0 && (
                                <Box>
                                  <Typography variant="subtitle2" color="warning.main">
                                    Warnings:
                                  </Typography>
                                  {row.warnings.map((warning, idx) => (
                                    <Typography
                                      key={idx}
                                      variant="body2"
                                      color="warning.main"
                                    >
                                      • {warning}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleImport}
                disabled={validationResult.valid_rows === 0 || loading}
                startIcon={<Upload />}
              >
                Import {validationResult.valid_rows} Valid Students
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setValidationResult(null);
                  setFile(null);
                }}
              >
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Complete
            </Typography>

            {importResult.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully imported {importResult.imported} students!
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                Import failed. Please check errors below.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                icon={<CheckCircle />}
                label={`Imported: ${importResult.imported}`}
                color="success"
              />
              <Chip
                icon={<Error />}
                label={`Skipped: ${importResult.skipped}`}
                color="error"
              />
            </Box>

            {importResult.errors && importResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Errors:
                </Typography>
                {importResult.errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error}
                  </Typography>
                ))}
              </Alert>
            )}

            {importResult.students && importResult.students.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Imported Students:
                </Typography>
                {importResult.students.map((student) => (
                  <Typography key={student.id} variant="body2">
                    • {student.name} ({student.admission_number})
                  </Typography>
                ))}
              </Box>
            )}

            <Button
              variant="contained"
              onClick={() => {
                setImportResult(null);
                setFile(null);
              }}
              sx={{ mt: 2 }}
            >
              Import More Students
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default BulkStudentImport;
