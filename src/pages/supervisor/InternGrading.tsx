import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update } from 'firebase/database';
import { Star, Search, GraduationCap, Award, TrendingUp, MessageSquare, Users, Edit, Save, X } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Intern } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

interface Grade {
  id: string;
  internId: string;
  supervisorId: string;
  assignmentId?: string;
  assignmentTitle?: string;
  grade: number;
  maxGrade: number;
  feedback: string;
  category: 'assignment' | 'project' | 'general' | 'behavior';
  createdAt: string;
}

export default function InternGrading() {
  const { currentUser } = useAuth();
  const [myInterns, setMyInterns] = useState<Intern[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingGrades, setEditingGrades] = useState<{ [key: string]: boolean }>({});
  const [tempGrades, setTempGrades] = useState<{ [key: string]: { grade: string; feedback: string } }>({});

  const [gradeData, setGradeData] = useState({
    assignmentTitle: '',
    grade: '',
    maxGrade: '100',
    feedback: '',
    category: 'assignment' as 'assignment' | 'project' | 'general' | 'behavior',
  });

  const [batchData, setBatchData] = useState({
    batch: '',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [groupsSnap, internsSnap, gradesSnap] = await Promise.all([
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'grades')),
      ]);

      // Get supervisor's interns
      let supervisorInterns: Intern[] = [];
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
                  groupName: group.name
                });
              }
            });
          }
        });
      }

      // Get grades given by this supervisor
      let supervisorGrades: Grade[] = [];
      if (gradesSnap.exists()) {
        const gradesData = gradesSnap.val();
        supervisorGrades = Object.entries(gradesData)
          .map(([id, grade]: [string, any]) => ({ id, ...grade }))
          .filter((grade: Grade) => grade.supervisorId === currentUser?.uid);
      }

      setMyInterns(supervisorInterns);
      setGrades(supervisorGrades);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeIntern = (intern: Intern) => {
    setSelectedIntern(intern);
    setShowGradeModal(true);
  };

  const handleAssignBatch = (intern: Intern) => {
    setSelectedIntern(intern);
    setBatchData({
      batch: (intern as any).batch || '',
    });
    setShowBatchModal(true);
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || !selectedIntern) return;
    
    if (!gradeData.grade || parseFloat(gradeData.grade) < 0 || parseFloat(gradeData.grade) > parseFloat(gradeData.maxGrade)) {
      toast.error(`Grade must be between 0 and ${gradeData.maxGrade}`);
      return;
    }

    if (!gradeData.feedback.trim()) {
      toast.error('Feedback is required');
      return;
    }

    setSubmitting(true);

    try {
      const grade = {
        internId: selectedIntern.uid,
        supervisorId: currentUser?.uid,
        supervisorName: currentUser?.name,
        assignmentTitle: gradeData.assignmentTitle.trim() || 'General Assessment',
        grade: parseFloat(gradeData.grade),
        maxGrade: parseFloat(gradeData.maxGrade),
        feedback: gradeData.feedback.trim(),
        category: gradeData.category,
        createdAt: new Date().toISOString(),
      };

      await push(ref(database, 'grades'), grade);
      
      toast.success('Grade submitted successfully!');
      setShowGradeModal(false);
      setGradeData({
        assignmentTitle: '',
        grade: '',
        maxGrade: '100',
        feedback: '',
        category: 'assignment',
      });
      setSelectedIntern(null);
      fetchData();
    } catch (error) {
      console.error('Error submitting grade:', error);
      toast.error('Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || !selectedIntern) return;
    
    if (!batchData.batch.trim()) {
      toast.error('Batch is required');
      return;
    }

    setSubmitting(true);

    try {
      await update(ref(database, `acceptedInterns/${selectedIntern.uid}`), {
        batch: batchData.batch.trim(),
        updatedAt: new Date().toISOString(),
      });
      
      toast.success('Batch assigned successfully!');
      setShowBatchModal(false);
      setBatchData({ batch: '' });
      setSelectedIntern(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning batch:', error);
      toast.error('Failed to assign batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlineEdit = (internId: string) => {
    const internGrades = getInternGrades(internId);
    const latestGrade = internGrades[0]; // Get most recent grade
    
    setTempGrades({
      ...tempGrades,
      [internId]: {
        grade: latestGrade ? latestGrade.grade.toString() : '',
        feedback: latestGrade ? latestGrade.feedback : ''
      }
    });
    setEditingGrades({ ...editingGrades, [internId]: true });
  };

  const handleSaveInlineEdit = async (internId: string) => {
    const tempData = tempGrades[internId];
    if (!tempData || !tempData.grade || !tempData.feedback.trim()) {
      toast.error('Grade and feedback are required');
      return;
    }

    try {
      const gradeData = {
        internId,
        supervisorId: currentUser?.uid,
        supervisorName: currentUser?.name,
        assignmentTitle: 'Quick Grade Update',
        grade: parseFloat(tempData.grade),
        maxGrade: 100,
        feedback: tempData.feedback.trim(),
        category: 'general',
        createdAt: new Date().toISOString(),
      };

      await push(ref(database, 'grades'), gradeData);
      
      setEditingGrades({ ...editingGrades, [internId]: false });
      setTempGrades({ ...tempGrades, [internId]: { grade: '', feedback: '' } });
      toast.success('Grade updated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error updating grade:', error);
      toast.error('Failed to update grade');
    }
  };

  const handleCancelInlineEdit = (internId: string) => {
    setEditingGrades({ ...editingGrades, [internId]: false });
    setTempGrades({ ...tempGrades, [internId]: { grade: '', feedback: '' } });
  };

  const getInternGrades = (internId: string) => {
    return grades.filter(grade => grade.internId === internId);
  };

  const getInternAverageGrade = (internId: string) => {
    const internGrades = getInternGrades(internId);
    if (internGrades.length === 0) return 0;
    
    const totalScore = internGrades.reduce((sum, grade) => sum + (grade.grade / grade.maxGrade) * 100, 0);
    return Math.round(totalScore / internGrades.length);
  };

  const filteredInterns = myInterns.filter(intern =>
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
          <h1 className="text-3xl font-bold text-gray-900">Intern Grading</h1>
          <p className="text-gray-600">Grade and evaluate your interns' performance</p>
        </div>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Interns List */}
      <div className="grid gap-6">
        {filteredInterns.map((intern, index) => {
          const internGrades = getInternGrades(intern.uid);
          const averageGrade = getInternAverageGrade(intern.uid);
          
          return (
            <motion.div
              key={intern.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{intern.name}</h3>
                        {intern.nickname && (
                          <p className="text-sm text-gray-600">"{intern.nickname}"</p>
                        )}
                        <p className="text-sm text-gray-600">{(intern as any).groupName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">University</p>
                        <p className="font-medium">{intern.university}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">GPA</p>
                        <p className="font-medium">{intern.gpa}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Average Grade</p>
                        <div className="flex items-center space-x-2">
                          <Award className={`h-4 w-4 ${averageGrade >= 80 ? 'text-green-500' : averageGrade >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
                          <span className={`font-medium ${averageGrade >= 80 ? 'text-green-600' : averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {averageGrade}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Grades</p>
                        <p className="font-medium">{internGrades.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Batch</p>
                        <p className="font-medium">{(intern as any).batch || 'Not assigned'}</p>
                      </div>
                    </div>

                    {/* Recent Grades */}
                    {internGrades.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Recent Grades</p>
                        <div className="space-y-2">
                          {internGrades.slice(0, 2).map(grade => (
                            <div key={grade.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium">{grade.assignmentTitle}</p>
                                <p className="text-xs text-gray-500 capitalize">{grade.category}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{grade.grade}/{grade.maxGrade}</p>
                                <p className="text-xs text-gray-500">
                                  {Math.round((grade.grade / grade.maxGrade) * 100)}%
                                </p>
                              </div>
                            </div>
                          ))}
                          {internGrades.length > 2 && (
                            <p className="text-xs text-gray-500">+{internGrades.length - 2} more grades</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleAssignBatch(intern)}
                      disabled={submitting}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Batch
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleGradeIntern(intern)}
                      disabled={submitting}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Grade
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredInterns.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No interns found</h3>
            <p>You don't have any interns assigned to you yet.</p>
          </div>
        </Card>
      )}

      {/* Interns Grading Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Grade Management</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latest Feedback
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInterns.map((intern) => {
                  const internGrades = getInternGrades(intern.uid);
                  const averageGrade = getInternAverageGrade(intern.uid);
                  const latestGrade = internGrades[0];
                  const isEditing = editingGrades[intern.uid];
                  const tempData = tempGrades[intern.uid];
                  
                  return (
                    <tr key={intern.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                            <div className="text-sm text-gray-500">
                              {intern.nickname ? `"${intern.nickname}"` : 'No nickname'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {intern.university}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={tempData?.grade || ''}
                            onChange={(e) => setTempGrades({
                              ...tempGrades,
                              [intern.uid]: { ...tempData, grade: e.target.value }
                            })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Grade"
                          />
                        ) : (
                          <div className="flex items-center">
                            <Award className={`h-4 w-4 mr-2 ${averageGrade >= 80 ? 'text-green-500' : averageGrade >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
                            <span className={`font-medium ${averageGrade >= 80 ? 'text-green-600' : averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {averageGrade}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <textarea
                            value={tempData?.feedback || ''}
                            onChange={(e) => setTempGrades({
                              ...tempGrades,
                              [intern.uid]: { ...tempData, feedback: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            rows={2}
                            placeholder="Feedback"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {latestGrade?.feedback || 'No feedback yet'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveInlineEdit(intern.uid)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelInlineEdit(intern.uid)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInlineEdit(intern.uid)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Grade Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => {
          if (!submitting) {
            setShowGradeModal(false);
            setSelectedIntern(null);
            setGradeData({
              assignmentTitle: '',
              grade: '',
              maxGrade: '100',
              feedback: '',
              category: 'assignment',
            });
          }
        }}
        title={`Grade ${selectedIntern?.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmitGrade} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment/Project Title
            </label>
            <input
              type="text"
              value={gradeData.assignmentTitle}
              onChange={(e) => setGradeData({ ...gradeData, assignmentTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter assignment or project title"
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={gradeData.category}
              onChange={(e) => setGradeData({ ...gradeData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            >
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="general">General Performance</option>
              <option value="behavior">Behavior & Attitude</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade *
              </label>
              <input
                type="number"
                min="0"
                max={gradeData.maxGrade}
                step="0.1"
                value={gradeData.grade}
                onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter grade"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Grade *
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={gradeData.maxGrade}
                onChange={(e) => setGradeData({ ...gradeData, maxGrade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max grade"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {gradeData.grade && gradeData.maxGrade && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Percentage: {Math.round((parseFloat(gradeData.grade) / parseFloat(gradeData.maxGrade)) * 100)}%
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback *
            </label>
            <textarea
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Provide detailed feedback on performance..."
              required
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!submitting) {
                  setShowGradeModal(false);
                  setSelectedIntern(null);
                  setGradeData({
                    assignmentTitle: '',
                    grade: '',
                    maxGrade: '100',
                    feedback: '',
                    category: 'assignment',
                  });
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Grade'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Batch Assignment Modal */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => {
          if (!submitting) {
            setShowBatchModal(false);
            setSelectedIntern(null);
            setBatchData({ batch: '' });
          }
        }}
        title={`Assign Batch to ${selectedIntern?.name}`}
        size="md"
      >
        <form onSubmit={handleSubmitBatch} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Intern Details</h4>
            <p className="text-sm text-blue-800">Name: {selectedIntern?.name}</p>
            <p className="text-sm text-blue-800">University: {selectedIntern?.university}</p>
            <p className="text-sm text-blue-800">Current Batch: {(selectedIntern as any)?.batch || 'Not assigned'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch *
            </label>
            <input
              type="text"
              value={batchData.batch}
              onChange={(e) => setBatchData({ ...batchData, batch: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 2024-A, Batch 15, etc."
              required
              disabled={submitting}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used for batch-wise leaderboards and grouping
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!submitting) {
                  setShowBatchModal(false);
                  setSelectedIntern(null);
                  setBatchData({ batch: '' });
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Batch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}