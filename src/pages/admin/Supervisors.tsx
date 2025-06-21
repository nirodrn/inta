import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { UserCheck, Plus, Edit, Trash2, Search } from 'lucide-react';
import { database, auth } from '../../config/firebase';
import { Supervisor } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function Supervisors() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    notes: '',
  });

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const snapshot = await get(ref(database, 'supervisors'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const supervisorsList = Object.entries(data).map(([uid, supervisor]: [string, any]) => ({
          uid,
          ...supervisor,
        }));
        setSupervisors(supervisorsList);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      toast.error('Failed to fetch supervisors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (submitting) return;
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingSupervisor) {
        // Update existing supervisor
        const supervisorData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          department: formData.department.trim(),
          notes: formData.notes.trim(),
          role: 'supervisor',
          updatedAt: new Date().toISOString(),
        };

        await update(ref(database, `supervisors/${editingSupervisor.uid}`), supervisorData);
        toast.success('Supervisor updated successfully!');
      } else {
        // Create new supervisor
        const defaultPassword = 'supervisor123';
        
        let userCredential;
        let newUid = `supervisor_${Date.now()}`;
        
        try {
          userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), defaultPassword);
          newUid = userCredential.user.uid;
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log('Email already in use, using generated UID');
          } else {
            throw authError;
          }
        }

        const supervisorData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          department: formData.department.trim(),
          notes: formData.notes.trim(),
          role: 'supervisor',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await update(ref(database, `supervisors/${newUid}`), supervisorData);
        toast.success(`Supervisor created successfully! Login credentials - Email: ${formData.email}, Password: ${defaultPassword}`);
      }

      resetForm();
      setShowModal(false);
      fetchSupervisors();
    } catch (error) {
      console.error('Error saving supervisor:', error);
      toast.error('Failed to save supervisor: ' + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      name: supervisor.name || '',
      email: supervisor.email || '',
      phone: supervisor.phone || '',
      department: supervisor.department || '',
      notes: supervisor.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (supervisorId: string) => {
    if (window.confirm('Are you sure you want to delete this supervisor?')) {
      try {
        await remove(ref(database, `supervisors/${supervisorId}`));
        toast.success('Supervisor deleted successfully!');
        fetchSupervisors();
      } catch (error) {
        console.error('Error deleting supervisor:', error);
        toast.error('Failed to delete supervisor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      notes: '',
    });
    setEditingSupervisor(null);
  };

  const handleModalClose = () => {
    if (!submitting) {
      setShowModal(false);
      resetForm();
    }
  };

  const filteredSupervisors = supervisors.filter(supervisor =>
    supervisor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supervisor.department && supervisor.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Management</h1>
          <p className="text-gray-600">Manage supervisors and their information</p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supervisor
        </Button>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Supervisors List */}
      <div className="grid gap-6">
        {filteredSupervisors.map((supervisor, index) => (
          <motion.div
            key={supervisor.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{supervisor.name}</h3>
                      {supervisor.department && (
                        <p className="text-sm text-gray-600">{supervisor.department}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-sm">{supervisor.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{supervisor.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium">{supervisor.department || 'N/A'}</p>
                    </div>
                  </div>

                  {supervisor.notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{supervisor.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(supervisor)} disabled={submitting}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(supervisor.uid)} disabled={submitting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredSupervisors.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No supervisors found</h3>
            <p>There are currently no supervisors in the system.</p>
          </div>
        </Card>
      )}

      {/* Supervisor Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={editingSupervisor ? 'Edit Supervisor' : 'Add Supervisor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
              required
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
                required
                disabled={!!editingSupervisor || submitting}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
                disabled={submitting}
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Software Development, HR, etc."
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes about the supervisor..."
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : (editingSupervisor ? 'Update Supervisor' : 'Add Supervisor')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}