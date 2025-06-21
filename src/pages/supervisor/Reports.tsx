import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { BarChart3, Download, Users, TrendingUp, FileText, Award } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';

export default function SupervisorReports() {
  const { currentUser } = useAuth();
  const [reportData, setReportData] = useState<any>({
    totalInterns: 0,
    averageGrade: 0,
    completionRate: 0,
    internProgress: [],
    skillsDistribution: [],
    weeklyProgress: [],
  });
  const [myInterns, setMyInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchReportData();
    }
  }, [currentUser]);

  const fetchReportData = async () => {
    try {
      const [groupsSnap, internsSnap, submissionsSnap, assignmentsSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'submissions')),
        get(ref(database, 'assignments')),
      ]);

      let supervisorInterns: any[] = [];
      let totalInterns = 0;

      // Get supervisor's interns
      if (groupsSnap.exists() && internsSnap.exists()) {
        const groups = groupsSnap.val();
        const internsData = internsSnap.val();

        Object.values(groups).forEach((group: any) => {
          if (group.supervisorId === currentUser?.uid) {
            totalInterns += group.internIds?.length || 0;
            
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

      // Calculate metrics
      let totalGrades = 0;
      let gradeCount = 0;
      let totalSubmissions = 0;
      let totalAssignments = 0;

      if (assignmentsSnap.exists()) {
        totalAssignments = Object.keys(assignmentsSnap.val()).length;
      }

      if (submissionsSnap.exists()) {
        const submissions = submissionsSnap.val();
        ['github', 'drive'].forEach(type => {
          if (submissions[type]) {
            supervisorInterns.forEach(intern => {
              if (submissions[type][intern.uid]) {
                const userSubmissions = submissions[type][intern.uid];
                totalSubmissions += userSubmissions.length;
                
                userSubmissions.forEach((sub: any) => {
                  if (sub.grade) {
                    totalGrades += sub.grade;
                    gradeCount++;
                  }
                });
              }
            });
          }
        });
      }

      const averageGrade = gradeCount > 0 ? Math.round(totalGrades / gradeCount) : 0;
      const completionRate = totalAssignments > 0 ? Math.round((totalSubmissions / (totalAssignments * totalInterns)) * 100) : 0;

      // Mock data for charts
      const internProgress = supervisorInterns.map(intern => ({
        name: intern.name,
        progress: Math.floor(Math.random() * 100),
        grade: Math.floor(Math.random() * 40) + 60,
      }));

      const skillsDistribution = [
        { name: 'React', value: 8 },
        { name: 'Node.js', value: 6 },
        { name: 'Python', value: 4 },
        { name: 'Java', value: 3 },
        { name: 'Others', value: 2 },
      ];

      const weeklyProgress = [
        { week: 'Week 1', completed: 15, total: 20 },
        { week: 'Week 2', completed: 25, total: 30 },
        { week: 'Week 3', completed: 35, total: 40 },
        { week: 'Week 4', completed: 45, total: 50 },
      ];

      setReportData({
        totalInterns,
        averageGrade,
        completionRate,
        internProgress,
        skillsDistribution,
        weeklyProgress,
      });

      setMyInterns(supervisorInterns);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF();
      
      // Title
      pdf.setFontSize(20);
      pdf.text('Supervisor Report', 20, 30);
      
      // Supervisor info
      pdf.setFontSize(12);
      pdf.text(`Supervisor: ${currentUser?.name}`, 20, 50);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 60);
      
      // Stats
      pdf.setFontSize(14);
      pdf.text('Summary Statistics', 20, 80);
      pdf.setFontSize(10);
      pdf.text(`Total Interns: ${reportData.totalInterns}`, 20, 95);
      pdf.text(`Average Grade: ${reportData.averageGrade}%`, 20, 105);
      pdf.text(`Completion Rate: ${reportData.completionRate}%`, 20, 115);
      
      // Intern list
      pdf.setFontSize(14);
      pdf.text('My Interns', 20, 135);
      pdf.setFontSize(10);
      
      let yPos = 150;
      myInterns.forEach((intern, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(`${index + 1}. ${intern.name} - ${intern.university} (GPA: ${intern.gpa})`, 20, yPos);
        yPos += 10;
      });
      
      pdf.save('supervisor-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const COLORS = ['#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];

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
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your team's performance and progress</p>
        </div>
        <Button onClick={generatePDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interns</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.totalInterns}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.averageGrade}%</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.completionRate}%</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Intern Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.internProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="#3B82F6" name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.skillsDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.skillsDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#3B82F6" strokeWidth={2} name="Completed" />
              <Line type="monotone" dataKey="total" stroke="#14B8A6" strokeWidth={2} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Intern Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Intern Performance Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myInterns.map((intern) => (
                  <tr key={intern.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {intern.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intern.university}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intern.gpa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intern.groupName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}