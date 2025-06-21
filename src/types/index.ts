export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'pre-interview' | 'intern' | 'supervisor';
  createdAt: string;
  updatedAt?: string;
}

export interface PreInterviewIntern {
  uid: string;
  name: string;
  email: string;
  confirmEmail: string;
  university: string;
  batch: string;
  gpa: number;
  interviewLanguage: 'english' | 'sinhala';
  role: 'pre-interview';
  createdAt: string;
  updatedAt?: string;
  interviewScheduled?: boolean;
  interviewDate?: string;
  interviewTime?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  date: string;
  time: string;
  mode: 'online' | 'in-person';
  location?: string;
  link?: string;
  interviewer: string;
  type: 'technical' | 'hr' | 'final';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Intern {
  uid: string;
  name: string;
  nickname?: string;
  email: string;
  phone?: string;
  university: string;
  gpa: number;
  role: 'intern';
  groupId?: string;
  supervisorId?: string;
  skills?: string[];
  weaknesses?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Supervisor {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  notes?: string;
  role: 'supervisor';
  createdAt: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  fileUrl?: string;
  targetAudience: 'individual' | 'group' | 'all';
  targetIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  internId: string;
  type: 'file' | 'github';
  url: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  supervisorId: string;
  internIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  url: string;
  accessLevel: 'all' | 'interns' | 'supervisors';
  uploadedBy: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt?: string;
}

export interface LeaderboardEntry {
  internId: string;
  name: string;
  nickname?: string;
  score: number;
  completedTasks: number;
  averageGrade: number;
  githubUrl?: string;
  skills: string[];
}