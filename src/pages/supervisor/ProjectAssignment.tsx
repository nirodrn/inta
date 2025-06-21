import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { FolderOpen, Plus, Edit, Trash2, Search, Users, Calendar, CheckCircle, Clock } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Intern, Group } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  deadline: string;
  assignedTo: 'individual' | 'group';
  assignedIds: string[];
  supervisorId: string;
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
  updatedAt?: string;
}

export default function ProjectAssignment() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myInterns, setMyInterns] = useState<Intern[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    assignedTo: 'individual' as 'individual' | 'group',
    assignedIds: [] as string[],
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [projectsSnap, groupsSnap, internsSnap] = await Promise.all([
        get(ref(database, 'projects')),
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
      ]);

      // Get projects created by this supervisor
      let supervisorProjects: Project[] = [];
      if (projectsSnap.exists()) {
        const projectsData = projectsSnap.val();
        supervisorProjects = Object.entries(projectsData)
          .map(([id, project]: [string, any]) => ({ id, ...project }))
          .filter((project: Project) => project.supervisorId === currentUser?.uid);
      }

      // Get groups supervised by current user
      let supervisorGroups: Group[] = [];
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        supervisorGroups = Object.entries(groupsData)
          .map(([id, group]: [string, any]) => ({ id, ...group }))
          .filter((group: Group) => group.supervisorId === currentUser?.uid);
      }

      // Get supervisor's interns
      let supervisorInterns: Intern[] = [];
      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        supervisorGroups.forEach(group => {
          group.internIds?.forEach(internId => {
            const internData = internsData[internId];
            if (internData) {
              supervisorInterns.push({
                uid: internId,
                ...internData,
                groupName: group.name
              });
            }
          });
        });
      }

      // Update project status based on deadline
      const updatedProjects = supervisorProjects.map(project => {
        const deadline = new Date(project.deadline);
        const now = new Date();
        
        let status = project.status;
        if (status !== 'completed' && deadline < now) {
          status = 'overdue';
        } else if (status !== 'completed') {
          status = 'active';
        }
        
        return { ...project, status };
      });

      setProjects(updatedProjects);
      setMyGroups(supervisorGroups);
      setMyInterns(supervisorInterns);
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
    
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Project description is required');
      return;
    }
    if (!formData.deadline) {
      toast.error('Deadline is required');
      return;
    }
    if (formData.assignedIds.length === 0) {
      toast.error('Please assign the project to at least one intern or group');
      return;
    }

    setSubmitting(true);

    try {
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline,
        assignedTo: formData.assignedTo,
        assignedIds: formData.assignedIds,
        supervisorId: currentUser?.uid,
        status: 'active',
        createdAt: editingProject?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingProject) {
        await update(ref(database, `projects/${editingProject.id}`), projectData);
        toast.success('Project updated successfully!');
      } else {
        await push(ref(database, 'projects'), projectData);
        toast.success('Project assigned successfully!');
      }

      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      deadline: project.deadline,
      assignedTo: project.assignedTo,
      assignedIds: project.assignedIds,
    });
    setShowModal(true);
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await remove(ref(database, `projects/${projectId}`));
        toast.success('Project deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    try {
      await update(ref(database, `projects/${projectId}`), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Project marked as completed!');
      fetchData();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      assignedTo: 'individual',
      assignedIds: [],
    });
    setEditingProject(null);
  };

  const handleAssignmentToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignedIds: prev.assignedIds.includes(id)
        ? prev.assignedIds.filter(assignedId => assignedId !== id)
        : [...prev.assignedIds, id]
    }));
  };

  const getAssignmentDisplay = (project: Project) => {
    if (project.assignedTo === 'group') {
      const groupNames = project.assignedIds.map(id => {
        const group = myGroups.find(g => g.id === id);
        return group?.name || 'Unknown Group';
      }).join(', ');
      return `Groups: ${groupNames}`;
    } else {
      const internNames = project.assignedIds.map(id => {
        const intern = myInterns.find(i => i.uid === id);
        return intern?.name || 'Unknown Intern';
      }).join(', ');
      return `Interns: ${internNames}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'overdue':
        return Clock;
      default:
        return Clock;
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Project Assignment</h1>
          <p className="text-gray-600">Assign and manage projects for your interns</p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Project
        </Button>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Projects List */}
      <div className="grid gap-6">
        {filteredProjects.map((project, index) => {
          const StatusIcon = getStatusIcon(project.status);
          
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-600">{project.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Deadline</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">
                            {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-4 w-4 ${project.status === 'completed' ? 'text-green-500' : project.status === 'overdue' ? 'text-red-500' : 'text-blue-500'}`} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Assigned To</p>
                        <p className="font-medium capitalize">{project.assignedTo}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Assignment Details</p>
                      <p className="text-sm font-medium">{getAssignmentDisplay(project)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {project.status !== 'completed' && (
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => handleMarkComplete(project.id)}
                        disabled={submitting}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleEdit(project)}
                      disabled={submitting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDelete(project.id)}
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

      {filteredProjects.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No projects found</h3>
            <p>Assign your first project to get started.</p>
          </div>
        </Card>
      )}

      {/* Project Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!submitting) {
            setShowModal(false);
            resetForm();
          }
        }}
        title={editingProject ? 'Edit Project' : 'Assign Project'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project title"
              required
              disabled={submitting}
              autoComplete="off"
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
              placeholder="Enter project description and requirements"
              required
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To *
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  assignedTo: e.target.value as 'individual' | 'group',
                  assignedIds: []
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              >
                <option value="individual">Individual Interns</option>
                <option value="group">Groups</option>
              </select>
            </div>
          </div>

          {formData.assignedTo === 'group' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Groups *
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {myGroups.map(group => (
                  <label key={group.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedIds.includes(group.id)}
                      onChange={() => handleAssignmentToggle(group.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
                {myGroups.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No groups available
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Interns *
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {myInterns.map(intern => (
                  <label key={intern.uid} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedIds.includes(intern.uid)}
                      onChange={() => handleAssignmentToggle(intern.uid)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span className="text-sm">{intern.name}</span>
                  </label>
                ))}
                {myInterns.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No interns available
                  </p>
                )}
              </div>
            </div>
          )}

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
              {submitting ? 'Saving...' : (editingProject ? 'Update Project' : 'Assign Project')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}