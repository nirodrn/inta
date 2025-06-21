import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import NicknameModal from '../../components/NicknameModal';

interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  upcomingMeetings: number;
  groupMembers: number;
  overallProgress: number;
}

export default function InternDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    upcomingMeetings: 0,
    groupMembers: 0,
    overallProgress: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
      checkNickname();
    }
  }, [currentUser]);

  const checkNickname = async () => {
    if (!currentUser?.uid) return;

    try {
      const internRef = ref(database, `acceptedInterns/${currentUser.uid}`);
      const snapshot = await get(internRef);
      
      if (snapshot.exists()) {
        const internData = snapshot.val();
        if (!internData.nickname || internData.nickname.trim() === '') {
          setShowNicknameModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking nickname:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [assignmentsSnap, tasksSnap, groupsSnap, meetingsSnap] = await Promise.all([
        get(ref(database, 'assignments')),
        get(ref(database, `tasks/${currentUser?.uid}`)),
        get(ref(database, 'groups')),
        get(ref(database, 'meetings')),
      ]);

      let totalAssignments = 0;
      let completedAssignments = 0;
      let recentAssignmentsList: any[] = [];

      // Process assignments
      if (assignmentsSnap.exists()) {
        const assignments = assignmentsSnap.val();
        Object.entries(assignments).forEach(([id, assignment]: [string, any]) => {
          if (assignment.targetAudience === 'all' || 
              (assignment.targetAudience === 'individual' && assignment.targetIds?.includes(currentUser?.uid))) {
            totalAssignments++;
            recentAssignmentsList.push({ id, ...assignment });
          }
        });
      }

      // Process tasks
      if (tasksSnap.exists()) {
        const tasks = tasksSnap.val();
        Object.values(tasks).forEach((task: any) => {
          if (task.status === 'completed') {
            completedAssignments++;
          }
        });
      }

      // Find user's group
      let groupMembers = 0;
      if (groupsSnap.exists()) {
        const groups = groupsSnap.val();
        Object.values(groups).forEach((group: any) => {
          if (group.internIds?.includes(currentUser?.uid)) {
            groupMembers = group.internIds.length;
          }
        });
      }

      // Process meetings
      let upcomingMeetingsCount = 0;
      let upcomingMeetingsList: any[] = [];
      if (meetingsSnap.exists()) {
        const meetings = meetingsSnap.val();
        const now = new Date();
        Object.entries(meetings).forEach(([id, meeting]: [string, any]) => {
          const meetingDate = new Date(meeting.date);
          if (meetingDate > now && meeting.attendees?.includes(currentUser?.uid)) {
            upcomingMeetingsCount++;
            upcomingMeetingsList.push({ id, ...meeting });
          }
        });
      }

      const overallProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

      setStats({
        totalAssignments,
        completedAssignments,
        pendingAssignments: totalAssignments - completedAssignments,
        upcomingMeetings: upcomingMeetingsCount,
        groupMembers,
        overallProgress,
      });

      setRecentAssignments(recentAssignmentsList.slice(0, 3));
      setUpcomingMeetings(upcomingMeetingsList.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Assignments',
      value: stats.totalAssignments,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: stats.completedAssignments,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending',
      value: stats.pendingAssignments,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Progress',
      value: `${stats.overallProgress}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {currentUser?.name}!</h1>
          <p className="text-gray-600">Here's your internship overview</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Assignments & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Assignments</h3>
              <Button variant="secondary" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment, index) => (
                  <div key={assignment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-600">Due: {new Date(assignment.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent assignments</p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
              <Button variant="secondary" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting, index) => (
                  <div key={meeting.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{meeting.title}</p>
                      <p className="text-sm text-gray-600">{new Date(meeting.date).toLocaleDateString()} at {meeting.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming meetings</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <FileText className="h-6 w-6 mb-2" />
              <span>View Assignments</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <Users className="h-6 w-6 mb-2" />
              <span>My Group</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>View Progress</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <BookOpen className="h-6 w-6 mb-2" />
              <span>Resources</span>
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Nickname Modal */}
      <NicknameModal
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
      />
    </div>
  );
}