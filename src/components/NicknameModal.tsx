import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Save } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import Button from './UI/Button';
import toast from 'react-hot-toast';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NicknameModal({ isOpen, onClose }: NicknameModalProps) {
  const { currentUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }

    if (!currentUser?.uid) return;

    setSubmitting(true);

    try {
      await update(ref(database, `acceptedInterns/${currentUser.uid}`), {
        nickname: nickname.trim(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Nickname saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving nickname:', error);
      toast.error('Failed to save nickname');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Welcome to Detz Global!</h3>
              <p className="text-sm opacity-90">Please choose a nickname</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Your Nickname *
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a nickname (e.g., Alex, Sam, etc.)"
                required
                disabled={submitting}
                autoComplete="off"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                This nickname will be displayed in group chats and leaderboards
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your nickname helps maintain privacy while allowing 
                easy identification in group activities. You can change it later in your profile.
              </p>
            </div>

            <Button
              type="submit"
              disabled={!nickname.trim() || submitting}
              className="w-full"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Nickname
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}