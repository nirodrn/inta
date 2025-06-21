import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { Users, Plus, Edit, Trash2, Search, UserPlus, UserMinus, GraduationCap, MessageSquare, ArrowLeftRight } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Group, Intern } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function GroupManagement() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [availableInterns, setAvailableInterns] = useState<Intern[]>([]);
  const [allInterns, setAllInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    internIds: [] as string[],
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [groupsSnap, internsSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
      ]);

      // Get groups supervised by current user
      let supervisorGroups: Group[] = [];
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        supervisorGroups = Object.entries(groupsData)
          .map(([id, group]: [string, any]) => ({ id, ...group }))
          .filter((group: Group) => group.supervisorId === currentUser?.uid);
      }

      // Get all interns
      let internsList: Intern[] = [];
      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        internsList = Object.entries(internsData).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
      }

      // Get interns not assigned to any group supervised by current user
      const assignedInternIds = supervisorGroups.flatMap(group => group.internIds || []);
      const availableInterns = internsList.filter(intern => !assignedInternIds.includes(intern.uid));

      setGroups(supervisorGroups);
      setAllInterns(internsList);
      setAvailableInterns(availableInterns);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;
    
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setSubmitting(true);

    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        supervisorId: currentUser?.uid,
        internIds: formData.internIds,
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      internIds: group.internIds || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
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

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group);
    setShowMemberModal(true);
  };

  const handleMoveIntern = (intern: Intern) => {
    setSelectedIntern(intern);
    setTargetGroupId('');
    setShowMoveModal(true);
  };

  const handleAddMember = async (internId: string) => {
    if (!selectedGroup) return;

    try {
      const updatedInternIds = [...(selectedGroup.internIds || []), internId];
      await update(ref(database, `groups/${selectedGroup.id}`), {
        internIds: updatedInternIds,
        updatedAt: new Date().toISOString(),
      });
      
      toast.success('Member added successfully!');
      fetchData();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (internId: string) => {
    if (!selectedGroup) return;

    if (window.confirm('Are you sure you want to remove this member from the group?')) {
      try {
        const updatedInternIds = (selectedGroup.internIds || []).filter(id => id !== internId);
        await update(ref(database, `groups/${selectedGroup.id}`), {
          internIds: updatedInternIds,
          updatedAt: new Date().toISOString(),
        });
        
        toast.success('Member removed successfully!');
        fetchData();
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove member');
      }
    }
  };

  const handleMoveInternToGroup = async () => {
    if (!selectedIntern || !targetGroupId || submitting) return;

    setSubmitting(true);

    try {
      // Find current group
      const currentGroup = groups.find(group => group.internIds?.includes(selectedIntern.uid));
      
      // Remove from current group
      if (currentGroup) {
        const updatedCurrentGroupInterns = currentGroup.internIds?.filter(id => id !== selectedIntern.uid) || [];
        await update(ref(database, `groups/${currentGroup.id}`), {
          internIds: updatedCurrentGroupInterns,
          updatedAt: new Date().toISOString(),
        });
      }

      // Add to target group
      const targetGroup = groups.find(group => group.id === targetGroupId);
      if (targetGroup) {
        const updatedTargetGroupInterns = [...(targetGroup.internIds || []), selectedIntern.uid];
        await update(ref(database, `groups/${targetGroupId}`), {
          internIds: updatedTargetGroupInterns,
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success(`${selectedIntern.name} moved successfully!`);
      setShowMoveModal(false);
      setSelectedIntern(null);
      setTargetGroupId('');
      fetchData();
    } catch (error) {
      console.error('Error moving intern:', error);
      toast.error('Failed to move intern');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      internIds: [],
    });
    setEditingGroup(null);
  };

  const handleInternToggle = (internId: string) => {
    setFormData(prev => ({
      ...prev,
      internIds: prev.internIds.includes(internId)
        ? prev.internIds.filter(id => id !== internId)
        : [...prev.internIds, internId]
    }));
  };

  const getGroupMembers = (group: Group) => {
    return (group.internIds || []).map(internId => 
      allInterns.find(intern => intern.uid === internId)
    ).filter(Boolean) as Intern[];
  };

  const getAvailableInternsForGroup = () => {
    if (!selectedGroup) return availableInterns;
    
    const currentGroupMembers = selectedGroup.internIds || [];
    return allInterns.filter(intern => !currentGroupMembers.includes(intern.uid));
  };

  const getOtherGroups = () => {
    return groups.filter(group => group.id !== (selectedIntern ? 
      groups.find(g => g.internIds?.includes(selectedIntern.uid))?.id : ''));
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-3xl font-bold text-gray-900">Group Management</h1>
          <p className="text-gray-600">Create and manage intern groups</p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={submitting}>
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
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Groups List */}
      <div className="grid gap-6">
        {filteredGroups.map((group, index) => {
          const members = getGroupMembers(group);
          
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-start">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Members ({members.length})</p>
                        <div className="space-y-1">
                          {members.slice(0, 3).map(member => (
                            <div key={member.uid} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <GraduationCap className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{member.name}</span>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleMoveIntern(member)}
                                className="ml-2 px-2 py-1"
                              >
                                <ArrowLeftRight className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {members.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{members.length - 3} more members
                            </p>
                          )}
                          {members.length === 0 && (
                            <p className="text-xs text-gray-500">No members assigned</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="font-medium">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleManageMembers(group)}
                      disabled={submitting}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Members
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleEdit(group)}
                      disabled={submitting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDelete(group.id)}
                      disabled={submitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No groups found</h3>
            <p>Create your first group to get started.</p>
          </div>
        </Card>
      )}

      {/* Create/Edit Group Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!submitting) {
            setShowModal(false);
            resetForm();
          }
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
              placeholder="Enter group name"
              required
              disabled={submitting}
              autoComplete="off"
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
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Interns
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
              {availableInterns.map(intern => (
                <label key={intern.uid} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.internIds.includes(intern.uid)}
                    onChange={() => handleInternToggle(intern.uid)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{intern.name}</p>
                    <p className="text-xs text-gray-500">{intern.university}</p>
                  </div>
                </label>
              ))}
              {availableInterns.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No available interns to assign
                </p>
              )}
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
                if (!submitting) {
                  setShowModal(false);
                  resetForm();
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Members Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title={`Manage Members - ${selectedGroup?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Current Members */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Current Members</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedGroup && getGroupMembers(selectedGroup).map(member => (
                <div key={member.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.university}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMoveIntern(member)}
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveMember(member.uid)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {selectedGroup && getGroupMembers(selectedGroup).length === 0 && (
                <p className="text-gray-500 text-center py-4">No members in this group</p>
              )}
            </div>
          </div>

          {/* Available Interns */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Available Interns</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getAvailableInternsForGroup().map(intern => (
                <div key={intern.uid} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{intern.name}</p>
                      <p className="text-xs text-gray-500">{intern.university}</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddMember(intern.uid)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {getAvailableInternsForGroup().length === 0 && (
                <p className="text-gray-500 text-center py-4">No available interns to add</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Move Intern Modal */}
      <Modal
        isOpen={showMoveModal}
        onClose={() => {
          if (!submitting) {
            setShowMoveModal(false);
            setSelectedIntern(null);
            setTargetGroupId('');
          }
        }}
        title={`Move ${selectedIntern?.name} to Another Group`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Intern Details</h4>
            <p className="text-sm text-blue-800">Name: {selectedIntern?.name}</p>
            <p className="text-sm text-blue-800">University: {selectedIntern?.university}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Target Group *
            </label>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            >
              <option value="">Choose a group</option>
              {getOtherGroups().map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({(group.internIds || []).length} members)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              The intern will be moved from their current group to the selected group
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!submitting) {
                  setShowMoveModal(false);
                  setSelectedIntern(null);
                  setTargetGroupId('');
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMoveInternToGroup}
              disabled={!targetGroupId || submitting}
            >
              {submitting ? 'Moving...' : 'Move Intern'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}