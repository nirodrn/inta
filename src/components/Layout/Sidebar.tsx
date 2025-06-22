import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Trophy,
  UserCheck,
  BookOpen,
  MessageSquare,
  Settings,
  ClipboardList,
  UserPlus,
  GraduationCap,
  FolderOpen,
  Star,
  UsersIcon,
  UserCog,
  Upload,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const navigationItems: Record<string, NavItem[]> = {
  admin: [
    { path: '/admin', label: 'Dashboard', icon: Home },
    { path: '/admin/pre-interns', label: 'Pre-Interns', icon: UserPlus },
    { path: '/admin/interviews', label: 'Interviews', icon: Calendar },
    { path: '/admin/interns', label: 'Interns', icon: GraduationCap },
    { path: '/admin/supervisors', label: 'Supervisors', icon: UserCheck },
    { path: '/admin/supervisor-assignment', label: 'Supervisor Assignment', icon: UserCog },
    { path: '/admin/groups', label: 'Groups', icon: Users },
    { path: '/admin/all-groups', label: 'All Groups', icon: UsersIcon },
    { path: '/admin/assignments', label: 'Assignments', icon: FileText },
    { path: '/admin/documents', label: 'Documents', icon: BookOpen },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { path: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  ],
  'pre-interview': [
    { path: '/pre-intern', label: 'Dashboard', icon: Home },
    { path: '/pre-intern/profile', label: 'Profile', icon: Settings },
  ],
  intern: [
    { path: '/intern', label: 'Dashboard', icon: Home },
    { path: '/intern/assignments', label: 'Assignments', icon: FileText },
    { path: '/intern/projects', label: 'Projects', icon: FolderOpen },
    { path: '/intern/reports', label: 'Report Submissions', icon: Upload },
    { path: '/intern/documents', label: 'Documents', icon: BookOpen },
    { path: '/intern/meetings', label: 'Meetings', icon: Calendar },
    { path: '/intern/group', label: 'My Group', icon: Users },
    { path: '/intern/progress', label: 'Progress', icon: BarChart3 },
    { path: '/intern/feedback', label: 'Feedback', icon: MessageSquare },
    //{ path: '/intern/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/intern/profile', label: 'Profile', icon: Settings },
  ],
  supervisor: [
    { path: '/supervisor', label: 'Dashboard', icon: Home },
    { path: '/supervisor/interns', label: 'My Interns', icon: Users },
    { path: '/supervisor/group-management', label: 'Group Management', icon: UsersIcon },
    { path: '/supervisor/project-assignment', label: 'Project Assignment', icon: FolderOpen },
    { path: '/supervisor/intern-grading', label: 'Intern Grading', icon: Star },
    { path: '/supervisor/assignments', label: 'Assignment Reviews', icon: ClipboardList },
    { path: '/supervisor/document-review', label: 'Document Review', icon: Eye },
    { path: '/supervisor/document-upload', label: 'Document Upload', icon: Upload },
    { path: '/supervisor/meetings', label: 'Meetings', icon: Calendar },
    { path: '/supervisor/reports', label: 'Reports', icon: BarChart3 },
    { path: '/supervisor/profile', label: 'Profile', icon: Settings },
  ],
};

export default function Sidebar() {
  const { currentUser } = useAuth();
  
  if (!currentUser?.role) return null;
  
  const navItems = navigationItems[currentUser.role] || [];

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="bg-white shadow-lg h-full w-64 fixed left-0 top-16 z-40 border-r border-gray-200"
    >
      <div className="p-4">
        <nav className="space-y-2">
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </div>
    </motion.div>
  );
}