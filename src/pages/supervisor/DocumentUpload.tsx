import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, FileText, Users, User, Download, Eye, Calendar } from 'lucide-react';
import { database, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Intern, Group } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

interface UploadedDocument {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  targetType: 'individual' | 'group' | 'all';
  targetIds: string[];
  uploadedBy: string;
  uploadedAt: string;
}

export default function DocumentUpload() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [myInterns, setMyInterns] = useState<Intern[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetType: 'all' as 'individual' | 'group' | 'all',
    targetIds: [] as string[],
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [documentsSnap, groupsSnap, internsSnap] = await Promise.all([
        get(ref(database, 'supervisorDocuments')),
        get(ref(database, 'groups')),
        get(ref(database, 'acceptedInterns')),
      ]);

      // Get documents uploaded by this supervisor
      let supervisorDocuments: UploadedDocument[] = [];
      if (documentsSnap.exists()) {
        const documentsData = documentsSnap.val();
        supervisorDocuments = Object.entries(documentsData)
          .map(([id, doc]: [string, any]) => ({ id, ...doc }))
          .filter((doc: UploadedDocument) => doc.uploadedBy === currentUser?.uid)
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      }

      // Get groups supervised by current user
      let supervisorGroups: Group[] = [];
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        supervisorGroups = Object.entries(groupsData)
          .map(([id, group]: [string, any]) => ({ id, ...group }))
          .filter((group: Group) => group.supervisorId === currentUser?.uid);
      }

      // Get supervisor's interns
      let supervisorInterns: Intern[] = [];
      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        supervisorGroups.forEach(group => {
          group.internIds?.forEach(internId => {
            const internData = internsData[internId];
            if (internData) {
              supervisorInterns.push({
                uid: internId,
                ...internData,
                groupName: group.name
              });
            }
          });
        });
      }

      setDocuments(supervisorDocuments);
      setMyGroups(supervisorGroups);
      setMyInterns(supervisorInterns);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a PDF or Word document');
        return;
      }

      // Validate file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File size must be less than 25MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (formData.targetType !== 'all' && formData.targetIds.length === 0) {
      toast.error('Please select at least one target');
      return;
    }

    setUploading(true);

    try {
      // Upload file to Firebase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const fileRef = storageRef(storage, `supervisor-documents/${currentUser?.uid}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save document to database
      const documentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        fileName: selectedFile.name,
        fileUrl: downloadURL,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        targetType: formData.targetType,
        targetIds: formData.targetType === 'all' ? [] : formData.targetIds,
        uploadedBy: currentUser?.uid,
        uploadedAt: new Date().toISOString(),
      };

      await push(ref(database, 'supervisorDocuments'), documentData);
      
      toast.success('Document uploaded successfully!');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetType: 'all',
      targetIds: [],
    });
    setSelectedFile(null);
  };

  const handleTargetToggle = (targetId: string) => {
    setFormData(prev => ({
      ...prev,
      targetIds: prev.targetIds.includes(targetId)
        ? prev.targetIds.filter(id => id !== targetId)
        : [...prev.targetIds, targetId]
    }));
  };

  const getTargetDisplay = (document: UploadedDocument) => {
    if (document.targetType === 'all') {
      return 'All Interns';
    } else if (document.targetType === 'group') {
      const groupNames = document.targetIds.map(id => {
        const group = myGroups.find(g => g.id === id);
        return group?.name || 'Unknown Group';
      }).join(', ');
      return `Groups: ${groupNames}`;
    } else {
      const internNames = document.targetIds.map(id => {
        const intern = myInterns.find(i => i.uid === id);
        return intern?.name || 'Unknown Intern';
      }).join(', ');
      return `Interns: ${internNames}`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Upload</h1>
          <p className="text-gray-600">Upload assignments and project documents for your interns</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </motion.div>

      {/* Upload Guidelines */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Document Upload Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800">
          <div>
            <h4 className="font-semibold mb-2">📄 Supported Formats</h4>
            <ul className="text-sm space-y-1">
              <li>• PDF documents (.pdf)</li>
              <li>• Microsoft Word (.doc, .docx)</li>
              <li>• Maximum file size: 25MB</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🎯 Target Options</h4>
            <ul className="text-sm space-y-1">
              <li>• All Interns: Visible to all your interns</li>
              <li>• Specific Groups: Visible to selected groups</li>
              <li>• Individual Interns: Visible to selected interns</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      <div className="grid gap-6">
        {documents.map((document, index) => (
          <motion.div
            key={document.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
                      <p className="text-sm text-gray-600">{document.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Uploaded</p>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">File</p>
                      <p className="font-medium text-sm">{document.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="font-medium">
                        {document.fileType.includes('pdf') ? 'PDF' : 'Word Document'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Target</p>
                      <div className="flex items-center space-x-2">
                        {document.targetType === 'individual' ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : document.targetType === 'group' ? (
                          <Users className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Users className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-medium capitalize">{document.targetType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                    <p className="text-sm font-medium">{getTargetDisplay(document)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => window.open(document.fileUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = document.fileUrl;
                      link.download = document.fileName;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {documents.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No documents uploaded</h3>
            <p>Upload your first document to share with your interns.</p>
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!uploading) {
            setShowModal(false);
            resetForm();
          }
        }}
        title="Upload Document"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Assignment 1 - React Fundamentals"
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description of the document content and requirements..."
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <select
              value={formData.targetType}
              onChange={(e) => setFormData({ 
                ...formData, 
                targetType: e.target.value as 'individual' | 'group' | 'all',
                targetIds: []
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={uploading}
            >
              <option value="all">All My Interns</option>
              <option value="group">Specific Groups</option>
              <option value="individual">Individual Interns</option>
            </select>
          </div>

          {formData.targetType === 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Groups *
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {myGroups.map(group => (
                  <label key={group.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetIds.includes(group.id)}
                      onChange={() => handleTargetToggle(group.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={uploading}
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
                {myGroups.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No groups available
                  </p>
                )}
              </div>
            </div>
          )}

          {formData.targetType === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Interns *
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {myInterns.map(intern => (
                  <label key={intern.uid} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetIds.includes(intern.uid)}
                      onChange={() => handleTargetToggle(intern.uid)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={uploading}
                    />
                    <span className="text-sm">{intern.name}</span>
                  </label>
                ))}
                {myInterns.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No interns available
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, DOC, DOCX (Max size: 25MB)
            </p>
            {selectedFile && (
              <div className="mt-2 p-2 bg-blue-50 rounded border">
                <p className="text-sm text-blue-800">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!uploading) {
                  setShowModal(false);
                  resetForm();
                }
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}