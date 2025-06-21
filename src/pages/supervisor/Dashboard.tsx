import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Award
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalInterns: number;
  activeAssignments: number;
  completedTasks: number;
  pendingReviews: number;
  averageProgress: number;
}

export default function SupervisorDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInterns: 0,
    activeAssignments: 0,
    completedTasks: 0,
    pendingReviews: 0,
    averageProgress: 0,
  });
  const [myInterns, setMyInterns] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      const [groupsSnap, internsSnap, assignmentsSnap, submissionsSnap, gradesSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'assignments')),
        get(ref(database, 'submissions')),
        get(ref(database, 'grades')),
      ]);

      let supervisorInterns: any[] = [];
      let totalInterns = 0;

      // Find groups supervised by current user
      if (groupsSnap.exists()) {
        const groups = groupsSnap.val();
        Object.values(groups).forEach((group: any) => {
          if (group.supervisorId === currentUser?.uid) {
            totalInterns += group.internIds?.length || 0;
            
            // Get intern details
            if (internsSnap.exists()) {
              const internsData = internsSnap.val();
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
          }
        });
      }

      // Count assignments and submissions
      let activeAssignments = 0;
      let completedTasks = 0;
      let pendingReviews = 0;

      if (assignmentsSnap.exists()) {
        const assignments = assignmentsSnap.val();
        activeAssignments = Object.keys(assignments).length;
      }

      if (submissionsSnap.exists()) {
        const submissions = submissionsSnap.val();
        ['github', 'drive'].forEach(type => {
          if (submissions[type]) {
            Object.entries(submissions[type]).forEach(([internId, userSubmissions]: [string, any]) => {
              if (supervisorInterns.some(intern => intern.uid === internId) && Array.isArray(userSubmissions)) {
                completedTasks += userSubmissions.length;
                pendingReviews += userSubmissions.filter((sub: any) => !sub.reviewed).length;
              }
            });
          }
        });
      }

      // Calculate progress data from actual submissions
      const weeklyProgressData: any[] = [];
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      
      weeks.forEach((week, index) => {
        const weekProgress = Math.min(completedTasks * (index + 1) / 4, completedTasks);
        weeklyProgressData.push({
          name: week,
          progress: Math.round(weekProgress)
        });
      });

      // Get recent activity from grades and submissions
      const recentActivityList: any[] = [];
      
      if (gradesSnap.exists()) {
        const grades = gradesSnap.val();
        Object.values(grades).forEach((grade: any) => {
          if (grade.supervisorId === currentUser?.uid) {
            const intern = supervisorInterns.find(i => i.uid === grade.internId);
            if (intern) {
              recentActivityList.push({
                type: 'grade',
                intern: intern.name,
                action: `received grade for ${grade.assignmentTitle || 'assignment'}`,
                time: new Date(grade.createdAt).toLocaleDateString(),
                timestamp: new Date(grade.createdAt).getTime()
              });
            }
          }
        });
      }

      if (submissionsSnap.exists()) {
        const submissions = submissionsSnap.val();
        ['github', 'drive'].forEach(type => {
          if (submissions[type]) {
            Object.entries(submissions[type]).forEach(([internId, userSubmissions]: [string, any]) => {
              const intern = supervisorInterns.find(i => i.uid === internId);
              if (intern && Array.isArray(userSubmissions)) {
                userSubmissions.forEach((submission: any) => {
                  recentActivityList.push({
                    type: 'submission',
                    intern: intern.name,
                    action: `submitted ${type} assignment`,
                    time: new Date(submission.submittedAt).toLocaleDateString(),
                    timestamp: new Date(submission.submittedAt).getTime()
                  });
                });
              }
            });
          }
        });
      }

      // Sort by timestamp and take latest 5
      recentActivityList.sort((a, b) => b.timestamp - a.timestamp);

      const averageProgress = totalInterns > 0 ? Math.round((completedTasks / totalInterns) * 10) : 0;

      setStats({
        totalInterns,
        activeAssignments,
        completedTasks,
        pendingReviews,
        averageProgress,
      });

      setMyInterns(supervisorInterns.slice(0, 5)); // Show top 5 interns
      setRecentActivity(recentActivityList.slice(0, 5));
      setProgressData(weeklyProgressData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'My Interns',
      value: stats.totalInterns,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Assignments',
      value: stats.activeAssignments,
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews,
      icon: Clock,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
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
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.name}!</p>
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

      {/* My Interns & Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Interns</h3>
              <Button variant="secondary" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {myInterns.length > 0 ? (
                myInterns.map((intern, index) => (
                  <div key={intern.uid} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {intern.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{intern.name}</p>
                      <p className="text-sm text-gray-600">{intern.groupName} • GPA: {intern.gpa}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No interns assigned</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Progress</h3>
            {progressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No progress data available</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'submission' ? 'bg-blue-500' :
                    activity.type === 'grade' ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{activity.intern}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <Users className="h-6 w-6 mb-2" />
              <span>View Interns</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <FileText className="h-6 w-6 mb-2" />
              <span>Review Assignments</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <Calendar className="h-6 w-6 mb-2" />
              <span>Schedule Meeting</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>View Reports</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}