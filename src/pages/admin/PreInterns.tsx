import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update, remove } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Search, Filter, Calendar, UserCheck, Eye, Plus, Users } from 'lucide-react';
import { database, auth } from '../../config/firebase';
import { PreInterviewIntern } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function PreInterns() {
  const [preInterns, setPreInterns] = useState<PreInterviewIntern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntern, setSelectedIntern] = useState<PreInterviewIntern | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => {
    fetchPreInterns();
  }, []);

  const fetchPreInterns = async () => {
    try {
      const snapshot = await get(ref(database, 'preInterviewInterns'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const internsList = Object.entries(data).map(([uid, intern]: [string, any]) => ({
          uid,
          ...intern,
        }));
        setPreInterns(internsList);
      }
    } catch (error) {
      console.error('Error fetching pre-interns:', error);
      toast.error('Failed to fetch pre-interns');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = (intern: PreInterviewIntern) => {
    setSelectedIntern(intern);
    setShowInterviewModal(true);
  };

  const handleSelectIntern = async (intern: PreInterviewIntern) => {
    try {
      // Create Firebase Auth account for the intern with a default password
      const defaultPassword = 'intern123'; // In production, generate a secure password
      const userCredential = await createUserWithEmailAndPassword(auth, intern.email, defaultPassword);
      const newUid = userCredential.user.uid;

      // Create intern record in acceptedInterns
      const internData = {
        name: intern.name,
        email: intern.email,
        university: intern.university,
        gpa: intern.gpa,
        batch: intern.batch,
        interviewLanguage: intern.interviewLanguage,
        role: 'intern',
        createdAt: new Date().toISOString(),
        skills: [],
        weaknesses: [],
        phone: '',
        nickname: '',
      };

      const updates = {
        [`acceptedInterns/${newUid}`]: internData,
        [`preInterviewInterns/${intern.uid}/status`]: 'selected',
      };
      
      await update(ref(database), updates);
      toast.success(`Intern selected successfully! Login credentials - Email: ${intern.email}, Password: ${defaultPassword}`);
      fetchPreInterns();
    } catch (error) {
      console.error('Error selecting intern:', error);
      toast.error('Failed to select intern');
    }
  };

  const filteredInterns = preInterns.filter(intern =>
    intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.university.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Pre-Interview Interns</h1>
          <p className="text-gray-600">Manage intern applications and schedule interviews</p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Interns List */}
      <div className="grid gap-6">
        {filteredInterns.map((intern, index) => (
          <motion.div
            key={intern.uid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {intern.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{intern.name}</h3>
                      <p className="text-sm text-gray-600">{intern.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">University</p>
                      <p className="font-medium">{intern.university}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Batch</p>
                      <p className="font-medium">{intern.batch}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">GPA</p>
                      <p className="font-medium">{intern.gpa}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Language</p>
                      <p className="font-medium capitalize">{intern.interviewLanguage}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {intern.status === 'selected' ? (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Selected as Intern
                    </div>
                  ) : (
                    <>
                      {intern.interviewScheduled ? (
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Interview Scheduled
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleScheduleInterview(intern)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Interview
                        </Button>
                      )}
                      
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleSelectIntern(intern)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Select as Intern
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredInterns.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No pre-interns found</h3>
            <p>There are currently no pre-intern applications.</p>
          </div>
        </Card>
      )}

      {/* Interview Scheduling Modal */}
      <Modal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        title="Schedule Interview"
        size="lg"
      >
        <div className="space-y-4">
          <p>Schedule interview for: <strong>{selectedIntern?.name}</strong></p>
          <p className="text-sm text-gray-600">
            This will redirect you to the Interviews page where you can schedule the interview with full details.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowInterviewModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowInterviewModal(false);
              window.location.href = '/admin/interviews';
            }}>
              Go to Interviews
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}