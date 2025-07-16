import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { TrendingUp, Target, Award, Calendar, CheckCircle, Clock, Star, BookOpen, FileText, Users, Trophy, Zap } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ProgressData {
  totalAssignments: number;
  completedAssignments: number;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  averageGrade: number;
  skillsProgress: { [key: string]: number };
  weeklyProgress: { week: string; completed: number; total: number; assignments: number; projects: number }[];
  monthlyTrend: { month: string; score: number; assignments: number; projects: number }[];
  recentAchievements: Achievement[];
  upcomingDeadlines: Deadline[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  type: 'assignment' | 'project' | 'grade' | 'streak' | 'milestone';
}

interface Deadline {
  id: string;
  title: string;
  type: 'assignment' | 'project';
  deadline: string;
  daysLeft: number;
  status: 'upcoming' | 'urgent' | 'overdue';
}

export default function InternProgress() {
  const { currentUser } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData>({
    totalAssignments: 0,
    completedAssignments: 0,
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    averageGrade: 0,
    skillsProgress: {},
    weeklyProgress: [],
    monthlyTrend: [],
    recentAchievements: [],
    upcomingDeadlines: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProgressData();
    }
  }, [currentUser]);

  const fetchProgressData = async () => {
    try {
      const [
        assignmentsSnap,
        submissionsSnap,
        projectsSnap,
        gradesSnap,
        internSnap,
        groupsSnap
      ] = await Promise.all([
        get(ref(database, 'assignments')),
        get(ref(database, 'submissions')),
        get(ref(database, 'projects')),
        get(ref(database, 'grades')),
        get(ref(database, `acceptedInterns/${currentUser?.uid}`)),
        get(ref(database, 'groups')),
      ]);

      let totalAssignments = 0;
      let completedAssignments = 0;
      let totalProjects = 0;
      let completedProjects = 0;
      let assignments: any[] = [];
      let projects: any[] = [];
      let submissions: any[] = [];
      let grades: any[] = [];

      // Process assignments
      if (assignmentsSnap.exists()) {
        const assignmentsData = assignmentsSnap.val();
        Object.entries(assignmentsData).forEach(([id, assignment]: [string, any]) => {
          if (assignment.targetAudience === 'all' || 
              (assignment.targetAudience === 'individual' && assignment.targetIds?.includes(currentUser?.uid))) {
            totalAssignments++;
            assignments.push({ id, ...assignment });
          }
        });
      }

      // Process submissions
      if (submissionsSnap.exists()) {
        const submissionsData = submissionsSnap.val();
        ['github', 'drive'].forEach(type => {
          if (submissionsData[type] && submissionsData[type][currentUser?.uid]) {
            const userSubmissions = submissionsData[type][currentUser?.uid];
            if (Array.isArray(userSubmissions)) {
              completedAssignments += userSubmissions.length;
              submissions.push(...userSubmissions.map(sub => ({ ...sub, type })));
            }
          }
        });
      }

      // Process projects
      if (projectsSnap.exists() && groupsSnap.exists()) {
        const projectsData = projectsSnap.val();
        const groupsData = groupsSnap.val();
        
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
            projects.push({ id, ...project });
          }
        });
      }

      // Process grades
      let averageGrade = 0;
      if (gradesSnap.exists()) {
        const gradesData = gradesSnap.val();
        const internGrades = Object.values(gradesData).filter((grade: any) => grade.internId === currentUser?.uid);
        grades = internGrades as any[];
        
        if (internGrades.length > 0) {
          const totalGradePoints = internGrades.reduce((sum: number, grade: any) => {
            return sum + ((grade.grade / grade.maxGrade) * 100);
          }, 0);
          averageGrade = Math.round(totalGradePoints / internGrades.length);
        }
      }

      // Calculate skills progress
      let skillsProgress = {};
      if (internSnap.exists()) {
        const internData = internSnap.val();
        if (internData.skills && Array.isArray(internData.skills)) {
          internData.skills.forEach((skill: string) => {
            const baseProgress = averageGrade || 0;
            const completionBonus = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 20 : 0;
            const projectBonus = totalProjects > 0 ? (completedProjects / totalProjects) * 15 : 0;
            skillsProgress[skill] = Math.min(100, Math.round(baseProgress + completionBonus + projectBonus));
          });
        }
      }

      // Calculate weekly progress
      const weeklyProgress = generateWeeklyProgress(submissions, assignments, projects);
      
      // Calculate monthly trend
      const monthlyTrend = generateMonthlyTrend(submissions, grades, assignments, projects);

      // Generate achievements
      const achievements = generateAchievements(
        completedAssignments,
        completedProjects,
        averageGrade,
        submissions,
        grades
      );

      // Generate upcoming deadlines
      const upcomingDeadlines = generateUpcomingDeadlines(assignments, projects);

      const totalTasks = totalAssignments + totalProjects;
      const completedTasks = completedAssignments + completedProjects;

      setProgressData({
        totalAssignments,
        completedAssignments,
        totalProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        averageGrade,
        skillsProgress,
        weeklyProgress,
        monthlyTrend,
        recentAchievements: achievements,
        upcomingDeadlines,
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyProgress = (submissions: any[], assignments: any[], projects: any[]) => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekSubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.submittedAt);
        return subDate >= weekStart && subDate <= weekEnd;
      });

      const weekAssignments = assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.createdAt);
        return assignmentDate >= weekStart && assignmentDate <= weekEnd;
      });

      const weekProjects = projects.filter(project => {
        const projectDate = new Date(project.createdAt);
        return projectDate >= weekStart && projectDate <= weekEnd;
      });

      weeks.push({
        week: `Week ${4 - i}`,
        completed: weekSubmissions.length,
        total: Math.max(weekSubmissions.length, 1),
        assignments: weekAssignments.length,
        projects: weekProjects.length,
      });
    }
    
    return weeks;
  };

  const generateMonthlyTrend = (submissions: any[], grades: any[], assignments: any[], projects: any[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthSubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.submittedAt);
        return subDate >= monthStart && subDate <= monthEnd;
      });

      const monthGrades = grades.filter((grade: any) => {
        const gradeDate = new Date(grade.createdAt);
        return gradeDate >= monthStart && gradeDate <= monthEnd;
      });

      const monthAssignments = assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.createdAt);
        return assignmentDate >= monthStart && assignmentDate <= monthEnd;
      });

      const monthProjects = projects.filter(project => {
        const projectDate = new Date(project.createdAt);
        return projectDate >= monthStart && projectDate <= monthEnd;
      });

      const avgGrade = monthGrades.length > 0 
        ? monthGrades.reduce((sum: number, grade: any) => sum + ((grade.grade / grade.maxGrade) * 100), 0) / monthGrades.length
        : 0;

      const score = monthSubmissions.length * 10 + avgGrade;

      months.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        score: Math.round(score),
        assignments: monthAssignments.length,
        projects: monthProjects.length,
      });
    }
    
    return months;
  };

  const generateAchievements = (
    completedAssignments: number,
    completedProjects: number,
    averageGrade: number,
    submissions: any[],
    grades: any[]
  ): Achievement[] => {
    const achievements: Achievement[] = [];

    if (completedAssignments >= 1) {
      achievements.push({
        id: 'first-assignment',
        title: 'First Steps',
        description: 'Completed your first assignment',
        icon: '🎯',
        earnedAt: submissions[0]?.submittedAt || new Date().toISOString(),
        type: 'assignment'
      });
    }

    if (completedAssignments >= 5) {
      achievements.push({
        id: 'assignment-streak',
        title: 'Assignment Master',
        description: 'Completed 5 assignments',
        icon: '🏆',
        earnedAt: new Date().toISOString(),
        type: 'milestone'
      });
    }

    if (completedProjects >= 1) {
      achievements.push({
        id: 'first-project',
        title: 'Project Pioneer',
        description: 'Completed your first project',
        icon: '🚀',
        earnedAt: new Date().toISOString(),
        type: 'project'
      });
    }

    if (averageGrade >= 85) {
      achievements.push({
        id: 'high-performer',
        title: 'High Performer',
        description: 'Maintained 85%+ average grade',
        icon: '⭐',
        earnedAt: new Date().toISOString(),
        type: 'grade'
      });
    }

    if (averageGrade >= 95) {
      achievements.push({
        id: 'excellence',
        title: 'Excellence Award',
        description: 'Achieved 95%+ average grade',
        icon: '💎',
        earnedAt: new Date().toISOString(),
        type: 'grade'
      });
    }

    return achievements.slice(0, 5);
  };

  const generateUpcomingDeadlines = (assignments: any[], projects: any[]): Deadline[] => {
    const deadlines: Deadline[] = [];
    const now = new Date();

    [...assignments, ...projects].forEach(item => {
      const deadline = new Date(item.deadline);
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft >= -1 && daysLeft <= 14) {
        let status: 'upcoming' | 'urgent' | 'overdue' = 'upcoming';
        if (daysLeft < 0) status = 'overdue';
        else if (daysLeft <= 3) status = 'urgent';

        deadlines.push({
          id: item.id,
          title: item.title,
          type: item.assignedTo ? 'project' : 'assignment',
          deadline: item.deadline,
          daysLeft,
          status
        });
      }
    });

    return deadlines.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);
  };

  const overallProgress = progressData.totalTasks > 0 
    ? Math.round((progressData.completedTasks / progressData.totalTasks) * 100)
    : 0;

  const assignmentProgress = progressData.totalAssignments > 0
    ? Math.round((progressData.completedAssignments / progressData.totalAssignments) * 100)
    : 0;

  const projectProgress = progressData.totalProjects > 0
    ? Math.round((progressData.completedProjects / progressData.totalProjects) * 100)
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedTimeframe('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTimeframe === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setSelectedTimeframe('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTimeframe === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4">
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
              {progressData.completedTasks} of {progressData.totalTasks} tasks completed
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4">
              <CircularProgressbar
                value={assignmentProgress}
                text={`${assignmentProgress}%`}
                styles={buildStyles({
                  textColor: '#1f2937',
                  pathColor: '#10b981',
                  trailColor: '#e5e7eb',
                })}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
            <p className="text-sm text-gray-600">
              {progressData.completedAssignments} of {progressData.totalAssignments} completed
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4">
              <CircularProgressbar
                value={projectProgress}
                text={`${projectProgress}%`}
                styles={buildStyles({
                  textColor: '#1f2937',
                  pathColor: '#f59e0b',
                  trailColor: '#e5e7eb',
                })}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
            <p className="text-sm text-gray-600">
              {progressData.completedProjects} of {progressData.totalProjects} completed
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <div className="text-4xl font-bold text-purple-600">
                {progressData.averageGrade || 'N/A'}
                {progressData.averageGrade > 0 && '%'}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Average Grade</h3>
            <p className="text-sm text-gray-600">
              {progressData.averageGrade > 0 ? 'Based on completed work' : 'No grades yet'}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedTimeframe === 'week' ? 'Weekly Progress' : 'Monthly Trend'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(selectedTimeframe === 'week' ? progressData.weeklyProgress : progressData.monthlyTrend).map((period, index) => {
              const progress = selectedTimeframe === 'week' 
                ? period.total > 0 ? Math.round((period.completed / period.total) * 100) : 0
                : period.score;
              
              return (
                <motion.div
                  key={selectedTimeframe === 'week' ? period.week : period.month}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-2">
                    <CircularProgressbar
                      value={selectedTimeframe === 'week' ? progress : Math.min(100, progress / 2)}
                      text={selectedTimeframe === 'week' ? `${progress}%` : `${progress}`}
                      styles={buildStyles({
                        textSize: '20px',
                        textColor: '#1f2937',
                        pathColor: selectedTimeframe === 'week' ? '#f59e0b' : '#8b5cf6',
                        trailColor: '#e5e7eb',
                      })}
                    />
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {selectedTimeframe === 'week' ? period.week : period.month}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {selectedTimeframe === 'week' 
                      ? `${period.completed} tasks`
                      : `${period.assignments + period.projects} items`
                    }
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Skills Progress */}
      {Object.keys(progressData.skillsProgress).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.8 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Achievements and Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              {progressData.recentAchievements.length > 0 ? (
                progressData.recentAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <p className="font-medium text-gray-900">{achievement.title}</p>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete tasks to unlock achievements!</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {progressData.upcomingDeadlines.length > 0 ? (
                progressData.upcomingDeadlines.map((deadline, index) => (
                  <motion.div
                    key={deadline.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      deadline.status === 'overdue' ? 'bg-red-50 border-red-200' :
                      deadline.status === 'urgent' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      deadline.status === 'overdue' ? 'bg-red-100 text-red-600' :
                      deadline.status === 'urgent' ? 'bg-orange-100 text-orange-600' :
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
                        deadline.status === 'overdue' ? 'text-red-600' :
                        deadline.status === 'urgent' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {deadline.daysLeft < 0 ? 'Overdue' :
                         deadline.daysLeft === 0 ? 'Due Today' :
                         deadline.daysLeft === 1 ? '1 day left' :
                         `${deadline.daysLeft} days left`}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming deadlines</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Performance Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progressData.completedTasks}</div>
              <div className="text-sm text-blue-800">Total Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progressData.averageGrade || 0}%
              </div>
              <div className="text-sm text-green-800">Average Grade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressData.recentAchievements.length}
              </div>
              <div className="text-sm text-purple-800">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {overallProgress}%
              </div>
              <div className="text-sm text-orange-800">Overall Progress</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}