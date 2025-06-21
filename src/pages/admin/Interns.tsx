import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Users, Plus, Edit, Trash2, Search, GraduationCap } from 'lucide-react';
import { database, auth } from '../../config/firebase';
import { Intern } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function Interns() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    university: '',
    gpa: '',
    skills: '',
    weaknesses: '',
  });

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const snapshot = await get(ref(database, 'acceptedInterns'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const internsList = Object.entries(data).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
        setInterns(internsList);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      toast.error('Failed to fetch interns');
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
    if (!formData.university.trim()) {
      toast.error('University is required');
      return;
    }
    if (!formData.gpa || parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4) {
      toast.error('Valid GPA (0-4) is required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingIntern) {
        // Update existing intern
        const internData = {
          name: formData.name.trim(),
          nickname: formData.nickname.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          university: formData.university.trim(),
          gpa: parseFloat(formData.gpa),
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
          weaknesses: formData.weaknesses.split(',').map(s => s.trim()).filter(s => s),
          role: 'intern',
          updatedAt: new Date().toISOString(),
        };

        await update(ref(database, `acceptedInterns/${editingIntern.uid}`), internData);
        toast.success('Intern updated successfully!');
      } else {
        // Create new intern
        const defaultPassword = 'intern123';
        
        let userCredential;
        let newUid = `intern_${Date.now()}`;
        
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

        const internData = {
          name: formData.name.trim(),
          nickname: formData.nickname.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          university: formData.university.trim(),
          gpa: parseFloat(formData.gpa),
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
          weaknesses: formData.weaknesses.split(',').map(s => s.trim()).filter(s => s),
          role: 'intern',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await update(ref(database, `acceptedInterns/${newUid}`), internData);
        toast.success(`Intern created successfully! Login credentials - Email: ${formData.email}, Password: ${defaultPassword}`);
      }

      resetForm();
      setShowModal(false);
      fetchInterns();
    } catch (error) {
      console.error('Error saving intern:', error);
      toast.error('Failed to save intern: ' + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (intern: Intern) => {
    setEditingIntern(intern);
    setFormData({
      name: intern.name || '',
      nickname: intern.nickname || '',
      email: intern.email || '',
      phone: intern.phone || '',
      university: intern.university || '',
      gpa: intern.gpa?.toString() || '',
      skills: intern.skills?.join(', ') || '',
      weaknesses: intern.weaknesses?.join(', ') || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (internId: string) => {
    if (window.confirm('Are you sure you want to delete this intern?')) {
      try {
        await remove(ref(database, `acceptedInterns/${internId}`));
        toast.success('Intern deleted successfully!');
        fetchInterns();
      } catch (error) {
        console.error('Error deleting intern:', error);
        toast.error('Failed to delete intern');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nickname: '',
      email: '',
      phone: '',
      university: '',
      gpa: '',
      skills: '',
      weaknesses: '',
    });
    setEditingIntern(null);
  };

  const handleModalClose = () => {
    if (!submitting) {
      setShowModal(false);
      resetForm();
    }
  };

  const filteredInterns = interns.filter(intern =>
    (intern.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (intern.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (intern.university?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Intern Management</h1>
          <p className="text-gray-600">Manage accepted interns and their profiles</p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          Add Intern
        </Button>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Interns List */}
      <div className="grid gap-6">
        {filteredInterns.map((intern, index) => (
          <motion.div
            key={intern.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{intern.name}</h3>
                      {intern.nickname && (
                        <p className="text-sm text-gray-600">"{intern.nickname}"</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-sm">{intern.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{intern.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">University</p>
                      <p className="font-medium">{intern.university}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">GPA</p>
                      <p className="font-medium">{intern.gpa}</p>
                    </div>
                  </div>

                  {intern.skills && intern.skills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {intern.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {intern.weaknesses && intern.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Areas for Improvement</p>
                      <div className="flex flex-wrap gap-2">
                        {intern.weaknesses.map((weakness, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                          >
                            {weakness}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(intern)} disabled={submitting}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(intern.uid)} disabled={submitting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredInterns.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No interns found</h3>
            <p>There are currently no accepted interns.</p>
          </div>
        </Card>
      )}

      {/* Intern Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={editingIntern ? 'Edit Intern' : 'Add Intern'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter nickname"
                disabled={submitting}
                autoComplete="off"
              />
            </div>
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
                disabled={!!editingIntern || submitting}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University *
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => handleInputChange('university', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter university name"
                required
                disabled={submitting}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPA *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={formData.gpa}
                onChange={(e) => handleInputChange('gpa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter GPA (0-4)"
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="React, Node.js, Python, etc."
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas for Improvement (comma-separated)
            </label>
            <input
              type="text"
              value={formData.weaknesses}
              onChange={(e) => handleInputChange('weaknesses', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Communication, Time management, etc."
              disabled={submitting}
              autoComplete="off"
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
              {submitting ? 'Saving...' : (editingIntern ? 'Update Intern' : 'Add Intern')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}