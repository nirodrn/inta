import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { Trophy, Medal, Award, Star, Github, TrendingUp, Users } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LeaderboardEntry, Intern } from '../../types';
import Card from '../../components/UI/Card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function InternLeaderboard() {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserBatch, setCurrentUserBatch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchLeaderboardData();
    }
  }, [currentUser]);

  const fetchLeaderboardData = async () => {
    try {
      const [internsSnap, submissionsSnap, gradesSnap] = await Promise.all([
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'submissions')),
        get(ref(database, 'grades')),
      ]);

      let userBatch = '';
      const leaderboardData: LeaderboardEntry[] = [];

      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        
        // Get current user's batch
        const currentUserData = internsData[currentUser?.uid || ''];
        if (currentUserData && currentUserData.batch) {
          userBatch = currentUserData.batch;
          setCurrentUserBatch(userBatch);
        } else {
          // No batch assigned to current user
          setCurrentUserBatch('');
          setLoading(false);
          return;
        }

        Object.entries(internsData).forEach(([internId, intern]: [string, any]) => {
          // Only include interns from the same batch (and only if batch exists)
          if (userBatch && intern.batch === userBatch) {
            let totalScore = 0;
            let completedTasks = 0;
            let averageGrade = 0;

            // Count submissions
            let submissionCount = 0;
            if (submissionsSnap.exists()) {
              const submissionsData = submissionsSnap.val();
              ['github', 'drive'].forEach(type => {
                if (submissionsData[type] && submissionsData[type][internId]) {
                  const userSubmissions = submissionsData[type][internId];
                  if (Array.isArray(userSubmissions)) {
                    submissionCount += userSubmissions.length;
                    completedTasks += userSubmissions.length;
                    totalScore += userSubmissions.length * 10; // 10 points per submission
                  }
                }
              });
            }

            // Calculate average grade from grades collection
            if (gradesSnap.exists()) {
              const gradesData = gradesSnap.val();
              const internGrades = Object.values(gradesData).filter((grade: any) => grade.internId === internId);
              
              if (internGrades.length > 0) {
                const totalGradePoints = internGrades.reduce((sum: number, grade: any) => {
                  return sum + ((grade.grade / grade.maxGrade) * 100);
                }, 0);
                averageGrade = Math.round(totalGradePoints / internGrades.length);
                totalScore += averageGrade * 2; // 2 points per grade percentage
              } else {
                // Use GPA as fallback only if no grades exist
                averageGrade = Math.round(intern.gpa * 25); // Convert 4.0 scale to 100 scale
                totalScore += averageGrade;
              }
            } else {
              // Use GPA as fallback only if grades collection doesn't exist
              averageGrade = Math.round(intern.gpa * 25); // Convert 4.0 scale to 100 scale
              totalScore += averageGrade;
            }

            const githubUrl = submissionsSnap.exists() && 
                             submissionsData.github && 
                             submissionsData.github[internId] && 
                             submissionsData.github[internId][0] 
                             ? submissionsData.github[internId][0] 
                             : undefined;

            leaderboardData.push({
              internId,
              name: intern.name,
              nickname: intern.nickname,
              score: Math.round(totalScore),
              completedTasks,
              averageGrade,
              githubUrl,
              skills: intern.skills || [],
            });
          }
        });
      } else {
        // No interns data exists
        setCurrentUserBatch('');
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

  const isTopPerformer = (rank: number) => rank <= 4;

  const renderStars = (rating: number) => {
    const stars = Math.min(5, Math.max(1, Math.round(rating / 20))); // Convert 100 scale to 5 stars
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Batch Leaderboard</h1>
        <p className="text-gray-600">
          {currentUserBatch ? `Batch ${currentUserBatch} Rankings` : 'Your batch rankings'}
        </p>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <Users className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">{leaderboard.length} interns in your batch</span>
        </div>
      </motion.div>

      {!currentUserBatch ? (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No Batch Assigned</h3>
            <p>You haven't been assigned to a batch yet. Contact your supervisor to get assigned to a batch.</p>
          </div>
        </Card>
      ) : leaderboard.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No Leaderboard Data</h3>
            <p>No other interns in your batch yet, or no activity to rank. Complete assignments to see your progress!</p>
          </div>
        </Card>
      ) : (
        <>
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
                          {(leaderboard[1].nickname || leaderboard[1].name).charAt(0)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {leaderboard[1].nickname || leaderboard[1].name}
                      </h3>
                      <p className="text-sm text-gray-600">{leaderboard[1].score} pts</p>
                      <div className="flex justify-center mt-1">
                        {renderStars(leaderboard[1].averageGrade)}
                      </div>
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
                          {(leaderboard[0].nickname || leaderboard[0].name).charAt(0)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {leaderboard[0].nickname || leaderboard[0].name}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">{leaderboard[0].score} pts</p>
                      <div className="flex justify-center mt-1">
                        {renderStars(leaderboard[0].averageGrade)}
                      </div>
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
                          {(leaderboard[2].nickname || leaderboard[2].name).charAt(0)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {leaderboard[2].nickname || leaderboard[2].name}
                      </h3>
                      <p className="text-sm text-gray-600">{leaderboard[2].score} pts</p>
                      <div className="flex justify-center mt-1">
                        {renderStars(leaderboard[2].averageGrade)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Full Leaderboard */}
          <div className="space-y-4">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.internId === currentUser?.uid;
              const isTop4 = isTopPerformer(index + 1);
              
              return (
                <motion.div
                  key={entry.internId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className={`p-6 ${isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${isTop4 ? 'ring-2 ring-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadge(index + 1)}`}>
                          <span className="font-bold text-lg">#{index + 1}</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {getRankIcon(index + 1)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {entry.nickname || entry.name}
                              </h3>
                              {isCurrentUser && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  You
                                </span>
                              )}
                              {isTop4 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                  Top Performer
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              {renderStars(entry.averageGrade)}
                              <span className="ml-2 text-sm text-gray-600">({entry.averageGrade}%)</span>
                            </div>
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
                          <div className="w-12 h-12">
                            <CircularProgressbar
                              value={entry.averageGrade}
                              text={`${entry.averageGrade}%`}
                              styles={buildStyles({
                                textSize: '20px',
                                textColor: '#1f2937',
                                pathColor: isTop4 ? '#f59e0b' : '#3b82f6',
                                trailColor: '#e5e7eb',
                              })}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Grade</p>
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
              );
            })}
          </div>

          {/* Batch Info */}
          {currentUserBatch && leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Batch {currentUserBatch} Performance</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{leaderboard.length}</div>
                    <div className="text-sm text-blue-800">Total Interns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.averageGrade, 0) / leaderboard.length) : 0}%
                    </div>
                    <div className="text-sm text-green-800">Average Grade</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {leaderboard.reduce((sum, entry) => sum + entry.completedTasks, 0)}
                    </div>
                    <div className="text-sm text-purple-800">Total Tasks Completed</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}