import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update, push, remove } from 'firebase/database';
import { UserCheck, Users, Search, ArrowRight, GraduationCap, UserPlus, UserMinus, Edit } from 'lucide-react';
import { database } from '../../config/firebase';
import { Intern, Supervisor, Group } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function SupervisorAssignment() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'assigned' | 'unassigned'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [internsSnap, supervisorsSnap, groupsSnap] = await Promise.all([
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'supervisors')),
        get(ref(database, 'groups')),
      ]);

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

      let groupsList: Group[] = [];
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        groupsList = Object.entries(groupsData).map(([id, group]: [string, any]) => ({
          id,
          ...group,
        }));
      }

      setInterns(internsList);
      setSupervisors(supervisorsList);
      setGroups(groupsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToSupervisor = (intern: Intern) => {
    setSelectedIntern(intern);
    const currentSupervisor = getInternSupervisor(intern.uid);
    setSelectedSupervisor(currentSupervisor?.uid || '');
    setShowAssignModal(true);
  };

  const handleBulkAssign = () => {
    if (selectedInterns.length === 0) {
      toast.error('Please select at least one intern');
      return;
    }
    setShowBulkAssignModal(true);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedIntern || submitting) return;

    setSubmitting(true);

    try {
      const currentGroup = groups.find(group => group.internIds?.includes(selectedIntern.uid));
      
      if (selectedSupervisor === '') {
        // Remove from current group (unassign supervisor)
        if (currentGroup) {
          const updatedInternIds = currentGroup.internIds?.filter(id => id !== selectedIntern.uid) || [];
          
          if (updatedInternIds.length === 0) {
            // Delete group if no interns left
            await remove(ref(database, `groups/${currentGroup.id}`));
            toast.success('Supervisor removed and empty group deleted!');
          } else {
            await update(ref(database, `groups/${currentGroup.id}`), {
              internIds: updatedInternIds,
              updatedAt: new Date().toISOString(),
            });
            toast.success('Supervisor removed successfully!');
          }
        }
      } else {
        // Remove from current group if exists
        if (currentGroup) {
          const updatedInternIds = currentGroup.internIds?.filter(id => id !== selectedIntern.uid) || [];
          
          if (updatedInternIds.length === 0) {
            // Delete group if no interns left
            await remove(ref(database, `groups/${currentGroup.id}`));
          } else {
            await update(ref(database, `groups/${currentGroup.id}`), {
              internIds: updatedInternIds,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        // Find or create group for new supervisor
        const newSupervisorGroup = groups.find(group => group.supervisorId === selectedSupervisor);
        
        if (newSupervisorGroup) {
          // Add to existing group
          const updatedInternIds = [...(newSupervisorGroup.internIds || []), selectedIntern.uid];
          await update(ref(database, `groups/${newSupervisorGroup.id}`), {
            internIds: updatedInternIds,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Create new group for supervisor
          const supervisorName = supervisors.find(s => s.uid === selectedSupervisor)?.name || 'Unknown';
          const groupData = {
            name: `${supervisorName}'s Group`,
            description: `Group managed by ${supervisorName}`,
            supervisorId: selectedSupervisor,
            internIds: [selectedIntern.uid],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await push(ref(database, 'groups'), groupData);
        }

        const supervisorName = supervisors.find(s => s.uid === selectedSupervisor)?.name || 'supervisor';
        toast.success(`${selectedIntern.name} assigned to ${supervisorName} successfully!`);
      }

      setShowAssignModal(false);
      setSelectedIntern(null);
      setSelectedSupervisor('');
      fetchData();
    } catch (error) {
      console.error('Error updating supervisor assignment:', error);
      toast.error('Failed to update supervisor assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmitAssignment = async () => {
    if (!selectedSupervisor || selectedInterns.length === 0 || submitting) return;

    setSubmitting(true);

    try {
      // Find or create group for supervisor
      let targetGroup = groups.find(group => group.supervisorId === selectedSupervisor);
      
      if (!targetGroup) {
        // Create new group for supervisor
        const supervisorName = supervisors.find(s => s.uid === selectedSupervisor)?.name || 'Unknown';
        const groupData = {
          name: `${supervisorName}'s Group`,
          description: `Group managed by ${supervisorName}`,
          supervisorId: selectedSupervisor,
          internIds: selectedInterns,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await push(ref(database, 'groups'), groupData);
      } else {
        // Add to existing group
        const existingInternIds = targetGroup.internIds || [];
        const newInternIds = selectedInterns.filter(id => !existingInternIds.includes(id));
        const updatedInternIds = [...existingInternIds, ...newInternIds];
        
        await update(ref(database, `groups/${targetGroup.id}`), {
          internIds: updatedInternIds,
          updatedAt: new Date().toISOString(),
        });
      }

      // Remove interns from their current groups
      for (const internId of selectedInterns) {
        const currentGroup = groups.find(group => 
          group.internIds?.includes(internId) && group.supervisorId !== selectedSupervisor
        );
        
        if (currentGroup) {
          const updatedInternIds = currentGroup.internIds?.filter(id => id !== internId) || [];
          
          if (updatedInternIds.length === 0) {
            // Delete group if no interns left
            await remove(ref(database, `groups/${currentGroup.id}`));
          } else {
            await update(ref(database, `groups/${currentGroup.id}`), {
              internIds: updatedInternIds,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      const supervisorName = supervisors.find(s => s.uid === selectedSupervisor)?.name || 'supervisor';
      toast.success(`${selectedInterns.length} interns assigned to ${supervisorName} successfully!`);

      setShowBulkAssignModal(false);
      setSelectedInterns([]);
      setSelectedSupervisor('');
      fetchData();
    } catch (error) {
      console.error('Error bulk assigning interns:', error);
      toast.error('Failed to assign interns');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFromSupervisor = async (internId: string) => {
    if (window.confirm('Are you sure you want to remove this intern from their supervisor?')) {
      try {
        const currentGroup = groups.find(group => group.internIds?.includes(internId));
        
        if (currentGroup) {
          const updatedInternIds = currentGroup.internIds?.filter(id => id !== internId) || [];
          
          if (updatedInternIds.length === 0) {
            // Delete group if no interns left
            await remove(ref(database, `groups/${currentGroup.id}`));
            toast.success('Intern removed and empty group deleted!');
          } else {
            await update(ref(database, `groups/${currentGroup.id}`), {
              internIds: updatedInternIds,
              updatedAt: new Date().toISOString(),
            });
            toast.success('Intern removed from supervisor successfully!');
          }
          
          fetchData();
        }
      } catch (error) {
        console.error('Error removing intern from supervisor:', error);
        toast.error('Failed to remove intern from supervisor');
      }
    }
  };

  const getSupervisorName = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.uid === supervisorId);
    return supervisor?.name || 'Unknown Supervisor';
  };

  const getInternSupervisor = (internId: string) => {
    const group = groups.find(g => g.internIds?.includes(internId));
    if (group) {
      return supervisors.find(s => s.uid === group.supervisorId);
    }
    return null;
  };

  const getInternGroup = (internId: string) => {
    return groups.find(g => g.internIds?.includes(internId));
  };

  const handleInternSelect = (internId: string) => {
    setSelectedInterns(prev => 
      prev.includes(internId) 
        ? prev.filter(id => id !== internId)
        : [...prev, internId]
    );
  };

  const filteredInterns = interns.filter(intern => {
    const matchesSearch = intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.university.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasAssignment = groups.some(group => group.internIds?.includes(intern.uid));
    
    if (viewMode === 'assigned') return matchesSearch && hasAssignment;
    if (viewMode === 'unassigned') return matchesSearch && !hasAssignment;
    return matchesSearch;
  });

  const assignedInterns = filteredInterns.filter(intern => 
    groups.some(group => group.internIds?.includes(intern.uid))
  );

  const unassignedInterns = filteredInterns.filter(intern => 
    !groups.some(group => group.internIds?.includes(intern.uid))
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
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Assignment</h1>
          <p className="text-gray-600">Assign interns to supervisors and manage groups</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedInterns.length > 0 && (
            <Button onClick={handleBulkAssign} disabled={submitting}>
              <UserPlus className="h-4 w-4 mr-2" />
              Bulk Assign ({selectedInterns.length})
            </Button>
          )}
        </div>
      </motion.div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search interns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('all')}
            >
              All ({interns.length})
            </Button>
            <Button
              variant={viewMode === 'assigned' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('assigned')}
            >
              Assigned ({assignedInterns.length})
            </Button>
            <Button
              variant={viewMode === 'unassigned' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('unassigned')}
            >
              Unassigned ({unassignedInterns.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{interns.length}</div>
          <div className="text-sm text-gray-600">Total Interns</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{assignedInterns.length}</div>
          <div className="text-sm text-gray-600">Assigned Interns</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{unassignedInterns.length}</div>
          <div className="text-sm text-gray-600">Unassigned Interns</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{supervisors.length}</div>
          <div className="text-sm text-gray-600">Total Supervisors</div>
        </Card>
      </div>

      {/* Bulk Selection Info */}
      {selectedInterns.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                {selectedInterns.length} intern(s) selected
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedInterns([])}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Interns List */}
      <div className="grid gap-4">
        {filteredInterns.map((intern, index) => {
          const supervisor = getInternSupervisor(intern.uid);
          const group = getInternGroup(intern.uid);
          const isSelected = selectedInterns.includes(intern.uid);
          
          return (
            <motion.div
              key={intern.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-6 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleInternSelect(intern.uid)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{intern.name}</h3>
                      <p className="text-sm text-gray-600">{intern.university} • GPA: {intern.gpa}</p>
                      <p className="text-xs text-gray-500">{intern.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {supervisor ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <UserCheck className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-green-700">{supervisor.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-700">{group?.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <UserMinus className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-orange-700">Unassigned</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleAssignToSupervisor(intern)}
                        disabled={submitting}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {supervisor ? 'Change' : 'Assign'}
                      </Button>
                      {supervisor && (
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleRemoveFromSupervisor(intern.uid)}
                          disabled={submitting}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredInterns.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No interns found</h3>
            <p>No interns match your current filter criteria.</p>
          </div>
        </Card>
      )}

      {/* Individual Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          if (!submitting) {
            setShowAssignModal(false);
            setSelectedIntern(null);
            setSelectedSupervisor('');
          }
        }}
        title={`${selectedIntern ? (getInternSupervisor(selectedIntern.uid) ? 'Change' : 'Assign') : ''} Supervisor for ${selectedIntern?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Intern Details</h4>
            <p className="text-sm text-blue-800">Name: {selectedIntern?.name}</p>
            <p className="text-sm text-blue-800">University: {selectedIntern?.university}</p>
            <p className="text-sm text-blue-800">GPA: {selectedIntern?.gpa}</p>
            {getInternSupervisor(selectedIntern?.uid || '') && (
              <p className="text-sm text-blue-800">
                Current Supervisor: {getInternSupervisor(selectedIntern?.uid || '')?.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Supervisor
            </label>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            >
              <option value="">No Supervisor (Unassign)</option>
              {supervisors.map(supervisor => (
                <option key={supervisor.uid} value={supervisor.uid}>
                  {supervisor.name} - {supervisor.department || 'No Department'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select "No Supervisor" to remove the current supervisor assignment
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!submitting) {
                  setShowAssignModal(false);
                  setSelectedIntern(null);
                  setSelectedSupervisor('');
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAssignment}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Assignment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Assignment Modal */}
      <Modal
        isOpen={showBulkAssignModal}
        onClose={() => {
          if (!submitting) {
            setShowBulkAssignModal(false);
            setSelectedSupervisor('');
          }
        }}
        title={`Bulk Assign ${selectedInterns.length} Interns`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected Interns ({selectedInterns.length})</h4>
            <div className="max-h-32 overflow-y-auto">
              {selectedInterns.map(internId => {
                const intern = interns.find(i => i.uid === internId);
                return (
                  <p key={internId} className="text-sm text-blue-800">
                    • {intern?.name} ({intern?.university})
                  </p>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Supervisor *
            </label>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            >
              <option value="">Choose a supervisor</option>
              {supervisors.map(supervisor => (
                <option key={supervisor.uid} value={supervisor.uid}>
                  {supervisor.name} - {supervisor.department || 'No Department'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              All selected interns will be assigned to this supervisor
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!submitting) {
                  setShowBulkAssignModal(false);
                  setSelectedSupervisor('');
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkSubmitAssignment}
              disabled={!selectedSupervisor || submitting}
            >
              {submitting ? 'Assigning...' : 'Assign All'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}