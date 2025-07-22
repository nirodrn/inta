import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update } from 'firebase/database';
import { FolderOpen, Calendar, Clock, CheckCircle, AlertCircle, Users, User, ExternalLink } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  deadline: string;
  assignedTo: 'individual' | 'group';
  assignedIds: string[];
  supervisorId: string;
  supervisorName?: string;
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
  updatedAt?: string;
  completedBy?: string;
  completedAt?: string;
}

interface Group {
  id: string;
  name: string;
  supervisorId: string;
  internIds: string[];
}

export default function InternProjects() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProjects();
    }
  }, [currentUser]);

  const fetchProjects = async () => {
    try {
      const [projectsSnap, groupsSnap, supervisorsSnap] = await Promise.all([
        get(ref(database, 'projects')),
        get(ref(database, 'groups')),
        get(ref(database, 'supervisors')),
      ]);

      let userProjects: Project[] = [];

      if (projectsSnap.exists()) {
        const projectsData = projectsSnap.val();
        const supervisorsData = supervisorsSnap.exists() ? supervisorsSnap.val() : {};
        const groupsData = groupsSnap.exists() ? groupsSnap.val() : {};

        // Find user's group(s)
        const userGroups = Object.entries(groupsData).filter(([id, group]: [string, any]) => 
          group.internIds?.includes(currentUser?.uid)
        );

        Object.entries(projectsData).forEach(([id, project]: [string, any]) => {
          let isAssigned = false;

          if (project.assignedTo === 'individual') {
            // Check if directly assigned to this intern
            isAssigned = project.assignedIds?.includes(currentUser?.uid);
          } else if (project.assignedTo === 'group') {
            // Check if assigned to any of the user's groups
            isAssigned = userGroups.some(([groupId]) => 
              project.assignedIds?.includes(groupId)
            );
          }

          if (isAssigned) {
            // Get supervisor name
            const supervisor = supervisorsData[project.supervisorId];
            const supervisorName = supervisor?.name || 'Unknown Supervisor';

            // Update status based on deadline
            let status = project.status;
            const deadline = new Date(project.deadline);
            const now = new Date();
            
            if (status !== 'completed' && deadline < now) {
              status = 'overdue';
            } else if (status !== 'completed') {
              status = 'active';
            }

            userProjects.push({
              id,
              ...project,
              supervisorName,
              status,
            });
          }
        });
      }

      // Sort by creation date (newest first)
      userProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setProjects(userProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
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
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    if (updating) return;
    
    if (window.confirm('Are you sure you want to mark this project as completed?')) {
      setUpdating(projectId);
      
      try {
        await update(ref(database, `projects/${projectId}`), {
          status: 'completed',
          completedBy: currentUser?.uid,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        toast.success('Project marked as completed!');
        fetchProjects();
      } catch (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
      } finally {
        setUpdating(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    if (timeString) {
      return `${dateStr} at ${timeString}`;
    }
    
    return dateStr;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const extractLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const renderDescriptionWithLinks = (description: string) => {
    const links = extractLinks(description);
    let processedText = description;
    
    links.forEach(link => {
      processedText = processedText.replace(
        link,
        `<a href="${link}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${link}</a>`
      );
    });
    
    return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
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
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600">View and track your assigned projects</p>
        </div>
      </motion.div>

      {/* Projects Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{projects.length}</div>
          <div className="text-sm text-gray-600">Total Projects</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {projects.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {projects.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </Card>
      </div>

      {/* Projects List */}
      <div className="grid gap-6">
        {projects.map((project, index) => {
          const StatusIcon = getStatusIcon(project.status);
          const daysUntilDeadline = getDaysUntilDeadline(project.deadline);
          const links = extractLinks(project.description);
          
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-600">Assigned by {project.supervisorName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Deadline</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">
                            {formatDateTime(project.deadline, (project as any).deadlineTime)}
                          </span>
                        </div>
                        {daysUntilDeadline >= 0 && project.status !== 'completed' && (
                          <p className={`text-xs mt-1 ${
                            daysUntilDeadline <= 3 ? 'text-red-600' : 
                            daysUntilDeadline <= 7 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {daysUntilDeadline === 0 ? 'Due today' : 
                             daysUntilDeadline === 1 ? 'Due tomorrow' : 
                             `${daysUntilDeadline} days left`}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-4 w-4 ${
                            project.status === 'completed' ? 'text-green-500' : 
                            project.status === 'overdue' ? 'text-red-500' : 'text-blue-500'
                          }`} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Assignment Type</p>
                        <div className="flex items-center space-x-2">
                          {project.assignedTo === 'individual' ? (
                            <User className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Users className="h-4 w-4 text-purple-500" />
                          )}
                          <span className="font-medium capitalize">{project.assignedTo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Description</p>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {renderDescriptionWithLinks(project.description)}
                      </div>
                    </div>

                    {/* Quick Links */}
                    {links.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Quick Links</p>
                        <div className="flex flex-wrap gap-2">
                          {links.map((link, linkIndex) => (
                            <a
                              key={linkIndex}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>
                                {link.includes('github.com') ? 'GitHub' : 
                                 link.includes('drive.google.com') ? 'Google Drive' : 
                                 'Link'}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {project.status !== 'completed' && (
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => handleMarkComplete(project.id)}
                      disabled={updating === project.id}
                    >
                      {updating === project.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {updating === project.id ? 'Updating...' : 'Mark Complete'}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No projects assigned</h3>
            <p>You don't have any projects assigned to you yet.</p>
          </div>
        </Card>
      )}
    </div>
  );
}