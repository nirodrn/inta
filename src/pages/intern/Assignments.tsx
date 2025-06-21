import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update } from 'firebase/database';
import { FileText, Calendar, Download, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function InternAssignments() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState({
    type: 'github' as 'github' | 'drive',
    url: '',
    notes: '',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchAssignments();
    }
  }, [currentUser]);

  const fetchAssignments = async () => {
    try {
      const [assignmentsSnap, submissionsSnap] = await Promise.all([
        get(ref(database, 'assignments')),
        get(ref(database, 'submissions')),
      ]);

      const assignmentsList: Assignment[] = [];
      if (assignmentsSnap.exists()) {
        const assignmentsData = assignmentsSnap.val();
        Object.entries(assignmentsData).forEach(([id, assignment]: [string, any]) => {
          if (assignment.targetAudience === 'all' || 
              (assignment.targetAudience === 'individual' && assignment.targetIds?.includes(currentUser?.uid))) {
            assignmentsList.push({ id, ...assignment });
          }
        });
      }

      let userSubmissions = {};
      if (submissionsSnap.exists()) {
        const submissionsData = submissionsSnap.val();
        ['github', 'drive'].forEach(type => {
          if (submissionsData[type] && submissionsData[type][currentUser?.uid]) {
            userSubmissions = {
              ...userSubmissions,
              [type]: submissionsData[type][currentUser?.uid]
            };
          }
        });
      }

      setAssignments(assignmentsList);
      setSubmissions(userSubmissions);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !currentUser?.uid) return;

    try {
      const submissionRef = ref(database, `submissions/${submissionData.type}/${currentUser.uid}`);
      const existingSubmissions = submissions[submissionData.type] || [];
      
      const newSubmission = {
        assignmentId: selectedAssignment.id,
        url: submissionData.url,
        notes: submissionData.notes,
        submittedAt: new Date().toISOString(),
      };

      await update(submissionRef, [...existingSubmissions, newSubmission]);
      
      toast.success('Assignment submitted successfully!');
      setShowSubmissionModal(false);
      setSubmissionData({ type: 'github', url: '', notes: '' });
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    }
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const githubSubmissions = submissions.github || [];
    const driveSubmissions = submissions.drive || [];
    
    const hasSubmission = [...githubSubmissions, ...driveSubmissions].some(
      (sub: any) => sub.assignmentId === assignment.id
    );

    if (hasSubmission) {
      return { status: 'submitted', color: 'text-green-600', icon: CheckCircle };
    }

    const deadline = new Date(assignment.deadline);
    const now = new Date();
    
    if (deadline < now) {
      return { status: 'overdue', color: 'text-red-600', icon: AlertCircle };
    }
    
    return { status: 'pending', color: 'text-orange-600', icon: Clock };
  };

  const openSubmissionModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionModal(true);
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
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600">View and submit your assignments</p>
        </div>
      </motion.div>

      {/* Assignments List */}
      <div className="grid gap-6">
        {assignments.map((assignment, index) => {
          const submissionStatus = getSubmissionStatus(assignment);
          const StatusIcon = submissionStatus.icon;
          
          return (
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
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
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
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-4 w-4 ${submissionStatus.color}`} />
                          <span className={`font-medium capitalize ${submissionStatus.color}`}>
                            {submissionStatus.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium capitalize">{assignment.targetAudience}</p>
                      </div>
                    </div>

                    {assignment.fileUrl && (
                      <div className="flex items-center space-x-2 text-blue-600 mb-4">
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
                    {submissionStatus.status !== 'submitted' && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => openSubmissionModal(assignment)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {assignments.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No assignments found</h3>
            <p>You don't have any assignments at the moment.</p>
          </div>
        </Card>
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
          setSelectedAssignment(null);
          setSubmissionData({ type: 'github', url: '', notes: '' });
        }}
        title={`Submit: ${selectedAssignment?.title}`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submission Type *
            </label>
            <select
              value={submissionData.type}
              onChange={(e) => setSubmissionData({ ...submissionData, type: e.target.value as 'github' | 'drive' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="github">GitHub Repository</option>
              <option value="drive">Google Drive Link</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {submissionData.type === 'github' ? 'GitHub Repository URL' : 'Google Drive Link'} *
            </label>
            <input
              type="url"
              value={submissionData.url}
              onChange={(e) => setSubmissionData({ ...submissionData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={submissionData.type === 'github' ? 'https://github.com/username/repo' : 'https://drive.google.com/...'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={submissionData.notes}
              onChange={(e) => setSubmissionData({ ...submissionData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any additional notes about your submission..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowSubmissionModal(false);
                setSelectedAssignment(null);
                setSubmissionData({ type: 'github', url: '', notes: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Submit Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}