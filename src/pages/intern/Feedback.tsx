import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { MessageSquare, Star, Calendar, User, TrendingUp, AlertCircle } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';

interface FeedbackItem {
  id: string;
  assignmentId?: string;
  assignmentTitle?: string;
  supervisorName: string;
  rating: number;
  comment: string;
  category: 'assignment' | 'general' | 'improvement';
  createdAt: string;
}

export default function InternFeedback() {
  const { currentUser } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchFeedback();
    }
  }, [currentUser]);

  const fetchFeedback = async () => {
    try {
      const [feedbackSnap, gradesSnap, supervisorsSnap] = await Promise.all([
        get(ref(database, 'feedback')),
        get(ref(database, 'grades')),
        get(ref(database, 'supervisors')),
      ]);

      const feedbackList: FeedbackItem[] = [];

      // Get feedback from feedback collection
      if (feedbackSnap.exists()) {
        const feedbackData = feedbackSnap.val();
        Object.entries(feedbackData).forEach(([id, feedback]: [string, any]) => {
          if (feedback.internId === currentUser?.uid) {
            feedbackList.push({
              id,
              supervisorName: feedback.supervisorName || 'Unknown Supervisor',
              rating: feedback.rating || 3,
              comment: feedback.comment || '',
              category: feedback.category || 'general',
              createdAt: feedback.createdAt,
            });
          }
        });
      }

      // Get feedback from grades collection
      if (gradesSnap.exists() && supervisorsSnap.exists()) {
        const gradesData = gradesSnap.val();
        const supervisorsData = supervisorsSnap.val();
        
        Object.entries(gradesData).forEach(([id, grade]: [string, any]) => {
          if (grade.internId === currentUser?.uid && grade.feedback) {
            const supervisor = supervisorsData[grade.supervisorId];
            const rating = Math.min(5, Math.max(1, Math.round((grade.grade / grade.maxGrade) * 5)));
            
            feedbackList.push({
              id: `grade-${id}`,
              assignmentTitle: grade.assignmentTitle,
              supervisorName: supervisor?.name || grade.supervisorName || 'Unknown Supervisor',
              rating,
              comment: grade.feedback,
              category: 'assignment',
              createdAt: grade.createdAt,
            });
          }
        });
      }

      // Sort by creation date (newest first)
      feedbackList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setFeedback(feedbackList);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = selectedCategory === 'all' 
    ? feedback 
    : feedback.filter(item => item.category === selectedCategory);

  const totalFeedback = feedback.length;
  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1)
    : '0.0';
  const positiveReviews = feedback.filter(item => item.rating >= 4).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assignment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'general':
        return <Star className="h-5 w-5 text-green-500" />;
      case 'improvement':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800';
      case 'general':
        return 'bg-green-100 text-green-800';
      case 'improvement':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
          <h1 className="text-3xl font-bold text-gray-900">Feedback & Reviews</h1>
          <p className="text-gray-600">View feedback from supervisors and track your progress</p>
        </div>
      </motion.div>

      {/* Feedback Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalFeedback}</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <span className="text-3xl font-bold text-yellow-600">{averageRating}</span>
              <Star className="h-6 w-6 text-yellow-400 fill-current" />
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{positiveReviews}</div>
            <div className="text-sm text-gray-600">Positive Reviews</div>
          </Card>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'assignment', 'general', 'improvement'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                {category !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({feedback.filter(f => f.category === category).length})
                  </span>
                )}
                {category === 'all' && (
                  <span className="ml-1 text-xs">({totalFeedback})</span>
                )}
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.map((feedbackItem, index) => (
          <motion.div
            key={feedbackItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(feedbackItem.category)}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {feedbackItem.assignmentTitle || 'General Feedback'}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{feedbackItem.supervisorName}</span>
                      <Calendar className="h-4 w-4 ml-2" />
                      <span>{new Date(feedbackItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(feedbackItem.category)}`}>
                    {feedbackItem.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-3">
                {renderStars(feedbackItem.rating)}
                <span className="ml-2 text-sm text-gray-600">({feedbackItem.rating}/5)</span>
              </div>

              <p className="text-gray-700 leading-relaxed">{feedbackItem.comment}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No feedback found</h3>
            <p>
              {selectedCategory === 'all' 
                ? "You don't have any feedback yet. Complete assignments to receive feedback from supervisors." 
                : `No ${selectedCategory} feedback available.`}
            </p>
          </div>
        </Card>
      )}

      {/* Improvement Suggestions */}
      {feedback.filter(f => f.category === 'improvement').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-orange-50 border-orange-200">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Areas for Improvement</h3>
            </div>
            <div className="space-y-2">
              {feedback
                .filter(f => f.category === 'improvement')
                .slice(0, 3)
                .map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <p className="text-orange-800 text-sm">{item.comment}</p>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}