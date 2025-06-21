import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update } from 'firebase/database';
import { User, Mail, Phone, GraduationCap, Edit, Save, X, Award } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Intern } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

export default function InternProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<Intern | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    university: '',
    gpa: '',
    skills: '',
    weaknesses: '',
    batch: '',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const snapshot = await get(ref(database, `acceptedInterns/${currentUser?.uid}`));
      if (snapshot.exists()) {
        const profileData = snapshot.val();
        setProfile({ uid: currentUser?.uid || '', ...profileData });
        setFormData({
          name: profileData.name || '',
          nickname: profileData.nickname || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          university: profileData.university || '',
          gpa: profileData.gpa?.toString() || '',
          skills: profileData.skills?.join(', ') || '',
          weaknesses: profileData.weaknesses?.join(', ') || '',
          batch: profileData.batch || '',
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
        gpa: parseFloat(formData.gpa),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        weaknesses: formData.weaknesses.split(',').map(s => s.trim()).filter(s => s),
        updatedAt: new Date().toISOString(),
      };

      await update(ref(database, `acceptedInterns/${currentUser?.uid}`), updatedData);
      
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
        nickname: profile.nickname || '',
        email: profile.email || '',
        phone: profile.phone || '',
        university: profile.university || '',
        gpa: profile.gpa?.toString() || '',
        skills: profile.skills?.join(', ') || '',
        weaknesses: profile.weaknesses?.join(', ') || '',
        batch: (profile as any).batch || '',
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
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {(profile.nickname || profile.name).charAt(0).toUpperCase()}
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
              <p className="text-gray-600">
                "{editing ? (
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder="Nickname"
                  />
                ) : (
                  profile.nickname || 'No nickname set'
                )}"
              </p>
              <p className="text-sm text-gray-500">Intern</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <GraduationCap className="h-4 w-4 inline mr-2" />
                University
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.university}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="h-4 w-4 inline mr-2" />
                Grade
              </label>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.gpa}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2024-A, Batch 15, etc."
                />
              ) : (
                <p className="text-gray-900">{(profile as any).batch || 'Not assigned'}</p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Skills and Development */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills & Development</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              {editing ? (
                <textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter skills separated by commas (e.g., React, Node.js, Python)"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills listed</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas for Improvement
              </label>
              {editing ? (
                <textarea
                  value={formData.weaknesses}
                  onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter areas for improvement separated by commas"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.weaknesses && profile.weaknesses.length > 0 ? (
                    profile.weaknesses.map((weakness, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                      >
                        {weakness}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No areas for improvement listed</p>
                  )}
                </div>
              )}
            </div>
          </div>
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