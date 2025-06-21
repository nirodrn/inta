import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { Calendar, Clock, Video, MapPin, User, Plus, Edit, Trash2, Search } from 'lucide-react';
import { database } from '../../config/firebase';
import { Interview, PreInterviewIntern } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function Interviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [preInterns, setPreInterns] = useState<PreInterviewIntern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    candidateId: '',
    date: '',
    time: '',
    mode: 'online' as 'online' | 'in-person',
    location: '',
    link: '',
    interviewer: '',
    type: 'technical' as 'technical' | 'hr' | 'final',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [interviewsSnap, preInternsSnap] = await Promise.all([
        get(ref(database, 'interviews')),
        get(ref(database, 'preInterviewInterns')),
      ]);

      if (interviewsSnap.exists()) {
        const interviewsData = interviewsSnap.val();
        const interviewsList = Object.entries(interviewsData).map(([id, interview]: [string, any]) => ({
          id,
          ...interview,
        }));
        setInterviews(interviewsList);
      }

      if (preInternsSnap.exists()) {
        const preInternsData = preInternsSnap.val();
        const preInternsList = Object.entries(preInternsData).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
        setPreInterns(preInternsList);
      }
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
      const interviewData = {
        ...formData,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      if (editingInterview) {
        await update(ref(database, `interviews/${editingInterview.id}`), interviewData);
        toast.success('Interview updated successfully!');
      } else {
        await push(ref(database, 'interviews'), interviewData);
        toast.success('Interview scheduled successfully!');
      }

      // Update pre-intern status
      await update(ref(database, `preInterviewInterns/${formData.candidateId}`), {
        interviewScheduled: true,
        interviewDate: formData.date,
        interviewTime: formData.time,
      });

      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving interview:', error);
      toast.error('Failed to save interview');
    }
  };

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setFormData({
      candidateId: interview.candidateId,
      date: interview.date,
      time: interview.time,
      mode: interview.mode,
      location: interview.location || '',
      link: interview.link || '',
      interviewer: interview.interviewer,
      type: interview.type,
      notes: interview.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (interviewId: string) => {
    if (window.confirm('Are you sure you want to delete this interview?')) {
      try {
        await remove(ref(database, `interviews/${interviewId}`));
        toast.success('Interview deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting interview:', error);
        toast.error('Failed to delete interview');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      candidateId: '',
      date: '',
      time: '',
      mode: 'online',
      location: '',
      link: '',
      interviewer: '',
      type: 'technical',
      notes: '',
    });
    setEditingInterview(null);
  };

  const getCandidateName = (candidateId: string) => {
    const candidate = preInterns.find(intern => intern.uid === candidateId);
    return candidate?.name || 'Unknown Candidate';
  };

  const filteredInterviews = interviews.filter(interview =>
    getCandidateName(interview.candidateId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.interviewer.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
          <p className="text-gray-600">Schedule and manage candidate interviews</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by candidate name or interviewer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Interviews List */}
      <div className="grid gap-6">
        {filteredInterviews.map((interview, index) => (
          <motion.div
            key={interview.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getCandidateName(interview.candidateId)}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">{interview.type} Interview</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">{new Date(interview.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium">{interview.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mode</p>
                      <p className="font-medium capitalize">{interview.mode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Interviewer</p>
                      <p className="font-medium">{interview.interviewer}</p>
                    </div>
                  </div>

                  {interview.notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{interview.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(interview)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(interview.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Interview Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingInterview ? 'Edit Interview' : 'Schedule Interview'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate
            </label>
            <select
              value={formData.candidateId}
              onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Candidate</option>
              {preInterns.map(intern => (
                <option key={intern.uid} value={intern.uid}>
                  {intern.name} - {intern.university}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
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
                Time
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'technical' | 'hr' | 'final' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="technical">Technical</option>
                <option value="hr">HR</option>
                <option value="final">Final</option>
              </select>
            </div>
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
              Interviewer
            </label>
            <input
              type="text"
              value={formData.interviewer}
              onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Interviewer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes for the candidate..."
            />
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
              {editingInterview ? 'Update Interview' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}