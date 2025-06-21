import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { Calendar, Clock, Video, MapPin, Users, CheckCircle } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  mode: 'online' | 'in-person';
  location?: string;
  link?: string;
  organizer: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function InternMeetings() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchMeetings();
    }
  }, [currentUser]);

  const fetchMeetings = async () => {
    try {
      const snapshot = await get(ref(database, 'meetings'));
      if (snapshot.exists()) {
        const meetingsData = snapshot.val();
        const meetingsList = Object.entries(meetingsData)
          .map(([id, meeting]: [string, any]) => ({ id, ...meeting }))
          .filter((meeting: Meeting) => meeting.attendees?.includes(currentUser?.uid || ''))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setMeetings(meetingsList);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMeetingStatus = (meeting: Meeting) => {
    const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
    const now = new Date();
    
    if (meeting.status === 'completed') {
      return { status: 'completed', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
    
    if (meeting.status === 'cancelled') {
      return { status: 'cancelled', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    
    if (meetingDateTime < now) {
      return { status: 'past', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
    
    return { status: 'upcoming', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  };

  const upcomingMeetings = meetings.filter(meeting => {
    const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
    return meetingDateTime > new Date() && meeting.status === 'scheduled';
  });

  const pastMeetings = meetings.filter(meeting => {
    const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
    return meetingDateTime <= new Date() || meeting.status !== 'scheduled';
  });

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
          <h1 className="text-3xl font-bold text-gray-900">My Meetings</h1>
          <p className="text-gray-600">View your scheduled meetings and sessions</p>
        </div>
      </motion.div>

      {/* Upcoming Meetings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Meetings</h2>
        <div className="grid gap-4">
          {upcomingMeetings.map((meeting, index) => {
            const status = getMeetingStatus(meeting);
            
            return (
              <Card key={meeting.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        {meeting.description && (
                          <p className="text-sm text-gray-600">{meeting.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(meeting.date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{meeting.time}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Mode</p>
                        <div className="flex items-center space-x-1">
                          {meeting.mode === 'online' ? (
                            <Video className="h-4 w-4 text-blue-500" />
                          ) : (
                            <MapPin className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium capitalize">{meeting.mode}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Organizer</p>
                        <p className="font-medium">{meeting.organizer}</p>
                      </div>
                    </div>

                    {meeting.mode === 'online' && meeting.link && (
                      <div className="mb-4">
                        <Button size="sm">
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                        </Button>
                      </div>
                    )}

                    {meeting.mode === 'in-person' && meeting.location && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{meeting.location}</span>
                      </div>
                    )}
                  </div>

                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {upcomingMeetings.length === 0 && (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Meetings</h3>
            <p className="text-gray-600">You don't have any meetings scheduled.</p>
          </Card>
        )}
      </motion.div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Meetings</h2>
          <div className="grid gap-4">
            {pastMeetings.map((meeting, index) => {
              const status = getMeetingStatus(meeting);
              
              return (
                <Card key={meeting.id} className="p-6 opacity-75">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                          {meeting.description && (
                            <p className="text-sm text-gray-600">{meeting.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="font-medium">{formatDate(meeting.date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium">{meeting.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Organizer</p>
                          <p className="font-medium">{meeting.organizer}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                      {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}