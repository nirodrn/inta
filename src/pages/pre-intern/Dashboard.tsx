import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Video, User, CheckCircle, AlertCircle } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

interface InterviewDetails {
  date: string;
  time: string;
  mode: 'online' | 'in-person';
  interviewer: string;
  link?: string;
  location?: string;
  notes?: string;
  status: string;
}

export default function PreInternDashboard() {
  const { currentUser } = useAuth();
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchInterviewDetails();
    }
  }, [currentUser]);

  const fetchInterviewDetails = async () => {
    try {
      const interviewsRef = ref(database, 'interviews');
      const snapshot = await get(interviewsRef);
      
      if (snapshot.exists()) {
        const interviews = snapshot.val();
        const userInterview = Object.values(interviews).find(
          (interview: any) => interview.candidateId === currentUser?.uid
        );
        
        if (userInterview) {
          setInterview(userInterview as InterviewDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {currentUser?.name}!</h1>
          <p className="text-gray-600">Your pre-interview dashboard</p>
        </div>
      </motion.div>

      {/* Profile Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">Profile Status</h2>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">Application Submitted</span>
              </div>
              <p className="text-gray-600 mt-1">Your application has been received and is under review.</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Interview Details */}
      {interview ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-900">SCHEDULED</h3>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {interview.status.toUpperCase()}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(interview.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Platform</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {interview.mode === 'online' ? 'Online Interview' : 'In-Person Interview'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="text-lg font-semibold text-gray-900">{interview.time}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Interviewer</p>
                  <p className="text-lg font-semibold text-gray-900">{interview.interviewer}</p>
                </div>
              </div>

              <div className="space-y-4">
                {interview.mode === 'online' && interview.link && (
                  <div>
                    <Button className="w-full" size="lg">
                      <Video className="h-5 w-5 mr-2" />
                      Join Meeting
                    </Button>
                  </div>
                )}

                {interview.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">Additional Notes</h4>
                    <div className="text-sm text-amber-700 space-y-1">
                      {interview.notes.split('\n').map((note, index) => (
                        <p key={index}>• {note}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Interview Scheduled</h3>
            <p className="text-gray-600">
              Your interview has not been scheduled yet. You will be notified once it's scheduled.
            </p>
          </Card>
        </motion.div>
      )}

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-700">Wait for interview scheduling notification</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-700">Prepare your portfolio and recent projects</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-700">Keep an eye on your email for updates</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}