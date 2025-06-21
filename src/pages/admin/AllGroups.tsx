import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update, remove } from 'firebase/database';
import { Users, Search, UserCheck, GraduationCap, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { database } from '../../config/firebase';
import { Group, Intern, Supervisor } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function AllGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

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

      let groupsList: Group[] = [];
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        groupsList = Object.entries(groupsData).map(([id, group]: [string, any]) => ({
          id,
          ...group,
        }));
      }

      let internsList: Intern[] = [];
      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        internsList = Object.entries(internsData).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
      }

      let supervisorsList: Supervisor[] = [];
      if (supervisorsSnap.exists()) {
        const supervisorsData = supervisorsSnap.val();
        supervisorsList = Object.entries(supervisorsData).map(([uid, supervisor]: [string, any]) => ({
          uid,
          ...supervisor,
        }));
      }

      setGroups(groupsList);
      setInterns(internsList);
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group);
    setShowMemberModal(true);
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

  const handleDeleteGroup = async (groupId: string) => {
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

  const getSupervisorName = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.uid === supervisorId);
    return supervisor?.name || 'Unknown Supervisor';
  };

  const getGroupMembers = (group: Group) => {
    return (group.internIds || []).map(internId => 
      interns.find(intern => intern.uid === internId)
    ).filter(Boolean) as Intern[];
  };

  const getAvailableInternsForGroup = () => {
    if (!selectedGroup) return [];
    
    const currentGroupMembers = selectedGroup.internIds || [];
    return interns.filter(intern => !currentGroupMembers.includes(intern.uid));
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSupervisorName(group.supervisorId).toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">All Groups</h1>
          <p className="text-gray-600">View and manage all intern groups</p>
        </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Supervisor</p>
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{getSupervisorName(group.supervisorId)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Members ({members.length})</p>
                        <div className="space-y-1">
                          {members.slice(0, 3).map(member => (
                            <div key={member.uid} className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{member.name}</span>
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
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Manage Members
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDeleteGroup(group.id)}
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
            <p>No groups have been created yet.</p>
          </div>
        </Card>
      )}

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
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveMember(member.uid)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
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
    </div>
  );
}