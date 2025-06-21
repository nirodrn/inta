import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database } from '../../config/firebase';
import Card from '../../components/UI/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardStats {
  preInterns: number;
  acceptedInterns: number;
  supervisors: number;
  scheduledInterviews: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    preInterns: 0,
    acceptedInterns: 0,
    supervisors: 0,
    scheduledInterviews: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [preInternsSnap, internsSnap, supervisorsSnap, interviewsSnap, tasksSnap] = await Promise.all([
        get(ref(database, 'preInterviewInterns')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'supervisors')),
        get(ref(database, 'interviews')),
        get(ref(database, 'tasks')),
      ]);

      const preInterns = preInternsSnap.exists() ? Object.keys(preInternsSnap.val()).length : 0;
      const acceptedInterns = internsSnap.exists() ? Object.keys(internsSnap.val()).length : 0;
      const supervisors = supervisorsSnap.exists() ? Object.keys(supervisorsSnap.val()).length : 0;
      
      let scheduledInterviews = 0;
      if (interviewsSnap.exists()) {
        const interviews = Object.values(interviewsSnap.val());
        scheduledInterviews = interviews.filter((interview: any) => interview.status === 'scheduled').length;
      }

      let completedTasks = 0;
      let pendingTasks = 0;
      if (tasksSnap.exists()) {
        const allTasks = Object.values(tasksSnap.val());
        allTasks.forEach((userTasks: any) => {
          Object.values(userTasks).forEach((task: any) => {
            if (task.status === 'completed') completedTasks++;
            else pendingTasks++;
          });
        });
      }

      setStats({
        preInterns,
        acceptedInterns,
        supervisors,
        scheduledInterviews,
        completedTasks,
        pendingTasks,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Pre-Interview Interns',
      value: stats.preInterns,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Accepted Interns',
      value: stats.acceptedInterns,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Supervisors',
      value: stats.supervisors,
      icon: Award,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Scheduled Interviews',
      value: stats.scheduledInterviews,
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: Clock,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const mockChartData = [
    { name: 'Jan', interns: 4, interviews: 8 },
    { name: 'Feb', interns: 6, interviews: 12 },
    { name: 'Mar', interns: 8, interviews: 15 },
    { name: 'Apr', interns: 12, interviews: 20 },
    { name: 'May', interns: 16, interviews: 25 },
    { name: 'Jun', interns: 20, interviews: 30 },
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to Detz Global IMS</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="interns" fill="#3B82F6" />
                <Bar dataKey="interviews" fill="#14B8A6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="interns" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="interviews" stroke="#14B8A6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-700">New pre-intern application submitted</p>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-700">Interview scheduled with candidate</p>
              <span className="text-xs text-gray-500">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-gray-700">New supervisor added to system</p>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}