import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update } from 'firebase/database';
import { FileText, Search, Download, Eye, Star, MessageSquare, Calendar, User } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentSubmission } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function DocumentReview() {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [grading, setGrading] = useState(false);

  const [gradeData, setGradeData] = useState({
    grade: '',
    feedback: '',
    status: 'graded' as 'graded' | 'needs_revision',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchSubmissions();
    }
  }, [currentUser]);

  const fetchSubmissions = async () => {
    try {
      const snapshot = await get(ref(database, 'documentSubmissions'));
      
      if (snapshot.exists()) {
        const submissionsData = snapshot.val();
        const supervisorSubmissions = Object.entries(submissionsData)
          .map(([id, submission]: [string, any]) => ({ id, ...submission }))
          .filter((submission: DocumentSubmission) => submission.supervisorId === currentUser?.uid)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        
        setSubmissions(supervisorSubmissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission: DocumentSubmission) => {
    setSelectedSubmission(submission);
    setGradeData({
      grade: submission.grade?.toString() || '',
      feedback: submission.feedback || '',
      status: submission.status === 'needs_revision' ? 'needs_revision' : 'graded',
    });
    setShowGradeModal(true);
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission || grading) return;
    
    if (!gradeData.grade || parseFloat(gradeData.grade) < 0 || parseFloat(gradeData.grade) > 100) {
      toast.error('Grade must be between 0 and 100');
      return;
    }

    if (!gradeData.feedback.trim()) {
      toast.error('Feedback is required');
      return;
    }

    setGrading(true);

    try {
      const updateData = {
        grade: parseFloat(gradeData.grade),
        feedback: gradeData.feedback.trim(),
        status: gradeData.status,
        gradedAt: new Date().toISOString(),
        gradedBy: currentUser?.uid,
      };

      await update(ref(database, `documentSubmissions/${selectedSubmission.id}`), updateData);
      
      toast.success('Grade submitted successfully!');
      setShowGradeModal(false);
      setSelectedSubmission(null);
      setGradeData({ grade: '', feedback: '', status: 'graded' });
      fetchSubmissions();
    } catch (error) {
      console.error('Error submitting grade:', error);
      toast.error('Failed to submit grade');
    } finally {
      setGrading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const filteredSubmissions = submissions.filter(submission =>
    submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingSubmissions = filteredSubmissions.filter(s => s.status === 'submitted');
  const gradedSubmissions = filteredSubmissions.filter(s => s.status !== 'submitted');

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
          <h1 className="text-3xl font-bold text-gray-900">Document Review</h1>
          <p className="text-gray-600">Review and grade intern report submissions</p>
        </div>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, intern name, or description..."
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
                      <h3 className="text-lg font-semibold text-gray-900">{submission.title}</h3>
                      <p className="text-sm text-gray-600">Submitted by {submission.internName}</p>
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
                      <p className="text-xs text-gray-500">File</p>
                      <p className="font-medium text-sm">{submission.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(submission.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="font-medium">
                        {submission.fileType.includes('pdf') ? 'PDF' : 'Word Document'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                        Pending Review
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{submission.description}</p>
                  </div>
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
                    variant="primary" 
                    size="sm"
                    onClick={() => handleGradeSubmission(submission)}
                    disabled={grading}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Grade
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {pendingSubmissions.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending document submissions to review.</p>
          </Card>
        )}
      </motion.div>

      {/* Graded Submissions */}
      {gradedSubmissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recently Graded ({gradedSubmissions.length})
          </h2>
          <div className="grid gap-4">
            {gradedSubmissions.slice(0, 5).map((submission, index) => (
              <Card key={submission.id} className="p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{submission.title}</h3>
                        <p className="text-sm text-gray-600">Submitted by {submission.internName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Grade</p>
                        <p className="text-lg font-bold text-green-600">{submission.grade}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Graded</p>
                        <p className="font-medium">
                          {submission.gradedAt && new Date(submission.gradedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status === 'graded' ? 'Graded' : 'Needs Revision'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">File</p>
                        <p className="font-medium text-sm">{submission.fileName}</p>
                      </div>
                    </div>

                    {submission.feedback && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Feedback</p>
                        <p className="text-sm text-gray-700">{submission.feedback}</p>
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
                      onClick={() => handleGradeSubmission(submission)}
                      disabled={grading}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Edit Grade
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grade Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => {
          if (!grading) {
            setShowGradeModal(false);
            setSelectedSubmission(null);
            setGradeData({ grade: '', feedback: '', status: 'graded' });
          }
        }}
        title={`Grade: ${selectedSubmission?.title}`}
        size="lg"
      >
        <form onSubmit={handleSubmitGrade} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Submission Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Student: <span className="font-medium">{selectedSubmission?.internName}</span></p>
                <p className="text-gray-600">File: <span className="font-medium">{selectedSubmission?.fileName}</span></p>
              </div>
              <div>
                <p className="text-gray-600">Submitted: <span className="font-medium">
                  {selectedSubmission?.submittedAt && new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                </span></p>
                <p className="text-gray-600">Size: <span className="font-medium">
                  {selectedSubmission?.fileSize && formatFileSize(selectedSubmission.fileSize)}
                </span></p>
              </div>
            </div>
            {selectedSubmission?.fileUrl && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(selectedSubmission.fileUrl, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Document
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={gradeData.grade}
                onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter grade"
                required
                disabled={grading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={gradeData.status}
                onChange={(e) => setGradeData({ ...gradeData, status: e.target.value as 'graded' | 'needs_revision' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={grading}
              >
                <option value="graded">Graded (Approved)</option>
                <option value="needs_revision">Needs Revision</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback *
            </label>
            <textarea
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Provide detailed feedback on the submission..."
              required
              disabled={grading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!grading) {
                  setShowGradeModal(false);
                  setSelectedSubmission(null);
                  setGradeData({ grade: '', feedback: '', status: 'graded' });
                }
              }}
              disabled={grading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={grading}>
              {grading ? 'Submitting...' : 'Submit Grade'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}