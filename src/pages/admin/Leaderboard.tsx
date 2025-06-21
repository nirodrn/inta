import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { Trophy, Medal, Award, Star, Github, TrendingUp } from 'lucide-react';
import { database } from '../../config/firebase';
import { LeaderboardEntry, Intern } from '../../types';
import Card from '../../components/UI/Card';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const [internsSnap, tasksSnap, submissionsSnap] = await Promise.all([
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'tasks')),
        get(ref(database, 'submissions')),
      ]);

      const leaderboardData: LeaderboardEntry[] = [];

      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        
        Object.entries(internsData).forEach(([internId, intern]: [string, any]) => {
          let completedTasks = 0;
          let totalScore = 0;

          // Count completed tasks
          if (tasksSnap.exists()) {
            const tasksData = tasksSnap.val();
            if (tasksData[internId]) {
              Object.values(tasksData[internId]).forEach((task: any) => {
                if (task.status === 'completed') {
                  completedTasks++;
                  totalScore += 10; // 10 points per completed task
                }
              });
            }
          }

          // Count submissions
          let submissionCount = 0;
          if (submissionsSnap.exists()) {
            const submissionsData = submissionsSnap.val();
            ['github', 'drive'].forEach(type => {
              if (submissionsData[type] && submissionsData[type][internId]) {
                submissionCount += submissionsData[type][internId].length;
                totalScore += submissionsData[type][internId].length * 5; // 5 points per submission
              }
            });
          }

          // Add GPA bonus
          totalScore += intern.gpa * 10;

          const githubUrl = submissionsSnap.exists() && 
                           submissionsData.github && 
                           submissionsData.github[internId] 
                           ? submissionsData.github[internId][0] 
                           : undefined;

          leaderboardData.push({
            internId,
            name: intern.name,
            nickname: intern.nickname,
            score: Math.round(totalScore),
            completedTasks,
            averageGrade: intern.gpa,
            githubUrl,
            skills: intern.skills || [],
          });
        });
      }

      // Sort by score descending
      leaderboardData.sort((a, b) => b.score - a.score);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return <Star className="h-6 w-6 text-blue-500" />;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    }
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
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
        <p className="text-gray-600">Top performing interns based on tasks, submissions, and GPA</p>
      </motion.div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8">
            <div className="flex justify-center items-end space-x-8">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="w-24 h-32 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex items-end justify-center pb-4">
                  <div className="text-center">
                    <Medal className="h-8 w-8 text-white mx-auto mb-2" />
                    <span className="text-white font-bold text-lg">2nd</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">
                      {leaderboard[1].nickname ? leaderboard[1].nickname.charAt(0) : leaderboard[1].name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {leaderboard[1].nickname || leaderboard[1].name}
                  </h3>
                  <p className="text-sm text-gray-600">{leaderboard[1].score} pts</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <div className="w-24 h-40 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg flex items-end justify-center pb-4">
                  <div className="text-center">
                    <Trophy className="h-10 w-10 text-white mx-auto mb-2" />
                    <span className="text-white font-bold text-xl">1st</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-xl">
                      {leaderboard[0].nickname ? leaderboard[0].nickname.charAt(0) : leaderboard[0].name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {leaderboard[0].nickname || leaderboard[0].name}
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">{leaderboard[0].score} pts</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="w-24 h-28 bg-gradient-to-t from-amber-400 to-amber-600 rounded-t-lg flex items-end justify-center pb-4">
                  <div className="text-center">
                    <Award className="h-7 w-7 text-white mx-auto mb-2" />
                    <span className="text-white font-bold">3rd</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">
                      {leaderboard[2].nickname ? leaderboard[2].nickname.charAt(0) : leaderboard[2].name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {leaderboard[2].nickname || leaderboard[2].name}
                  </h3>
                  <p className="text-sm text-gray-600">{leaderboard[2].score} pts</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Full Leaderboard */}
      <div className="space-y-4">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.internId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className={`p-6 ${index < 3 ? 'ring-2 ring-yellow-200' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadge(index + 1)}`}>
                    <span className="font-bold text-lg">#{index + 1}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getRankIcon(index + 1)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {entry.nickname || entry.name}
                      </h3>
                      {entry.nickname && (
                        <p className="text-sm text-gray-600">{entry.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{entry.score}</p>
                    <p className="text-xs text-gray-500">Total Points</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">{entry.completedTasks}</p>
                    <p className="text-xs text-gray-500">Tasks Done</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-purple-600">{entry.averageGrade}</p>
                    <p className="text-xs text-gray-500">GPA</p>
                  </div>

                  {entry.githubUrl && (
                    <a
                      href={entry.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Github className="h-5 w-5 text-gray-700" />
                    </a>
                  )}
                </div>
              </div>

              {entry.skills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {entry.skills.slice(0, 5).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {entry.skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{entry.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No data available</h3>
            <p>Complete some tasks and assignments to see the leaderboard!</p>
          </div>
        </Card>
      )}
    </div>
  );
}