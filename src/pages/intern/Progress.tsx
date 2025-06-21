import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { TrendingUp, Target, Award, Calendar, CheckCircle, Clock, Star } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ProgressData {
  totalAssignments: number;
  completedAssignments: number;
  totalTasks: number;
  completedTasks: number;
  averageGrade: number;
  skillsProgress: { [key: string]: number };
  weeklyProgress: { week: string; completed: number; total: number }[];
}

export default function InternProgress() {
  const { currentUser } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData>({
    totalAssignments: 0,
    completedAssignments: 0,
    totalTasks: 0,
    completedTasks: 0,
    averageGrade: 0,
    skillsProgress: {},
    weeklyProgress: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProgressData();
    }
  }, [currentUser]);

  const fetchProgressData = async () => {
    try {
      const [assignmentsSnap, tasksSnap, submissionsSnap, internSnap] = await Promise.all([
        get(ref(database, 'assignments')),
        get(ref(database, `tasks/${currentUser?.uid}`)),
        get(ref(database, 'submissions')),
        get(ref(database, `acceptedInterns/${currentUser?.uid}`)),
      ]);

      let totalAssignments = 0;
      let completedAssignments = 0;

      // Count assignments
      if (assignmentsSnap.exists()) {
        const assignments = assignmentsSnap.val();
        Object.values(assignments).forEach((assignment: any) => {
          if (assignment.targetAudience === 'all' || 
              (assignment.targetAudience === 'individual' && assignment.targetIds?.includes(currentUser?.uid))) {
            totalAssignments++;
          }
        });
      }

      // Count submissions
      if (submissionsSnap.exists()) {
        const submissions = submissionsSnap.val();
        ['github', 'drive'].forEach(type => {
          if (submissions[type] && submissions[type][currentUser?.uid]) {
            completedAssignments += submissions[type][currentUser?.uid].length;
          }
        });
      }

      let totalTasks = 0;
      let completedTasks = 0;

      // Count tasks
      if (tasksSnap.exists()) {
        const tasks = tasksSnap.val();
        Object.values(tasks).forEach((task: any) => {
          totalTasks++;
          if (task.status === 'completed') {
            completedTasks++;
          }
        });
      }

      // Get intern skills for progress tracking
      let skillsProgress = {};
      if (internSnap.exists()) {
        const internData = internSnap.val();
        if (internData.skills) {
          internData.skills.forEach((skill: string) => {
            // Mock progress for skills (in real app, this would be calculated based on assignments/feedback)
            skillsProgress[skill] = Math.floor(Math.random() * 100);
          });
        }
      }

      // Mock weekly progress data
      const weeklyProgress = [
        { week: 'Week 1', completed: 2, total: 3 },
        { week: 'Week 2', completed: 4, total: 5 },
        { week: 'Week 3', completed: 3, total: 4 },
        { week: 'Week 4', completed: 5, total: 6 },
      ];

      setProgressData({
        totalAssignments,
        completedAssignments: Math.min(completedAssignments, totalAssignments),
        totalTasks,
        completedTasks,
        averageGrade: 85, // Mock average grade
        skillsProgress,
        weeklyProgress,
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallProgress = progressData.totalAssignments > 0 
    ? Math.round((progressData.completedAssignments / progressData.totalAssignments) * 100)
    : 0;

  const taskProgress = progressData.totalTasks > 0
    ? Math.round((progressData.completedTasks / progressData.totalTasks) * 100)
    : 0;

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
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">Track your internship progress and achievements</p>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4">
              <CircularProgressbar
                value={overallProgress}
                text={`${overallProgress}%`}
                styles={buildStyles({
                  textColor: '#1f2937',
                  pathColor: '#3b82f6',
                  trailColor: '#e5e7eb',
                })}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
            <p className="text-sm text-gray-600">
              {progressData.completedAssignments} of {progressData.totalAssignments} assignments completed
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4">
              <CircularProgressbar
                value={taskProgress}
                text={`${taskProgress}%`}
                styles={buildStyles({
                  textColor: '#1f2937',
                  pathColor: '#10b981',
                  trailColor: '#e5e7eb',
                })}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Task Completion</h3>
            <p className="text-sm text-gray-600">
              {progressData.completedTasks} of {progressData.totalTasks} tasks completed
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <div className="text-4xl font-bold text-purple-600">{progressData.averageGrade}</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Average Grade</h3>
            <p className="text-sm text-gray-600">Based on completed assignments</p>
          </Card>
        </motion.div>
      </div>

      {/* Skills Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Development</h3>
          <div className="space-y-4">
            {Object.entries(progressData.skillsProgress).map(([skill, progress], index) => (
              <div key={skill} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{skill}</span>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Weekly Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {progressData.weeklyProgress.map((week, index) => {
              const weekProgress = Math.round((week.completed / week.total) * 100);
              return (
                <motion.div
                  key={week.week}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-2">
                    <CircularProgressbar
                      value={weekProgress}
                      text={`${weekProgress}%`}
                      styles={buildStyles({
                        textSize: '20px',
                        textColor: '#1f2937',
                        pathColor: '#f59e0b',
                        trailColor: '#e5e7eb',
                      })}
                    />
                  </div>
                  <h4 className="font-medium text-gray-900">{week.week}</h4>
                  <p className="text-xs text-gray-600">{week.completed}/{week.total} tasks</p>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Award className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900">First Assignment Completed</p>
                <p className="text-sm text-gray-600">Completed your first assignment on time</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Perfect Week</p>
                <p className="text-sm text-gray-600">Completed all tasks in Week 2</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Star className="h-6 w-6 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">High Performer</p>
                <p className="text-sm text-gray-600">Maintained 85%+ average grade</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}