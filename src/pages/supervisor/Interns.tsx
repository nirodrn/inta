import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push } from 'firebase/database';
import { Users, Search, GraduationCap, Mail, Phone, MessageSquare, TrendingUp } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Intern } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function SupervisorInterns() {
  const { currentUser } = useAuth();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: '',
    category: 'general' as 'assignment' | 'general' | 'improvement',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchMyInterns();
    }
  }, [currentUser]);

  const fetchMyInterns = async () => {
    try {
      const [groupsSnap, internsSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
      ]);

      let supervisorInterns: Intern[] = [];

      // Find groups supervised by current user
      if (groupsSnap.exists() && internsSnap.exists()) {
        const groups = groupsSnap.val();
        const internsData = internsSnap.val();

        Object.values(groups).forEach((group: any) => {
          if (group.supervisorId === currentUser?.uid) {
            group.internIds?.forEach((internId: string) => {
              const internData = internsData[internId];
              if (internData) {
                supervisorInterns.push({
                  uid: internId,
                  ...internData,
                  groupName: group.name
                });
              }
            });
          }
        });
      }

      setInterns(supervisorInterns);
    } catch (error) {
      console.error('Error fetching interns:', error);
      toast.error('Failed to fetch interns');
    } finally {
      setLoading(false);
    }
  };

  const handleGiveFeedback = (intern: Intern) => {
    setSelectedIntern(intern);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;

    try {
      const feedback = {
        internId: selectedIntern.uid,
        supervisorId: currentUser?.uid,
        supervisorName: currentUser?.name,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        category: feedbackData.category,
        createdAt: new Date().toISOString(),
      };

      await push(ref(database, 'feedback'), feedback);
      
      toast.success('Feedback submitted successfully!');
      setShowFeedbackModal(false);
      setFeedbackData({ rating: 5, comment: '', category: 'general' });
      setSelectedIntern(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const filteredInterns = interns.filter(intern =>
    intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.university.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">My Interns</h1>
          <p className="text-gray-600">Manage and mentor your assigned interns</p>
        </div>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Interns List */}
      <div className="grid gap-6">
        {filteredInterns.map((intern, index) => (
          <motion.div
            key={intern.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{intern.name}</h3>
                      {intern.nickname && (
                        <p className="text-sm text-gray-600">"{intern.nickname}"</p>
                      )}
                      <p className="text-sm text-gray-600">{(intern as any).groupName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-sm">{intern.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{intern.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">University</p>
                      <p className="font-medium">{intern.university}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">GPA</p>
                      <p className="font-medium">{intern.gpa}</p>
                    </div>
                  </div>

                  {intern.skills && intern.skills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {intern.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {intern.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{intern.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="secondary" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleGiveFeedback(intern)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Give Feedback
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredInterns.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No interns found</h3>
            <p>You don't have any interns assigned to you yet.</p>
          </div>
        </Card>
      )}

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedIntern(null);
          setFeedbackData({ rating: 5, comment: '', category: 'general' });
        }}
        title={`Give Feedback to ${selectedIntern?.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={feedbackData.category}
              onChange={(e) => setFeedbackData({ ...feedbackData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="general">General Performance</option>
              <option value="assignment">Assignment Feedback</option>
              <option value="improvement">Areas for Improvement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <select
              value={feedbackData.rating}
              onChange={(e) => setFeedbackData({ ...feedbackData, rating: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Below Average</option>
              <option value={1}>1 - Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments *
            </label>
            <textarea
              value={feedbackData.comment}
              onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Provide detailed feedback..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowFeedbackModal(false);
                setSelectedIntern(null);
                setFeedbackData({ rating: 5, comment: '', category: 'general' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Submit Feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}