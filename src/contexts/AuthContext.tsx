import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user data immediately after login
      const userData = await fetchUserData(user.uid);
      if (userData) {
        setCurrentUser(userData);
        toast.success(`Welcome back, ${userData.name}!`);
      } else {
        toast.error('User profile not found. Please contact administrator.');
        await signOut(auth);
        throw new Error('User profile not found');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed: ' + (error.message || 'Unknown error'));
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      toast.success('Successfully logged out!');
    } catch (error: any) {
      toast.error('Logout failed: ' + error.message);
      throw error;
    }
  }

  async function fetchUserData(uid: string): Promise<User | null> {
    try {
      console.log('Fetching user data for UID:', uid);
      
      // Check in admin collection first
      const adminRef = ref(database, `admin/${uid}`);
      const adminSnapshot = await get(adminRef);
      if (adminSnapshot.exists()) {
        const adminData = adminSnapshot.val();
        console.log('Found admin user:', adminData);
        return { 
          uid, 
          role: 'admin',
          ...adminData 
        };
      }

      // Check in preInterviewInterns collection
      const preInterviewRef = ref(database, `preInterviewInterns/${uid}`);
      const preInterviewSnapshot = await get(preInterviewRef);
      if (preInterviewSnapshot.exists()) {
        const preInterviewData = preInterviewSnapshot.val();
        console.log('Found pre-interview user:', preInterviewData);
        return { 
          uid, 
          role: 'pre-interview',
          ...preInterviewData 
        };
      }

      // Check in acceptedInterns collection
      const internRef = ref(database, `acceptedInterns/${uid}`);
      const internSnapshot = await get(internRef);
      if (internSnapshot.exists()) {
        const internData = internSnapshot.val();
        console.log('Found intern user:', internData);
        return { 
          uid, 
          role: 'intern', 
          ...internData 
        };
      }

      // Check in supervisors collection
      const supervisorRef = ref(database, `supervisors/${uid}`);
      const supervisorSnapshot = await get(supervisorRef);
      if (supervisorSnapshot.exists()) {
        const supervisorData = supervisorSnapshot.val();
        console.log('Found supervisor user:', supervisorData);
        return { 
          uid, 
          role: 'supervisor', 
          ...supervisorData 
        };
      }

      console.log('No user data found for UID:', uid);
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setFirebaseUser(user);
      
      if (user) {
        const userData = await fetchUserData(user.uid);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    firebaseUser,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}