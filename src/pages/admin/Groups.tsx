import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { Users, Plus, Edit, Trash2, Search, UserCheck, GraduationCap } from 'lucide-react';
import { database } from '../../config/firebase';
import { Group, Intern, Supervisor } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    supervisorId: '',
    internIds: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsSnap, internsSnap, supervisorsSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'supervisors')),
      ]);

      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        const groupsList = Object.entries(groupsData).map(([id, group]: [string, any]) => ({
          id,
          ...group,
        }));
        setGroups(groupsList);
      }

      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        const internsList = Object.entries(internsData).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
        setInterns(internsList);
      }

      if (supervisorsSnap.exists()) {
        const supervisorsData = supervisorsSnap.val();
        const supervisorsList = Object.entries(supervisorsData).map(([uid, supervisor]: [string, any]) => ({
          uid,
          ...supervisor,
        }));
        setSupervisors(supervisorsList);
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
      const groupData = {
        ...formData,
        createdAt: editingGroup?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingGroup) {
        await update(ref(database, `groups/${editingGroup.id}`), groupData);
        toast.success('Group updated successfully!');
      } else {
        await push(ref(database, 'groups'), groupData);
        toast.success('Group created successfully!');
      }

      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Failed to save group');
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      supervisorId: group.supervisorId,
      internIds: group.internIds,
    });
    setShowModal(true);
  };

  const handleDelete = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await remove(ref(database, `groups/${groupId}`));
        toast.success('Group deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting group:', error);
        toast.error('Failed to delete group');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      supervisorId: '',
      internIds: [],
    });
    setEditingGroup(null);
  };

  const getSupervisorName = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.uid === supervisorId);
    return supervisor?.name || 'Unknown Supervisor';
  };

  const getInternName = (internId: string) => {
    const intern = interns.find(i => i.uid === internId);
    return intern?.name || 'Unknown Intern';
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSupervisorName(group.supervisorId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInternToggle = (internId: string) => {
    setFormData(prev => ({
      ...prev,
      internIds: prev.internIds.includes(internId)
        ? prev.internIds.filter(id => id !== internId)
        : [...prev.internIds, internId]
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
          <h1 className="text-3xl font-bold text-gray-900">Group Management</h1>
          <p className="text-gray-600">Organize interns into groups with supervisors</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by group name or supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Groups List */}
      <div className="grid gap-6">
        {filteredGroups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-600">{group.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Supervisor</p>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{getSupervisorName(group.supervisorId)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Members ({group.internIds.length})</p>
                      <div className="space-y-1">
                        {group.internIds.slice(0, 3).map(internId => (
                          <div key={internId} className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{getInternName(internId)}</span>
                          </div>
                        ))}
                        {group.internIds.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{group.internIds.length - 3} more members
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(group)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(group.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No groups found</h3>
            <p>There are currently no groups created.</p>
          </div>
        </Card>
      )}

      {/* Group Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingGroup ? 'Edit Group' : 'Create Group'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description of the group..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supervisor *
            </label>
            <select
              value={formData.supervisorId}
              onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Supervisor</option>
              {supervisors.map(supervisor => (
                <option key={supervisor.uid} value={supervisor.uid}>
                  {supervisor.name} - {supervisor.department || 'No Department'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Interns
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
              {interns.map(intern => (
                <label key={intern.uid} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.internIds.includes(intern.uid)}
                    onChange={() => handleInternToggle(intern.uid)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{intern.name}</p>
                    <p className="text-xs text-gray-500">{intern.university}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.internIds.length} intern(s) selected
            </p>
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
              {editingGroup ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}