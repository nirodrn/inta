import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, update, remove } from 'firebase/database';
import { BookOpen, Plus, Edit, Trash2, Search, Download, Eye, Lock, Globe, Users } from 'lucide-react';
import { database } from '../../config/firebase';
import { Document } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    accessLevel: 'all' as 'all' | 'interns' | 'supervisors',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const snapshot = await get(ref(database, 'documents'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const documentsList = Object.entries(data).map(([id, document]: [string, any]) => ({
          id,
          ...document,
        }));
        setDocuments(documentsList);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const documentData = {
        ...formData,
        uploadedBy: 'admin', // In a real app, this would be the current user's ID
        uploadedAt: editingDocument?.uploadedAt || new Date().toISOString(),
      };

      if (editingDocument) {
        await update(ref(database, `documents/${editingDocument.id}`), documentData);
        toast.success('Document updated successfully!');
      } else {
        await push(ref(database, 'documents'), documentData);
        toast.success('Document added successfully!');
      }

      resetForm();
      setShowModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      description: document.description || '',
      url: document.url,
      accessLevel: document.accessLevel,
    });
    setShowModal(true);
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await remove(ref(database, `documents/${documentId}`));
        toast.success('Document deleted successfully!');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      accessLevel: 'all',
    });
    setEditingDocument(null);
  };

  const getAccessLevelIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case 'all':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'interns':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'supervisors':
        return <Lock className="h-4 w-4 text-purple-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAccessLevelText = (accessLevel: string) => {
    switch (accessLevel) {
      case 'all':
        return 'Everyone';
      case 'interns':
        return 'Interns Only';
      case 'supervisors':
        return 'Supervisors Only';
      default:
        return 'Unknown';
    }
  };

  const filteredDocuments = documents.filter(document =>
    document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Manage company documents and resources</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </motion.div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Documents List */}
      <div className="grid gap-6">
        {filteredDocuments.map((document, index) => (
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
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
                      {document.description && (
                        <p className="text-sm text-gray-600">{document.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Access Level</p>
                      <div className="flex items-center space-x-2">
                        {getAccessLevelIcon(document.accessLevel)}
                        <span className="font-medium">{getAccessLevelText(document.accessLevel)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Uploaded</p>
                      <p className="font-medium">
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Actions</p>
                      <div className="flex items-center space-x-2">
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </a>
                        <a
                          href={document.url}
                          download
                          className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(document)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(document.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p>There are currently no documents available.</p>
          </div>
        </Card>
      )}

      {/* Document Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingDocument ? 'Edit Document' : 'Add Document'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
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
              placeholder="Brief description of the document..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/document.pdf"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Level *
            </label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as 'all' | 'interns' | 'supervisors' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="all">Everyone</option>
              <option value="interns">Interns Only</option>
              <option value="supervisors">Supervisors Only</option>
            </select>
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
              {editingDocument ? 'Update Document' : 'Add Document'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}