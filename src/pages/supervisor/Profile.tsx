import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update } from 'firebase/database';
import { User, Mail, Phone, Building, Edit, Save, X } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Supervisor } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

export default function SupervisorProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    notes: '',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const snapshot = await get(ref(database, `supervisors/${currentUser?.uid}`));
      if (snapshot.exists()) {
        const profileData = snapshot.val();
        setProfile({ uid: currentUser?.uid || '', ...profileData });
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          department: profileData.department || '',
          notes: profileData.notes || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updatedData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      await update(ref(database, `supervisors/${currentUser?.uid}`), updatedData);
      
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        notes: profile.notes || '',
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your profile information</p>
        </motion.div>

        <Card className="p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600">Your profile information could not be loaded.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your profile information</p>
        </div>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </motion.div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  />
                ) : (
                  profile.name
                )}
              </h2>
              {(profile.department || editing) && (
                <p className="text-gray-600">
                  {editing ? (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                      placeholder="Department"
                    />
                  ) : (
                    profile.department
                  )}
                </p>
              )}
              <p className="text-sm text-gray-500">Supervisor</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Department
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.department || 'Not specified'}</p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Notes</h3>
          {editing ? (
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Additional notes about yourself..."
            />
          ) : (
            <p className="text-gray-700">
              {profile.notes || 'No additional notes provided.'}
            </p>
          )}
        </Card>
      </motion.div>

      {/* Account Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Created
              </label>
              <p className="text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Updated
              </label>
              <p className="text-gray-900">
                {profile.updatedAt 
                  ? new Date(profile.updatedAt).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}