import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { BarChart3, Download, Calendar, Users, FileText, TrendingUp } from 'lucide-react';
import { database } from '../../config/firebase';
import { Intern, Assignment, Submission } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Reports() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [internsSnap, assignmentsSnap, submissionsSnap] = await Promise.all([
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'assignments')),
        get(ref(database, 'submissions')),
      ]);

      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        const internsList = Object.entries(internsData).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
        setInterns(internsList);
      }

      if (assignmentsSnap.exists()) {
        const assignmentsData = assignmentsSnap.val();
        const assignmentsList = Object.entries(assignmentsData).map(([id, assignment]: [string, any]) => ({
          id,
          ...assignment,
        }));
        setAssignments(assignmentsList);
      }

      if (submissionsSnap.exists()) {
        const submissionsData = submissionsSnap.val();
        const submissionsList = Object.entries(submissionsData).flatMap(([type, typeData]: [string, any]) =>
          Object.entries(typeData).flatMap(([internId, submissions]: [string, any]) =>
            Array.isArray(submissions) 
              ? submissions.map((submission, index) => ({
                  id: `${type}-${internId}-${index}`,
                  internId,
                  type,
                  url: submission,
                  submittedAt: new Date().toISOString(), // Mock date
                }))
              : []
          )
        );
        setSubmissions(submissionsList);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const element = document.getElementById('reports-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('detz-global-ims-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', interns: 5, assignments: 8, submissions: 12 },
    { month: 'Feb', interns: 8, assignments: 12, submissions: 18 },
    { month: 'Mar', interns: 12, assignments: 15, submissions: 25 },
    { month: 'Apr', interns: 15, assignments: 18, submissions: 32 },
    { month: 'May', interns: 18, assignments: 22, submissions: 38 },
    { month: 'Jun', interns: 20, assignments: 25, submissions: 45 },
  ];

  const skillsData = [
    { name: 'React', value: 15 },
    { name: 'Node.js', value: 12 },
    { name: 'Python', value: 10 },
    { name: 'Java', value: 8 },
    { name: 'Others', value: 5 },
  ];

  const COLORS = ['#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const stats = {
    totalInterns: interns.length,
    totalAssignments: assignments.length,
    totalSubmissions: submissions.length,
    averageGPA: interns.length > 0 ? (interns.reduce((sum, intern) => sum + intern.gpa, 0) / interns.length).toFixed(2) : '0.00',
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
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <Button onClick={generatePDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </motion.div>

      <div id="reports-content" className="space-y-6">
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
                  <p className="text-3xl font-bold text-gray-900">{stats.totalInterns}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAssignments}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <FileText className="h-6 w-6 text-orange-600" />
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
                  <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <TrendingUp className="h-6 w-6 text-green-600" />
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
                  <p className="text-sm font-medium text-gray-600">Average GPA</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageGPA}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="interns" fill="#3B82F6" name="Interns" />
                  <Bar dataKey="assignments" fill="#14B8A6" name="Assignments" />
                  <Bar dataKey="submissions" fill="#F59E0B" name="Submissions" />
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
                    data={skillsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {skillsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="interns" stroke="#3B82F6" strokeWidth={2} name="Interns" />
                <Line type="monotone" dataKey="assignments" stroke="#14B8A6" strokeWidth={2} name="Assignments" />
                <Line type="monotone" dataKey="submissions" stroke="#F59E0B" strokeWidth={2} name="Submissions" />
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
                      Skills
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interns.slice(0, 10).map((intern) => (
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
                        {intern.skills?.slice(0, 3).join(', ') || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}