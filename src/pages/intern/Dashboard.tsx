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
  BookOpen,
  MessageSquare,
  User,
  Award,
  Target,
  Bell
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import NicknameModal from '../../components/NicknameModal';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;
  upcomingMeetings: number;
  groupMembers: number;
  overallProgress: number;
  averageGrade: number;
  totalProjects: number;
  completedProjects: number;
}

interface RecentActivity {
  id: string;
  type: 'assignment' | 'project' | 'meeting' | 'grade';
  title: string;
  description: string;
  date: string;
  status?: string;
  grade?: number;
}

export default function InternDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    overdueAssignments: 0,
    upcomingMeetings: 0,
    groupMembers: 0,
    overallProgress: 0,
    averageGrade: 0,
    totalProjects: 0,
    completedProjects: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

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
      const [
        assignmentsSnap,
        submissionsSnap,
        projectsSnap,
        groupsSnap,
        meetingsSnap,
        gradesSnap,
        supervisorsSnap
      ] = await Promise.all([
        get(ref(database, 'assignments')),
        get(ref(database, 'submissions')),
        get(ref(database, 'projects')),
        get(ref(database, 'groups')),
        get(ref(database, 'meetings')),
        get(ref(database, 'grades')),
        get(ref(database, 'supervisors'))
      ]);

      let totalAssignments = 0;
      let completedAssignments = 0;
      let overdueAssignments = 0;
      let recentAssignmentsList: any[] = [];
      let upcomingDeadlinesList: any[] = [];
      let activities: RecentActivity[] = [];

      // Process assignments
      if (assignmentsSnap.exists()) {
        const assignments = assignmentsSnap.val();
        const now = new Date();
        
        Object.entries(assignments).forEach(([id, assignment]: [string, any]) => {
          if (assignment.targetAudience === 'all' || 
              (assignment.targetAudience === 'individual' && assignment.targetIds?.includes(currentUser?.uid))) {
            totalAssignments++;
            
            const deadline = new Date(assignment.deadline);
            const isOverdue = deadline < now;
            
            if (isOverdue) {
              overdueAssignments++;
            }

            recentAssignmentsList.push({ id, ...assignment });
            
            // Add to upcoming deadlines if within next 7 days
            const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline >= 0 && daysUntilDeadline <= 7) {
              upcomingDeadlinesList.push({
                id,
                title: assignment.title,
                deadline: assignment.deadline,
                type: 'assignment',
                daysLeft: daysUntilDeadline
              });
            }

            // Add to recent activities
            activities.push({
              id: `assignment-${id}`,
              type: 'assignment',
              title: assignment.title,
              description: `Assignment deadline: ${deadline.toLocaleDateString()}`,
              date: assignment.createdAt,
              status: isOverdue ? 'overdue' : 'pending'
            });
          }
        });
      }

      // Process submissions to count completed assignments
      if (submissionsSnap.exists()) {
        const submissions = submissionsSnap.val();
        ['github', 'drive'].forEach(type => {
          if (submissions[type] && submissions[type][currentUser?.uid]) {
            const userSubmissions = submissions[type][currentUser?.uid];
            if (Array.isArray(userSubmissions)) {
              completedAssignments += userSubmissions.length;
              
              // Add recent submissions to activities
              userSubmissions.forEach((submission: any) => {
                activities.push({
                  id: `submission-${submission.assignmentId}-${type}`,
                  type: 'assignment',
                  title: 'Assignment Submitted',
                  description: `Submitted via ${type}`,
                  date: submission.submittedAt,
                  status: 'completed'
                });
              });
            }
          }
        });
      }

      // Process projects
      let totalProjects = 0;
      let completedProjects = 0;
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
            totalProjects++;
            if (project.status === 'completed') {
              completedProjects++;
            }

            // Add to activities
            activities.push({
              id: `project-${id}`,
              type: 'project',
              title: project.title,
              description: `Project status: ${project.status}`,
              date: project.createdAt,
              status: project.status
            });

            // Add to upcoming deadlines
            const deadline = new Date(project.deadline);
            const now = new Date();
            const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDeadline >= 0 && daysUntilDeadline <= 7 && project.status !== 'completed') {
              upcomingDeadlinesList.push({
                id,
                title: project.title,
                deadline: project.deadline,
                type: 'project',
                daysLeft: daysUntilDeadline
              });
            }
          }
        });
      }

      // Find user's group info
      let groupMembers = 0;
      let userGroupInfo = null;
      if (groupsSnap.exists()) {
        const groups = groupsSnap.val();
        Object.entries(groups).forEach(([id, group]: [string, any]) => {
          if (group.internIds?.includes(currentUser?.uid)) {
            groupMembers = group.internIds.length;
            userGroupInfo = { id, ...group };
          }
        });
      }

      // Process meetings
      let upcomingMeetingsCount = 0;
      if (meetingsSnap.exists()) {
        const meetings = meetingsSnap.val();
        const now = new Date();
        Object.entries(meetings).forEach(([id, meeting]: [string, any]) => {
          const meetingDate = new Date(meeting.date);
          if (meetingDate > now && meeting.attendees?.includes(currentUser?.uid)) {
            upcomingMeetingsCount++;
            
            // Add to activities
            activities.push({
              id: `meeting-${id}`,
              type: 'meeting',
              title: meeting.title,
              description: `Meeting on ${meetingDate.toLocaleDateString()}`,
              date: meeting.date,
              status: 'scheduled'
            });
          }
        });
      }

      // Process grades for average calculation
      let averageGrade = 0;
      if (gradesSnap.exists()) {
        const grades = gradesSnap.val();
        const internGrades = Object.values(grades).filter((grade: any) => grade.internId === currentUser?.uid);
        
        if (internGrades.length > 0) {
          const totalGradePoints = internGrades.reduce((sum: number, grade: any) => {
            return sum + ((grade.grade / grade.maxGrade) * 100);
          }, 0);
          averageGrade = Math.round(totalGradePoints / internGrades.length);

          // Add recent grades to activities
          internGrades.forEach((grade: any) => {
            activities.push({
              id: `grade-${grade.id}`,
              type: 'grade',
              title: 'Grade Received',
              description: grade.feedback || 'Grade updated',
              date: grade.createdAt,
              grade: Math.round((grade.grade / grade.maxGrade) * 100)
            });
          });
        }
      }

      const overallProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

      setStats({
        totalAssignments,
        completedAssignments,
        pendingAssignments: totalAssignments - completedAssignments,
        overdueAssignments,
        upcomingMeetings: upcomingMeetingsCount,
        groupMembers,
        overallProgress,
        averageGrade,
        totalProjects,
        completedProjects,
      });

      // Sort activities by date (most recent first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 5));

      // Sort upcoming deadlines by days left
      upcomingDeadlinesList.sort((a, b) => a.daysLeft - b.daysLeft);
      setUpcomingDeadlines(upcomingDeadlinesList.slice(0, 3));

      setGroupInfo(userGroupInfo);

      // Create notifications for overdue items and upcoming deadlines
      const newNotifications = [];
      if (overdueAssignments > 0) {
        newNotifications.push({
          id: 'overdue',
          type: 'warning',
          message: `You have ${overdueAssignments} overdue assignment${overdueAssignments > 1 ? 's' : ''}`
        });
      }
      
      upcomingDeadlinesList.forEach(item => {
        if (item.daysLeft <= 2) {
          newNotifications.push({
            id: `deadline-${item.id}`,
            type: 'urgent',
            message: `${item.title} is due in ${item.daysLeft} day${item.daysLeft !== 1 ? 's' : ''}`
          });
        }
      });

      setNotifications(newNotifications);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return FileText;
      case 'project':
        return BookOpen;
      case 'meeting':
        return Calendar;
      case 'grade':
        return Award;
      default:
        return FileText;
    }
  };

  const getActivityColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const statCards = [
    {
      title: 'Total Assignments',
      value: stats.totalAssignments,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => navigate('/intern/assignments')
    },
    {
      title: 'Completed',
      value: stats.completedAssignments,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/intern/assignments')
    },
    {
      title: 'Pending',
      value: stats.pendingAssignments,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => navigate('/intern/assignments')
    },
    {
      title: 'Progress',
      value: `${stats.overallProgress}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => navigate('/intern/progress')
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {currentUser?.name}! 👋
          </h1>
          <p className="text-gray-600">Here's your internship overview</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-orange-600">{notifications.length} notification{notifications.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border-l-4 ${
                notification.type === 'urgent' 
                  ? 'bg-red-50 border-red-500 text-red-800' 
                  : 'bg-orange-50 border-orange-500 text-orange-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={card.onClick}>
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

      {/* Performance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4">
                <CircularProgressbar
                  value={stats.overallProgress}
                  text={`${stats.overallProgress}%`}
                  styles={buildStyles({
                    textColor: '#1f2937',
                    pathColor: '#3b82f6',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <h4 className="font-semibold text-gray-900">Assignment Progress</h4>
              <p className="text-sm text-gray-600">{stats.completedAssignments} of {stats.totalAssignments} completed</p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4">
                <CircularProgressbar
                  value={stats.averageGrade}
                  text={stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'N/A'}
                  styles={buildStyles({
                    textColor: '#1f2937',
                    pathColor: '#10b981',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <h4 className="font-semibold text-gray-900">Average Grade</h4>
              <p className="text-sm text-gray-600">
                {stats.averageGrade > 0 ? 'Based on graded work' : 'No grades yet'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4">
                <CircularProgressbar
                  value={stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0}
                  text={stats.totalProjects > 0 ? `${stats.completedProjects}/${stats.totalProjects}` : '0'}
                  styles={buildStyles({
                    textColor: '#1f2937',
                    pathColor: '#f59e0b',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <h4 className="font-semibold text-gray-900">Project Progress</h4>
              <p className="text-sm text-gray-600">Projects completed</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Activities & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Button variant="secondary" size="sm" onClick={() => navigate('/intern/progress')}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                      </div>
                      {activity.grade && (
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">{activity.grade}%</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
              <Button variant="secondary" size="sm" onClick={() => navigate('/intern/assignments')}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline, index) => (
                  <div key={deadline.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      deadline.daysLeft === 0 ? 'bg-red-100 text-red-600' :
                      deadline.daysLeft <= 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {deadline.type === 'assignment' ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{deadline.title}</p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(deadline.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        deadline.daysLeft === 0 ? 'text-red-600' :
                        deadline.daysLeft <= 2 ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {deadline.daysLeft === 0 ? 'Due Today' : 
                         deadline.daysLeft === 1 ? '1 day left' : 
                         `${deadline.daysLeft} days left`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="secondary" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/intern/assignments')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>View Assignments</span>
            </Button>
            <Button 
              variant="secondary" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/intern/group')}
            >
              <Users className="h-6 w-6 mb-2" />
              <span>My Group</span>
              {groupInfo && (
                <span className="text-xs text-gray-500 mt-1">
                  {stats.groupMembers} members
                </span>
              )}
            </Button>
            <Button 
              variant="secondary" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/intern/progress')}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>View Progress</span>
            </Button>
            <Button 
              variant="secondary" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/intern/documents')}
            >
              <BookOpen className="h-6 w-6 mb-2" />
              <span>Documents</span>
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Group Info */}
      {groupInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {groupInfo.name}
                </h3>
                <p className="text-blue-700">
                  You're part of a group with {stats.groupMembers} members
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate('/intern/group')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Group
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate('/intern/group-chat')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Group Chat
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Nickname Modal */}
      <NicknameModal
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
      />
    </div>
  );
}