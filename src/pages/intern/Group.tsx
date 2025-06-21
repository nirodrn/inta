import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { Users, UserCheck, GraduationCap, MessageSquare } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Group, Intern, Supervisor } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

export default function InternGroup() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<Intern[]>([]);
  const [memberGrades, setMemberGrades] = useState<{ [key: string]: number }>({});
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchGroupData();
    }
  }, [currentUser]);

  const fetchGroupData = async () => {
    try {
      const [groupsSnap, internsSnap, supervisorsSnap, gradesSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'supervisors')),
        get(ref(database, 'grades')),
      ]);

      let userGroup: Group | null = null;
      
      // Find the group that contains the current user
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        Object.entries(groupsData).forEach(([id, groupData]: [string, any]) => {
          if (groupData.internIds?.includes(currentUser?.uid)) {
            userGroup = { id, ...groupData };
          }
        });
      }

      if (userGroup) {
        setGroup(userGroup);

        // Get group members
        if (internsSnap.exists()) {
          const internsData = internsSnap.val();
          const members = userGroup.internIds
            .map(internId => {
              const internData = internsData[internId];
              return internData ? { uid: internId, ...internData } : null;
            })
            .filter(Boolean) as Intern[];
          setGroupMembers(members);

          // Calculate real grades for each member
          const grades: { [key: string]: number } = {};
          if (gradesSnap.exists()) {
            const gradesData = gradesSnap.val();
            
            members.forEach(member => {
              const memberGrades = Object.values(gradesData).filter((grade: any) => grade.internId === member.uid);
              
              if (memberGrades.length > 0) {
                const totalGradePoints = memberGrades.reduce((sum: number, grade: any) => {
                  return sum + ((grade.grade / grade.maxGrade) * 100);
                }, 0);
                grades[member.uid] = Math.round(totalGradePoints / memberGrades.length);
              }
              // If no grades exist, don't show any grade (no fallback to GPA)
            });
          }
          
          setMemberGrades(grades);
        }

        // Get supervisor
        if (supervisorsSnap.exists()) {
          const supervisorsData = supervisorsSnap.val();
          const supervisorData = supervisorsData[userGroup.supervisorId];
          if (supervisorData) {
            setSupervisor({ uid: userGroup.supervisorId, ...supervisorData });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    navigate('/intern/group-chat');
  };

  const getDisplayName = (member: Intern) => {
    if (member.nickname && member.nickname.trim()) {
      return member.nickname;
    }
    
    // Find unnamed member number
    const unnamedMembers = groupMembers.filter(m => !m.nickname || !m.nickname.trim());
    const memberIndex = unnamedMembers.findIndex(m => m.uid === member.uid);
    return `Unnamed Member ${memberIndex + 1}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">My Group</h1>
          <p className="text-gray-600">Your group information and members</p>
        </motion.div>

        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Group Assigned</h3>
          <p className="text-gray-600">You haven't been assigned to a group yet. Please contact your administrator.</p>
        </Card>
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
          <h1 className="text-3xl font-bold text-gray-900">My Group</h1>
          <p className="text-gray-600">Your group information and members</p>
        </div>
        <Button onClick={handleOpenChat}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Group Chat
        </Button>
      </motion.div>

      {/* Group Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
              {group.description && (
                <p className="text-gray-600">{group.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{groupMembers.length}</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">1</div>
              <div className="text-sm text-gray-600">Supervisor</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">Active</div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Supervisor */}
      {supervisor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Group Supervisor</h3>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{supervisor.name}</h4>
                  {supervisor.department && (
                    <p className="text-sm text-gray-600">{supervisor.department}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Group Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Group Members</h3>
        <div className="grid gap-4">
          {groupMembers.map((member, index) => {
            const displayName = getDisplayName(member);
            const grade = memberGrades[member.uid];
            
            return (
              <motion.div
                key={member.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className={`p-6 ${member.uid === currentUser?.uid ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold text-gray-900">{displayName}</h4>
                          {member.uid === currentUser?.uid && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.university}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {grade !== undefined ? (
                        <div className="text-lg font-semibold text-gray-900">Grade: {grade}%</div>
                      ) : (
                        <div className="text-sm text-gray-500">No grades yet</div>
                      )}
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-end">
                          {member.skills.slice(0, 3).map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {member.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{member.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}