import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { Users, UserCheck, GraduationCap, Mail, Phone, MessageSquare } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Group, Intern, Supervisor } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

export default function InternGroup() {
  const { currentUser } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<Intern[]>([]);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchGroupData();
    }
  }, [currentUser]);

  const fetchGroupData = async () => {
    try {
      const [groupsSnap, internsSnap, supervisorsSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'supervisors')),
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
              <div className="flex items-center space-x-2">
                {supervisor.email && (
                  <Button variant="secondary" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
                <Button variant="secondary" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
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
          {groupMembers.map((member, index) => (
            <motion.div
              key={member.uid}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className={`p-6 ${member.uid === currentUser?.uid ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                        {member.uid === currentUser?.uid && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                      {member.nickname && (
                        <p className="text-sm text-gray-600">"{member.nickname}"</p>
                      )}
                      <p className="text-sm text-gray-600">{member.university}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">GPA: {member.gpa}</div>
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
          ))}
        </div>
      </motion.div>

      {/* Group Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <MessageSquare className="h-6 w-6 mb-2" />
              <span>Group Chat</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <Users className="h-6 w-6 mb-2" />
              <span>Schedule Meeting</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <GraduationCap className="h-6 w-6 mb-2" />
              <span>Share Resources</span>
            </Button>
            <Button variant="secondary" className="flex flex-col items-center p-4 h-auto">
              <UserCheck className="h-6 w-6 mb-2" />
              <span>Contact Supervisor</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}