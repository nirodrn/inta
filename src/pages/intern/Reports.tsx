import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileText, Upload, Calendar, CheckCircle, Clock, AlertCircle, Download, Eye, Star } from 'lucide-react';
import { database, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentSubmission, Project, Assignment } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function InternReports() {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignmentId: '',
    type: 'project' as 'project' | 'assignment' | 'general',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [submissionsSnap, projectsSnap, assignmentsSnap, groupsSnap] = await Promise.all([
        get(ref(database, 'documentSubmissions')),
        get(ref(database, 'projects')),
        get(ref(database, 'assignments')),
        get(ref(database, 'groups')),
      ]);

      // Get user's submissions
      let userSubmissions: DocumentSubmission[] = [];
      if (submissionsSnap.exists()) {
        const submissionsData = submissionsSnap.val();
        userSubmissions = Object.entries(submissionsData)
          .map(([id, submission]: [string, any]) => ({ id, ...submission }))
          .filter((submission: DocumentSubmission) => submission.internId === currentUser?.uid);
      }

      // Get user's projects
      let userProjects: Project[] = [];
      if (projectsSnap.exists() && groupsSnap.exists()) {
        const projectsData = projectsSnap.val();
        const groupsData = groupsSnap.val();
        
        // Find user's groups
        const userGroups = Object.entries(groupsData).filter(([id, group]: [string, any]) => 
          group.internIds?.includes(currentUser?.uid)
        );

        Object.entries(projectsData).forEach(([id, project]: [string, any]) => {
          let isAssigned = false;

          if (project.assignedTo === 'individual') {
            isAssigned = project.assignedIds?.includes(currentUser?.uid);
          } else if (project.assignedTo === 'group') {
            isAssigned = userGroups.some(([groupId]) => 
              project.assignedIds?.includes(groupId)
            );
          }

          if (isAssigned) {
            userProjects.push({ id, ...project });
          }
        });
      }

      // Get user's assignments
      let userAssignments: Assignment[] = [];
      if (assignmentsSnap.exists()) {
        const assignmentsData = assignmentsSnap.val();
        Object.entries(assignmentsData).forEach(([id, assignment]: [string, any]) => {
          if (assignment.targetAudience === 'all' || 
              (assignment.targetAudience === 'individual' && assignment.targetIds?.includes(currentUser?.uid))) {
            userAssignments.push({ id, ...assignment });
          }
        });
      }

      setSubmissions(userSubmissions);
      setProjects(userProjects);
      setAssignments(userAssignments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a PDF or Word document');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title for your report');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setUploading(true);

    try {
      // Upload file to Firebase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const fileRef = storageRef(storage, `reports/${currentUser?.uid}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Get supervisor ID
      const groupsSnap = await get(ref(database, 'groups'));
      let supervisorId = '';
      
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        const userGroup = Object.values(groupsData).find((group: any) => 
          group.internIds?.includes(currentUser?.uid)
        );
        supervisorId = (userGroup as any)?.supervisorId || '';
      }

      // Save submission to database
      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: formData.type === 'project' ? formData.projectId : '',
        assignmentId: formData.type === 'assignment' ? formData.assignmentId : '',
        internId: currentUser?.uid,
        internName: currentUser?.name,
        supervisorId,
        fileUrl: downloadURL,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      };

      await push(ref(database, 'documentSubmissions'), submissionData);
      
      toast.success('Report submitted successfully!');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      projectId: '',
      assignmentId: '',
      type: 'project',
    });
    setSelectedFile(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'text-green-600 bg-green-100';
      case 'needs_revision':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return CheckCircle;
      case 'needs_revision':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h1 className="text-3xl font-bold text-gray-900">Report Submissions</h1>
          <p className="text-gray-600">Submit and track your project and assignment reports</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Submit Report
        </Button>
      </motion.div>

      {/* Submission Guidelines */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Report Submission Guidelines</h3>
        <div className="space-y-3 text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">📄 Document Format</h4>
              <ul className="text-sm space-y-1">
                <li>• PDF or Word document only</li>
                <li>• Times New Roman font</li>
                <li>• Well-organized structure</li>
                <li>• Include page numbers</li>
                <li>• Add your name on each page</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📝 Required Content</h4>
              <ul className="text-sm space-y-1">
                <li>• Daily project activities (table format preferred)</li>
                <li>• What you learned from the project</li>
                <li>• AI tools used (excluding bolt.new type tools)</li>
                <li>• GitHub link or Google Drive link</li>
                <li>• Set document access for your supervisor</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Both individual and group project members must submit their own reports. 
              Ensure your document is accessible to your supervisor for review and grading.
            </p>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <div className="grid gap-6">
        {submissions.map((submission, index) => {
          const StatusIcon = getStatusIcon(submission.status);
          const relatedProject = projects.find(p => p.id === submission.projectId);
          const relatedAssignment = assignments.find(a => a.id === submission.assignmentId);
          
          return (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{submission.title}</h3>
                        <p className="text-sm text-gray-600">{submission.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Submitted</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-4 w-4 ${
                            submission.status === 'graded' ? 'text-green-500' : 
                            submission.status === 'needs_revision' ? 'text-orange-500' : 'text-blue-500'
                          }`} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status === 'submitted' ? 'Pending Review' :
                             submission.status === 'graded' ? 'Graded' : 'Needs Revision'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">File</p>
                        <p className="font-medium text-sm">{submission.fileName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(submission.fileSize)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Related To</p>
                        <p className="font-medium text-sm">
                          {relatedProject ? relatedProject.title : 
                           relatedAssignment ? relatedAssignment.title : 'General Report'}
                        </p>
                      </div>
                    </div>

                    {submission.grade !== undefined && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold text-green-800">Grade: {submission.grade}/100</span>
                        </div>
                        {submission.feedback && (
                          <div>
                            <p className="text-xs text-green-600 mb-1">Supervisor Feedback:</p>
                            <p className="text-sm text-green-800">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => window.open(submission.fileUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = submission.fileUrl;
                        link.download = submission.fileName;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {submissions.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No reports submitted</h3>
            <p>Submit your first project or assignment report to get started.</p>
          </div>
        </Card>
      )}

      {/* Submit Report Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!uploading) {
            setShowModal(false);
            resetForm();
          }
        }}
        title="Submit Report"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Weekly Progress Report - Project Name"
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ 
                ...formData, 
                type: e.target.value as 'project' | 'assignment' | 'general',
                projectId: '',
                assignmentId: ''
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={uploading}
            >
              <option value="project">Project Report</option>
              <option value="assignment">Assignment Report</option>
              <option value="general">General Report</option>
            </select>
          </div>

          {formData.type === 'project' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              >
                <option value="">Select a project (optional)</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'assignment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assignment
              </label>
              <select
                value={formData.assignmentId}
                onChange={(e) => setFormData({ ...formData, assignmentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              >
                <option value="">Select an assignment (optional)</option>
                {assignments.map(assignment => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description of your report content..."
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, DOC, DOCX (Max size: 10MB)
            </p>
            {selectedFile && (
              <div className="mt-2 p-2 bg-blue-50 rounded border">
                <p className="text-sm text-blue-800">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!uploading) {
                  setShowModal(false);
                  resetForm();
                }
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}