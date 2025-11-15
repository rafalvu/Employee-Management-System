import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, logout, getCurrentUser } from '../utils/api';

interface Employee {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({ name: employee.name, email: employee.email });
    } else {
      setEditingEmployee(null);
      setFormData({ name: '', email: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setFormData({ name: '', email: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
      } else {
        await createEmployee(formData);
      }
      handleCloseDialog();
      loadEmployees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        loadEmployees();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Delete failed');
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <Container><Typography>Loading...</Typography></Container>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Employee Management System
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {currentUser?.email} ({currentUser?.role})
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Employees</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Employee
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{new Date(employee.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(employee)}
                    >
                      <EditIcon />
                    </IconButton>
                    {currentUser?.role === 'admin' && (
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard;
