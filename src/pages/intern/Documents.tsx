import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { FileText, Download, Eye, Calendar, User, Users } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

interface SupervisorDocument {
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
  supervisorName?: string;
  uploadedAt: string;
}

export default function InternDocuments() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<SupervisorDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDocuments();
    }
  }, [currentUser]);

  const fetchDocuments = async () => {
    try {
      const [documentsSnap, groupsSnap, supervisorsSnap] = await Promise.all([
        get(ref(database, 'supervisorDocuments')),
        get(ref(database, 'groups')),
        get(ref(database, 'supervisors')),
      ]);

      let userDocuments: SupervisorDocument[] = [];

      if (documentsSnap.exists()) {
        const documentsData = documentsSnap.val();
        const supervisorsData = supervisorsSnap.exists() ? supervisorsSnap.val() : {};
        const groupsData = groupsSnap.exists() ? groupsSnap.val() : {};

        // Find user's group(s)
        const userGroups = Object.entries(groupsData).filter(([id, group]: [string, any]) => 
          group.internIds?.includes(currentUser?.uid)
        );

        Object.entries(documentsData).forEach(([id, document]: [string, any]) => {
          let isVisible = false;

          if (document.targetType === 'all') {
            // Check if document is from user's supervisor
            const userGroup = userGroups.find(([groupId, group]: [string, any]) => 
              group.supervisorId === document.uploadedBy
            );
            isVisible = !!userGroup;
          } else if (document.targetType === 'individual') {
            // Check if directly assigned to this intern
            isVisible = document.targetIds?.includes(currentUser?.uid);
          } else if (document.targetType === 'group') {
            // Check if assigned to any of the user's groups
            isVisible = userGroups.some(([groupId]) => 
              document.targetIds?.includes(groupId)
            );
          }

          if (isVisible) {
            // Get supervisor name
            const supervisor = supervisorsData[document.uploadedBy];
            const supervisorName = supervisor?.name || 'Unknown Supervisor';

            userDocuments.push({
              id,
              ...document,
              supervisorName,
            });
          }
        });
      }

      // Sort by upload date (newest first) - already correct
      userDocuments.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      setDocuments(userDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case 'individual':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'group':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const getTargetTypeText = (targetType: string) => {
    switch (targetType) {
      case 'individual':
        return 'Individual';
      case 'group':
        return 'Group';
      default:
        return 'All Interns';
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">View assignments and documents from your supervisors</p>
        </div>
      </motion.div>

      {/* Documents Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{documents.length}</div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {documents.filter(d => d.fileType.includes('pdf')).length}
          </div>
          <div className="text-sm text-gray-600">PDF Documents</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {documents.filter(d => !d.fileType.includes('pdf')).length}
          </div>
          <div className="text-sm text-gray-600">Word Documents</div>
        </Card>
      </div>

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
                      <p className="text-sm text-gray-600">From {document.supervisorName}</p>
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
                      <p className="text-xs text-gray-500">File Type</p>
                      <p className="font-medium">
                        {document.fileType.includes('pdf') ? 'PDF Document' : 'Word Document'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Size</p>
                      <p className="font-medium">{formatFileSize(document.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Target</p>
                      <div className="flex items-center space-x-2">
                        {getTargetTypeIcon(document.targetType)}
                        <span className="font-medium">{getTargetTypeText(document.targetType)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{document.description}</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    File: {document.fileName}
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
                  {/* 
                  <Button 
                    id="downloadBtn"
                    variant="primary" 
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = document.fileUrl;
                      link.download = document.fileName;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  */}
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
            <h3 className="text-lg font-medium">No documents available</h3>
            <p>Your supervisors haven't uploaded any documents yet.</p>
          </div>
        </Card>
      )}
    </div>
  );
}