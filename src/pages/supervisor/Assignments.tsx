import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update } from 'firebase/database';
import { FileText, Search, Download, Eye, CheckCircle, Clock, Star } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

interface SubmissionWithIntern {
  id: string;
  internId: string;
  internName: string;
  assignmentId: string;
  assignmentTitle: string;
  url: string;
  type: 'github' | 'drive';
  submittedAt: string;
  notes?: string;
  grade?: number;
  feedback?: string;
  reviewed?: boolean;
}

export default function SupervisorAssignments() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithIntern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithIntern | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    grade: '',
    feedback: '',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [assignmentsSnap, submissionsSnap, groupsSnap, internsSnap] = await Promise.all([
        get(ref(database, 'assignments')),
        get(ref(database, 'submissions')),
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
      ]);

      // Get assignments
      let assignmentsList: Assignment[] = [];
      if (assignmentsSnap.exists()) {
        const assignmentsData = assignmentsSnap.val();
        assignmentsList = Object.entries(assignmentsData).map(([id, assignment]: [string, any]) => ({
          id,
          ...assignment,
        }));
      }

      // Get supervisor's interns
      let supervisorInternIds: string[] = [];
      if (groupsSnap.exists()) {
        const groups = groupsSnap.val();
        Object.values(groups).forEach((group: any) => {
          if (group.supervisorId === currentUser?.uid) {
            supervisorInternIds.push(...(group.internIds || []));
          }
        });
      }

      // Get submissions from supervisor's interns
      let submissionsList: SubmissionWithIntern[] = [];
      if (submissionsSnap.exists() && internsSnap.exists()) {
        const submissionsData = submissionsSnap.val();
        const internsData = internsSnap.val();

        ['github', 'drive'].forEach(type => {
          if (submissionsData[type]) {
            Object.entries(submissionsData[type]).forEach(([internId, userSubmissions]: [string, any]) => {
              if (supervisorInternIds.includes(internId) && Array.isArray(userSubmissions)) {
                userSubmissions.forEach((submission, index) => {
                  const assignment = assignmentsList.find(a => a.id === submission.assignmentId);
                  const intern = internsData[internId];
                  
                  if (assignment && intern) {
                    submissionsList.push({
                      id: `${type}-${internId}-${index}`,
                      internId,
                      internName: intern.name,
                      assignmentId: submission.assignmentId,
                      assignmentTitle: assignment.title,
                      url: submission.url,
                      type: type as 'github' | 'drive',
                      submittedAt: submission.submittedAt,
                      notes: submission.notes,
                      grade: submission.grade,
                      feedback: submission.feedback,
                      reviewed: submission.reviewed || false,
                    });
                  }
                });
              }
            });
          }
        });
      }

      setAssignments(assignmentsList);
      setSubmissions(submissionsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = (submission: SubmissionWithIntern) => {
    setSelectedSubmission(submission);
    setReviewData({
      grade: submission.grade?.toString() || '',
      feedback: submission.feedback || '',
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      const [type, internId, index] = selectedSubmission.id.split('-');
      const submissionPath = `submissions/${type}/${internId}/${index}`;
      
      await update(ref(database, submissionPath), {
        grade: parseFloat(reviewData.grade),
        feedback: reviewData.feedback,
        reviewed: true,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser?.uid,
      });

      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewData({ grade: '', feedback: '' });
      fetchData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const filteredSubmissions = submissions.filter(submission =>
    submission.internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingSubmissions = filteredSubmissions.filter(s => !s.reviewed);
  const reviewedSubmissions = filteredSubmissions.filter(s => s.reviewed);

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
          <h1 className="text-3xl font-bold text-gray-900">Assignment Reviews</h1>
          <p className="text-gray-600">Review and grade intern submissions</p>
        </div>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by intern name or assignment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Pending Reviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pending Reviews ({pendingSubmissions.length})
        </h2>
        <div className="grid gap-4">
          {pendingSubmissions.map((submission, index) => (
            <Card key={submission.id} className="p-6 border-l-4 border-orange-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{submission.assignmentTitle}</h3>
                      <p className="text-sm text-gray-600">Submitted by {submission.internName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Submission Type</p>
                      <p className="font-medium capitalize">{submission.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="font-medium">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-600">Pending Review</span>
                      </div>
                    </div>
                  </div>

                  {submission.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700">{submission.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleReviewSubmission(submission)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {pendingSubmissions.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending submissions to review.</p>
          </Card>
        )}
      </motion.div>

      {/* Reviewed Submissions */}
      {reviewedSubmissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recently Reviewed ({reviewedSubmissions.length})
          </h2>
          <div className="grid gap-4">
            {reviewedSubmissions.slice(0, 5).map((submission, index) => (
              <Card key={submission.id} className="p-6 border-l-4 border-green-500 opacity-75">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{submission.assignmentTitle}</h3>
                        <p className="text-sm text-gray-600">Submitted by {submission.internName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Grade</p>
                        <p className="font-medium text-lg">{submission.grade}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="font-medium">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">Reviewed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="secondary" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Review
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedSubmission(null);
          setReviewData({ grade: '', feedback: '' });
        }}
        title={`Review: ${selectedSubmission?.assignmentTitle}`}
        size="lg"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Submission Details</h4>
            <p className="text-sm text-gray-600">Student: {selectedSubmission?.internName}</p>
            <p className="text-sm text-gray-600">Type: {selectedSubmission?.type}</p>
            <p className="text-sm text-gray-600">
              Submitted: {selectedSubmission?.submittedAt && new Date(selectedSubmission.submittedAt).toLocaleDateString()}
            </p>
            {selectedSubmission?.url && (
              <a
                href={selectedSubmission.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View Submission →
              </a>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade (0-100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={reviewData.grade}
              onChange={(e) => setReviewData({ ...reviewData, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback *
            </label>
            <textarea
              value={reviewData.feedback}
              onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Provide detailed feedback on the submission..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowReviewModal(false);
                setSelectedSubmission(null);
                setReviewData({ grade: '', feedback: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}