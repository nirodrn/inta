import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { FileText, Plus, Edit, Trash2, Search, Download, Eye, Calendar } from 'lucide-react';
import { database } from '../../config/firebase';
import { Assignment, Intern, Group } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    targetAudience: 'all' as 'individual' | 'group' | 'all',
    targetIds: [] as string[],
    fileUrl: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsSnap, internsSnap, groupsSnap] = await Promise.all([
        get(ref(database, 'assignments')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'groups')),
      ]);

      if (assignmentsSnap.exists()) {
        const assignmentsData = assignmentsSnap.val();
        const assignmentsList = Object.entries(assignmentsData).map(([id, assignment]: [string, any]) => ({
          id,
          ...assignment,
        }));
        setAssignments(assignmentsList);
      }

      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        const internsList = Object.entries(internsData).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
        setInterns(internsList);
      }

      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        const groupsList = Object.entries(groupsData).map(([id, group]: [string, any]) => ({
          id,
          ...group,
        }));
        setGroups(groupsList);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assignmentData = {
        ...formData,
        createdBy: 'admin', // In a real app, this would be the current user's ID
        createdAt: editingAssignment?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingAssignment) {
        await update(ref(database, `assignments/${editingAssignment.id}`), assignmentData);
        toast.success('Assignment updated successfully!');
      } else {
        await push(ref(database, 'assignments'), assignmentData);
        toast.success('Assignment created successfully!');
      }

      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to save assignment');
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline,
      targetAudience: assignment.targetAudience,
      targetIds: assignment.targetIds || [],
      fileUrl: assignment.fileUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await remove(ref(database, `assignments/${assignmentId}`));
        toast.success('Assignment deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        toast.error('Failed to delete assignment');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      targetAudience: 'all',
      targetIds: [],
      fileUrl: '',
    });
    setEditingAssignment(null);
  };

  const getTargetDisplay = (assignment: Assignment) => {
    if (assignment.targetAudience === 'all') {
      return 'All Interns';
    } else if (assignment.targetAudience === 'group') {
      const groupNames = assignment.targetIds?.map(id => {
        const group = groups.find(g => g.id === id);
        return group?.name || 'Unknown Group';
      }).join(', ');
      return `Groups: ${groupNames}`;
    } else {
      const internNames = assignment.targetIds?.map(id => {
        const intern = interns.find(i => i.uid === id);
        return intern?.name || 'Unknown Intern';
      }).join(', ');
      return `Interns: ${internNames}`;
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTargetToggle = (targetId: string) => {
    setFormData(prev => ({
      ...prev,
      targetIds: prev.targetIds.includes(targetId)
        ? prev.targetIds.filter(id => id !== targetId)
        : [...prev.targetIds, targetId]
    }));
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Assignment Management</h1>
          <p className="text-gray-600">Create and manage assignments for interns</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Assignments List */}
      <div className="grid gap-6">
        {filteredAssignments.map((assignment, index) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Deadline</p>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Target Audience</p>
                      <p className="font-medium capitalize">{assignment.targetAudience}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assigned To</p>
                      <p className="font-medium text-sm">{getTargetDisplay(assignment)}</p>
                    </div>
                  </div>

                  {assignment.fileUrl && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Download className="h-4 w-4" />
                      <a
                        href={assignment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        Download Assignment File
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(assignment)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(assignment.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No assignments found</h3>
            <p>There are currently no assignments created.</p>
          </div>
        </Card>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience *
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  targetAudience: e.target.value as 'individual' | 'group' | 'all',
                  targetIds: [] // Reset target IDs when audience changes
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="all">All Interns</option>
                <option value="group">Specific Groups</option>
                <option value="individual">Individual Interns</option>
              </select>
            </div>
          </div>

          {formData.targetAudience === 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Groups
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {groups.map(group => (
                  <label key={group.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetIds.includes(group.id)}
                      onChange={() => handleTargetToggle(group.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.targetAudience === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Interns
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {interns.map(intern => (
                  <label key={intern.uid} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetIds.includes(intern.uid)}
                      onChange={() => handleTargetToggle(intern.uid)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{intern.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment File URL
            </label>
            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/assignment.pdf"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}