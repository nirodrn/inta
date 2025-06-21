import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { Calendar, Plus, Edit, Trash2, Video, MapPin, Users, Clock } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  mode: 'online' | 'in-person';
  location?: string;
  link?: string;
  attendees: string[];
  organizer: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function SupervisorMeetings() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [myInterns, setMyInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    mode: 'online' as 'online' | 'in-person',
    location: '',
    link: '',
    attendees: [] as string[],
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [meetingsSnap, groupsSnap, internsSnap] = await Promise.all([
        get(ref(database, 'meetings')),
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
      ]);

      // Get meetings organized by current user
      let meetingsList: Meeting[] = [];
      if (meetingsSnap.exists()) {
        const meetingsData = meetingsSnap.val();
        meetingsList = Object.entries(meetingsData)
          .map(([id, meeting]: [string, any]) => ({ id, ...meeting }))
          .filter((meeting: Meeting) => meeting.organizer === currentUser?.uid)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      // Get supervisor's interns
      let supervisorInterns: any[] = [];
      if (groupsSnap.exists() && internsSnap.exists()) {
        const groups = groupsSnap.val();
        const internsData = internsSnap.val();

        Object.values(groups).forEach((group: any) => {
          if (group.supervisorId === currentUser?.uid) {
            group.internIds?.forEach((internId: string) => {
              const internData = internsData[internId];
              if (internData) {
                supervisorInterns.push({
                  uid: internId,
                  ...internData,
                });
              }
            });
          }
        });
      }

      setMeetings(meetingsList);
      setMyInterns(supervisorInterns);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const meetingData = {
        ...formData,
        organizer: currentUser?.uid,
        status: 'scheduled',
        createdAt: editingMeeting?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingMeeting) {
        await update(ref(database, `meetings/${editingMeeting.id}`), meetingData);
        toast.success('Meeting updated successfully!');
      } else {
        await push(ref(database, 'meetings'), meetingData);
        toast.success('Meeting scheduled successfully!');
      }

      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error('Failed to save meeting');
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date,
      time: meeting.time,
      mode: meeting.mode,
      location: meeting.location || '',
      link: meeting.link || '',
      attendees: meeting.attendees,
    });
    setShowModal(true);
  };

  const handleDelete = async (meetingId: string) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await remove(ref(database, `meetings/${meetingId}`));
        toast.success('Meeting deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting meeting:', error);
        toast.error('Failed to delete meeting');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      mode: 'online',
      location: '',
      link: '',
      attendees: [],
    });
    setEditingMeeting(null);
  };

  const handleAttendeeToggle = (internId: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(internId)
        ? prev.attendees.filter(id => id !== internId)
        : [...prev.attendees, internId]
    }));
  };

  const getInternName = (internId: string) => {
    const intern = myInterns.find(i => i.uid === internId);
    return intern?.name || 'Unknown Intern';
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
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage meetings with your interns</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </motion.div>

      {/* Upcoming Meetings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upcoming Meetings ({upcomingMeetings.length})
        </h2>
        <div className="grid gap-4">
          {upcomingMeetings.map((meeting, index) => (
            <Card key={meeting.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
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
                      <p className="font-medium">{new Date(meeting.date).toLocaleDateString()}</p>
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
                      <p className="text-xs text-gray-500">Attendees</p>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{meeting.attendees.length}</span>
                      </div>
                    </div>
                  </div>

                  {meeting.attendees.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Attendees</p>
                      <div className="flex flex-wrap gap-2">
                        {meeting.attendees.slice(0, 3).map(internId => (
                          <span
                            key={internId}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {getInternName(internId)}
                          </span>
                        ))}
                        {meeting.attendees.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{meeting.attendees.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(meeting)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(meeting.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {upcomingMeetings.length === 0 && (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Meetings</h3>
            <p className="text-gray-600">Schedule a meeting with your interns to get started.</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Past Meetings ({pastMeetings.length})
          </h2>
          <div className="grid gap-4">
            {pastMeetings.slice(0, 5).map((meeting, index) => (
              <Card key={meeting.id} className="p-6 opacity-75">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
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
                        <p className="font-medium">{new Date(meeting.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-medium">{meeting.time}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Attendees</p>
                        <p className="font-medium">{meeting.attendees.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Meeting Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Mode *
            </label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'online' | 'in-person' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="online">Online</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>

          {formData.mode === 'online' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://zoom.us/j/..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Office address or meeting room"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Attendees
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
              {myInterns.map(intern => (
                <label key={intern.uid} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(intern.uid)}
                    onChange={() => handleAttendeeToggle(intern.uid)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{intern.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}