import React, { useState, useRef, useEffect } from 'react';
import { useBarangay, areNamesMatching } from '../context/BarangayContext';
import { SystemUser, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseService';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { UserProfilePhotoModal } from '../components/UserProfilePhotoModal';
import { ResidentApprovalModal } from '../components/ResidentApprovalModal';
import { RecentSearchesInput } from '../components/RecentSearchesInput';
import { compressImageFile, AVATAR_PRESETS } from '../utils/imageUtils';
import { InfoButton } from '../components/InfoButton';
import { PHILIPPINE_RELIGIONS, CITIZENSHIP_OPTIONS, BLOOD_TYPES } from '../utils/civilRegistryConstants';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Lock,
  Unlock,
  Copy,
  Check,
  LogIn,
  AlertTriangle,
  Award,
  Crown,
  FileText,
  DollarSign,
  Download,
  UserCheck,
  UserX,
  X,
  Building2,
  History,
  Activity,
  Calendar,
  Clock,
  Laptop,
  ArrowRight,
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

export const ManageUsersView: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    adminResetPassword,
    approveResidentAccount,
    rejectResidentAccount,
    currentUser,
    setCurrentUser,
    settings,
    residents,
    officials,
    auditLogs,
    setActiveModule,
    targetUserId,
    setTargetUserId,
    arePuroksMatching,
  } = useBarangay();

  const officialCaptain = officials.find(
    (o) => o.order === 1 || /punong\s*barangay|captain/i.test(o.position)
  );

  // Active top-level Tab: 'users' | 'pending_approvals' | 'activity_logs'
  const [activeTab, setActiveTab] = useState<'users' | 'pending_approvals' | 'activity_logs'>('users');

  // Search & Filter states for Users
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedPurokFilter, setSelectedPurokFilter] = useState<string>('All');

  // Search & Filter states for Resident Approvals
  const [approvalSearchTerm, setApprovalSearchTerm] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('All');
  const [approvalPurokFilter, setApprovalPurokFilter] = useState<string>('All');
  const [approvalModalUser, setApprovalModalUser] = useState<SystemUser | null>(null);

  // Search & Filter states for Activity Logs
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logUserFilter, setLogUserFilter] = useState<string>('All');
  const [logActionFilter, setLogActionFilter] = useState<string>('All');
  const [logModuleFilter, setLogModuleFilter] = useState<string>('All');

  // User-specific Activity History Modal
  const [userActivityModalTarget, setUserActivityModalTarget] = useState<SystemUser | null>(null);

  // User Profile Photo Modal Target
  const [photoModalUser, setPhotoModalUser] = useState<SystemUser | null>(null);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<SystemUser | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [deleteTargetUser, setDeleteTargetUser] = useState<SystemUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Automatically respond to notification tap for resident registration approvals
  useEffect(() => {
    if (targetUserId) {
      const u = users.find((user) => user.id === targetUserId);
      if (u) {
        if (u.approvalStatus === 'Pending' || u.status === 'Pending Approval') {
          setActiveTab('pending_approvals');
          setApprovalModalUser(u);
        } else {
          setActiveTab('users');
          setSearchTerm(u.name);
        }
      }
      setTargetUserId(null);
    }
  }, [targetUserId, users]);

  // Form State for Add / Edit
  interface UserFormData extends Omit<SystemUser, 'id'> {
    password?: string;
  }

  const initialFormState: UserFormData = {
    name: '',
    username: '',
    password: '',
    role: 'Barangay Staff',
    position: 'Administrative Staff',
    email: '',
    contactNumber: '',
    status: 'Active',
    purok: settings.puroks[0] || 'Purok Mangga',
    residentId: '',
    securityQuestion: 'What is the name of your barangay?',
    securityAnswer: 'Sangkol',
    avatar: '',
    religion: 'Roman Catholic',
    citizenship: 'Filipino',
    bloodType: 'O+',
    birthDate: '',
    sex: 'Male',
    civilStatus: 'Single',
    streetAddress: '',
  };

  const [formData, setFormData] = useState<UserFormData>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  const rolesList: UserRole[] = [
    'Administrator',
    'Barangay Captain',
    'Barangay Secretary',
    'Barangay Treasurer',
    'Barangay Tanod',
    'Barangay Staff',
    'Barangay Official',
    'Resident',
  ];

  const standardSecurityQuestions = [
    'What is the name of your barangay?',
    'What is your mother’s maiden name?',
    'What was the name of your first school?',
    'What is your registered Purok?',
    'What is your favorite fruit?',
    'What is your official position in the Barangay?',
  ];

  const triggerFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Helper to generate a random 8-character secure password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleFormAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const compressedDataUrl = await compressImageFile(file, 400, 0.85);
      setFormData((prev) => ({ ...prev, avatar: compressedDataUrl }));
    } catch (err: any) {
      setFormError(err.message || 'Failed to process selected image.');
    } finally {
      setIsUploadingPhoto(false);
      if (formFileInputRef.current) {
        formFileInputRef.current.value = '';
      }
    }
  };

  // Open Add Modal
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormData({
      ...initialFormState,
      password: generateRandomPassword(),
      avatar: '',
    });
    setFormError(null);
    setShowFormPassword(true);
    setIsUserModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditUser = (user: SystemUser) => {
    setEditingUser(user);
    const linkedRes = residents.find(
      (r) =>
        (user.residentId && r.id === user.residentId) ||
        (user.email && r.email && r.email.toLowerCase() === user.email.toLowerCase()) ||
        (user.username && r.email && user.username.toLowerCase() === r.email.toLowerCase())
    );
    const resolvedReligion = user.religion || linkedRes?.religion || 'Bible Baptist Church';

    setFormData({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
      position: user.position || '',
      email: user.email || '',
      contactNumber: user.contactNumber || '',
      status: user.status,
      purok: user.purok || settings.puroks[0] || 'Purok Mangga',
      residentId: user.residentId || '',
      securityQuestion: user.securityQuestion || standardSecurityQuestions[0],
      securityAnswer: user.securityAnswer || '',
      avatar: user.avatar || '',
      religion: resolvedReligion,
      citizenship: user.citizenship || linkedRes?.citizenship || 'Filipino',
      bloodType: user.bloodType || linkedRes?.bloodType || 'O+',
      birthDate: user.birthDate || linkedRes?.birthDate || '',
      sex: user.sex || linkedRes?.sex || 'Male',
      civilStatus: user.civilStatus || linkedRes?.civilStatus || 'Single',
      streetAddress: user.streetAddress || linkedRes?.streetAddress || '',
    });
    setFormError(null);
    setShowFormPassword(false);
    setIsUserModalOpen(true);
  };

  // Submit Add / Edit
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '.');
    const cleanName = formData.name.trim();

    if (!cleanName) {
      setFormError('Please provide the full name of the user.');
      return;
    }

    if (!cleanUsername) {
      setFormError('Username is required.');
      return;
    }

    // Check duplicate username (except current user when editing)
    const existing = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && (!editingUser || u.id !== editingUser.id)
    );
    if (existing) {
      setFormError(`Username "@${cleanUsername}" is already taken by another account. Please choose a unique username.`);
      return;
    }

    // Strict validation for Barangay Captain role
    if (formData.role === 'Barangay Captain') {
      if (!officialCaptain) {
        setFormError(
          'The system refused credentials: No Punong Barangay is registered in Barangay Officials yet. Please register the Punong Barangay in Barangay Officials first.'
        );
        return;
      }

      // Check if duplicate captain exists
      const existingCaptainUser = users.find(
        (u) => u.role === 'Barangay Captain' && (!editingUser || u.id !== editingUser.id)
      );
      if (existingCaptainUser) {
        setFormError(
          `The system refused duplicate credentials: A Barangay Captain account already exists for "${existingCaptainUser.name}" (@${existingCaptainUser.username}). Only one Barangay Captain account is permitted in the system.`
        );
        return;
      }

      // Verify credentials match official Punong Barangay
      const isNameMatchingOfficial = areNamesMatching(cleanName, officialCaptain.name);
      if (!isNameMatchingOfficial) {
        setFormError(
          `The system refused duplicate/mismatched credentials: The registered official Punong Barangay is "${officialCaptain.name}". Barangay Captain credentials must match the official record. You cannot make "${cleanName}" a Barangay Captain.`
        );
        return;
      }
    }

    // Refuse non-captain accounts from having "Punong Barangay" in position title
    if (formData.role !== 'Barangay Captain' && /punong\s*barangay|barangay\s*captain/i.test(formData.position || '')) {
      setFormError(
        'The system refused duplicate captain credentials: Only the registered Barangay Captain can hold the Punong Barangay title. Please provide an appropriate position for this role (e.g. Barangay System Administrator).'
      );
      return;
    }

    const { password: formPass, ...userFields } = formData;

    if (editingUser) {
      updateUser(editingUser.id, {
        ...userFields,
        username: cleanUsername,
        name: cleanName,
      });
      setIsUserModalOpen(false);
      triggerFeedback(`User account @${cleanUsername} updated successfully!`);
    } else {
      if (!formPass || formPass.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      addUser({
        ...userFields,
        username: cleanUsername,
        name: cleanName,
      });

      if (isSupabaseConfigured) {
        const userEmail = formData.email || `${cleanUsername}@barangaysangkol.gov.ph`;
        supabase.auth.signUp({
          email: userEmail,
          password: formPass,
          options: {
            data: {
              username: cleanUsername,
              name: cleanName,
              role: formData.role,
            },
          },
        }).catch((err) => console.error('Supabase Auth signUp for staff user error:', err));
      }

      setIsUserModalOpen(false);
      triggerFeedback(`New user @${cleanUsername} created successfully!`);
    }
  };

  // Password Reset Modal Handlers
  const handleOpenPasswordModal = (user: SystemUser) => {
    setPasswordTargetUser(user);
    const suggestedPass = generateRandomPassword();
    setNewAdminPassword(suggestedPass);
    setShowPasswordText(true);
    setCopiedPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    if (!newAdminPassword || newAdminPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    const result = await adminResetPassword(passwordTargetUser.id, newAdminPassword);
    if (!result.success) {
      triggerFeedback(result.message, 'error');
      return;
    }

    setIsPasswordModalOpen(false);
    triggerFeedback(`${result.message} Share the new password securely.`);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newAdminPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  // Toggle Status
  const handleToggleStatus = (user: SystemUser) => {
    if (user.id === currentUser.id) {
      triggerFeedback('You cannot deactivate your own active session account.', 'error');
      return;
    }
    toggleUserStatus(user.id);
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    triggerFeedback(`Account @${user.username} is now ${nextStatus}.`);
  };

  // Delete User
  const handleOpenDeleteModal = (user: SystemUser) => {
    setDeleteError(null);
    if (user.id === currentUser.id) {
      triggerFeedback('You cannot delete your own currently logged-in account.', 'error');
      return;
    }
    setDeleteTargetUser(user);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetUser) return;
    const res = deleteUser(deleteTargetUser.id);
    if (res.success) {
      setDeleteTargetUser(null);
      triggerFeedback(res.message);
    } else {
      setDeleteError(res.message);
    }
  };

  // Fast Impersonate / Switch User
  const handleSwitchToUser = (user: SystemUser) => {
    if (user.status === 'Inactive') {
      triggerFeedback(`Cannot switch to @${user.username} because the account is Inactive.`, 'error');
      return;
    }
    setCurrentUser(user);
    if (user.role === 'Resident') {
      setActiveModule('resident_portal');
    } else {
      setActiveModule('dashboard');
    }
  };

  // Export Users to CSV
  const handleExportUsersCSV = () => {
    const headers = ['User ID', 'Full Name', 'Username', 'Role', 'Position', 'Email', 'Contact Number', 'Purok', 'Status', 'Linked Resident ID'];
    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.name}"`,
      `"${u.username}"`,
      `"${u.role}"`,
      `"${u.position || ''}"`,
      `"${u.email || ''}"`,
      `"${u.contactNumber || ''}"`,
      `"${u.purok || ''}"`,
      `"${u.status}"`,
      `"${u.residentId || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barangay_Sangkol_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerFeedback('Users directory exported to CSV.');
  };

  // Export Activity Logs to CSV
  const handleExportActivityLogsCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User Name', 'Role', 'Module', 'Action', 'Details', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole || ''}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || '192.168.1.1'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barangay_Sangkol_ActivityLogs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerFeedback('Activity logs exported to CSV.');
  };

  // Activity Logs Filter logic
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !logSearchTerm ||
      log.userName.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(logSearchTerm));

    const matchesUser = logUserFilter === 'All' || log.userName.toLowerCase() === logUserFilter.toLowerCase();
    const matchesAction = logActionFilter === 'All' || log.action === logActionFilter;
    const matchesModule = logModuleFilter === 'All' || log.module === logModuleFilter;

    return matchesSearch && matchesUser && matchesAction && matchesModule;
  });

  const distinctModules = Array.from(new Set(auditLogs.map((l) => l.module))).filter(Boolean);
  const distinctUsers = Array.from(new Set(auditLogs.map((l) => l.userName))).filter(Boolean);

  const getLogActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'ISSUE_CERTIFICATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
      case 'ARCHIVE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'SECURITY_ALERT':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'BACKUP_DATABASE':
      case 'RESTORE_DATABASE':
      case 'SYSTEM_CONFIG':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Activity Log Metrics
  const totalLogCount = auditLogs.length;
  const loginEventsCount = auditLogs.filter((l) => l.action === 'LOGIN' || l.action === 'LOGOUT').length;
  const dataMutationsCount = auditLogs.filter((l) => l.action === 'CREATE' || l.action === 'UPDATE' || l.action === 'ISSUE_CERTIFICATE').length;
  const securityOpsCount = auditLogs.filter((l) => l.action === 'DELETE' || l.action === 'SYSTEM_CONFIG' || l.action === 'SECURITY_ALERT' || l.action === 'BACKUP_DATABASE').length;

  // Filtering Logic for Users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.contactNumber && user.contactNumber.includes(searchTerm)) ||
      (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.purok && user.purok.toLowerCase().includes(searchTerm.toLowerCase())) ||
      arePuroksMatching(user.purok, searchTerm);

    const matchesRole = selectedRoleFilter === 'All' || user.role === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'All' || user.status === selectedStatusFilter;
    const matchesPurok = arePuroksMatching(user.purok, selectedPurokFilter);

    return matchesSearch && matchesRole && matchesStatus && matchesPurok;
  });

  // Filtering Logic for Resident Applications
  const filteredResidentApplications = users
    .filter((u) => u.role === 'Resident')
    .filter((u) => {
      const matchesSearch =
        !approvalSearchTerm ||
        u.name.toLowerCase().includes(approvalSearchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(approvalSearchTerm.toLowerCase()) ||
        (u.purok && u.purok.toLowerCase().includes(approvalSearchTerm.toLowerCase())) ||
        (u.validIdType && u.validIdType.toLowerCase().includes(approvalSearchTerm.toLowerCase())) ||
        (u.validIdNumber && u.validIdNumber.toLowerCase().includes(approvalSearchTerm.toLowerCase())) ||
        (u.contactNumber && u.contactNumber.includes(approvalSearchTerm)) ||
        arePuroksMatching(u.purok, approvalSearchTerm);

      const matchesStatus =
        approvalStatusFilter === 'All' || u.status === approvalStatusFilter;
      const matchesPurok = arePuroksMatching(u.purok, approvalPurokFilter);

      return matchesSearch && matchesStatus && matchesPurok;
    });

  // Metrics
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === 'Active').length;
  const adminCount = users.filter((u) => u.role === 'Administrator').length;
  const staffCount = users.filter((u) => u.role !== 'Administrator' && u.role !== 'Resident').length;
  const residentCount = users.filter((u) => u.role === 'Resident').length;
  const pendingApprovalsCount = users.filter((u) => u.role === 'Resident' && u.status === 'Pending Approval').length;
  const approvedResidentsCount = users.filter((u) => u.role === 'Resident' && u.status === 'Active').length;
  const rejectedResidentsCount = users.filter((u) => u.role === 'Resident' && u.status === 'Rejected').length;

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Barangay Captain':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Barangay Secretary':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Barangay Treasurer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Barangay Tanod':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Barangay Staff':
      case 'Barangay Official':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Resident':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'Barangay Captain':
        return <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'Barangay Secretary':
        return <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'Barangay Treasurer':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'Barangay Tanod':
        return <ShieldAlert className="w-3.5 h-3.5 text-orange-600 shrink-0" />;
      case 'Barangay Staff':
      case 'Barangay Official':
        return <Award className="w-3.5 h-3.5 text-cyan-600 shrink-0" />;
      case 'Resident':
      default:
        return <Users className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            {activeTab === 'users' ? (
              <Users className="w-6 h-6" />
            ) : activeTab === 'pending_approvals' ? (
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            ) : (
              <Activity className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'users'
                  ? 'User Management & Access Control'
                  : activeTab === 'pending_approvals'
                  ? 'Resident Portal Registration Approvals'
                  : 'System & Staff Activity Logs'}
              </h1>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                activeTab === 'pending_approvals'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}>
                {activeTab === 'users'
                  ? `${totalUsers} Accounts`
                  : activeTab === 'pending_approvals'
                  ? `${pendingApprovalsCount} Pending Review`
                  : `${auditLogs.length} Events`}
              </span>
              <InfoButton
                title={
                  activeTab === 'users'
                    ? 'User Management'
                    : activeTab === 'pending_approvals'
                    ? 'Registration Approvals'
                    : 'System Activity Logs'
                }
                info={
                  activeTab === 'users'
                    ? 'Manage system administrator accounts, barangay officials, frontline staff, and resident portal credentials.'
                    : activeTab === 'pending_approvals'
                    ? 'Verify and approve resident citizen sign-in registrations submitted from the resident portal against civil records.'
                    : 'Real-time chronicle of user logins, certificate issuances, resident edits, and administrative actions.'
                }
                variant="light"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Top Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory</span>
              <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {totalUsers}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending_approvals')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending_approvals'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Resident Approvals</span>
              {pendingApprovalsCount > 0 ? (
                <span className="ml-1 text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                  {pendingApprovalsCount}
                </span>
              ) : (
                <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                  {residentCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity_logs')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'activity_logs'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activity Log</span>
              <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">
                {auditLogs.length}
              </span>
            </button>
          </div>

          {activeTab === 'users' ? (
            <>
              <button
                type="button"
                onClick={handleExportUsersCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title="Download users directory CSV spreadsheet"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </>
          ) : activeTab === 'pending_approvals' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {pendingApprovalsCount} awaiting verification
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleExportActivityLogsCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Download filtered activity logs CSV spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span>Export Activity Log CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: User Accounts Directory */}
      {activeTab === 'users' && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  {activeCount} Active · {totalUsers - activeCount} Inactive
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Administrators</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{adminCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Full System Access</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">Officials & Staff</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{staffCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Frontline & Services</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Citizen Accounts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{residentCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Online Portal Access</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Pending Resident Registrations Quick Alert Banner */}
          {pendingApprovalsCount > 0 && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-950 text-sm">
                      {pendingApprovalsCount} Resident Sign-In Registration{pendingApprovalsCount > 1 ? 's' : ''} Awaiting Admin Approval
                    </span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                      Action Required
                    </span>
                  </div>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Resident citizens have registered online and require administrator verification against civil census records before login access is granted.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('pending_approvals')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Review Pending Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Input */}
              <RecentSearchesInput
                className="flex-1"
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search user by name, @username, email, mobile, position, or purok..."
                storageKey="manage_users"
                theme="light"
              />

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Role Filter */}
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Roles</option>
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>

                {/* Purok Filter */}
                <select
                  value={selectedPurokFilter}
                  onChange={(e) => setSelectedPurokFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Puroks</option>
                  {settings.puroks.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter summary */}
            {(searchTerm || selectedRoleFilter !== 'All' || selectedStatusFilter !== 'All' || selectedPurokFilter !== 'All') && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing <strong>{filteredUsers.length}</strong> matching of {totalUsers} registered accounts.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRoleFilter('All');
                    setSelectedStatusFilter('All');
                    setSelectedPurokFilter('All');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Users Table / Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">User & Account</th>
                    <th className="py-3.5 px-4">Role & Designation</th>
                    <th className="py-3.5 px-4">Contact Information</th>
                    <th className="py-3.5 px-4">Assigned Purok</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserX className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-700">No user accounts found.</p>
                          <p className="text-[11px] text-slate-400">Try adjusting your search criteria or role filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, idx) => {
                      const isCurrent = user.id === currentUser.id;
                      const userLogsCount = auditLogs.filter(
                        (l) => l.userName.toLowerCase() === user.name.toLowerCase() || l.userName.toLowerCase() === user.username.toLowerCase()
                      ).length;

                      return (
                        <tr
                          key={`${user.id}-${idx}`}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isCurrent ? 'bg-indigo-50/30 font-medium' : ''
                          }`}
                        >
                          {/* User & Account */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => setPhotoModalUser(user)}
                                className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 cursor-pointer group shadow-xs border border-slate-200"
                                title="Click to view or change profile photo"
                              >
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                                    {user.name.charAt(0)}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Camera className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span
                                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                    user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                  title={user.status}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs">{user.name}</span>
                                  {isCurrent && (
                                    <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                  <span>@{user.username}</span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-[10px] text-slate-400">{user.id}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Designation */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRoleBadgeStyle(
                                  user.role
                                )}`}
                              >
                                {getRoleIcon(user.role)}
                                <span>{user.role}</span>
                              </span>
                              {user.position && (
                                <p className="text-[11px] text-slate-600 font-medium truncate max-w-[180px]">
                                  {user.position}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 text-[11px]">
                              {user.email ? (
                                <div className="flex items-center gap-1.5 text-slate-700">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[160px]">{user.email}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No email set</span>
                              )}
                              {user.contactNumber && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{user.contactNumber}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Purok & Religion */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-slate-700">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{user.purok || 'Unassigned'}</span>
                              </div>
                              {(() => {
                                const linkedRes = residents.find(
                                  (r) =>
                                    (user.residentId && r.id === user.residentId) ||
                                    (user.email && r.email && r.email.toLowerCase() === user.email.toLowerCase()) ||
                                    (user.username && r.email && user.username.toLowerCase() === r.email.toLowerCase())
                                );
                                const displayRel = user.religion || linkedRes?.religion;
                                return displayRel ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {displayRel}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {user.status === 'Pending Approval' ? (
                              <button
                                type="button"
                                onClick={() => setApprovalModalUser(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer animate-pulse"
                                title="Click to review and approve/reject resident application"
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Approval</span>
                              </button>
                            ) : user.status === 'Rejected' ? (
                              <button
                                type="button"
                                onClick={() => setApprovalModalUser(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-colors cursor-pointer"
                                title="Click to review rejection reason"
                              >
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Rejected</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                disabled={isCurrent}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                                  user.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                } ${isCurrent ? 'opacity-80 cursor-not-allowed hover:bg-emerald-50 hover:text-emerald-700' : ''}`}
                                title={isCurrent ? 'Cannot deactivate your active session' : 'Click to toggle Active / Inactive'}
                              >
                                {user.status === 'Active' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Active</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 text-slate-400" />
                                    <span>Inactive</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Resident Verification Action */}
                              {user.role === 'Resident' && user.status === 'Pending Approval' && (
                                <button
                                  type="button"
                                  onClick={() => setApprovalModalUser(user)}
                                  className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                                  title="Review and Verify Resident Registration Application"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                                </button>
                              )}

                              {/* View Activity Log for this User */}
                              <button
                                type="button"
                                onClick={() => setUserActivityModalTarget(user)}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors cursor-pointer relative"
                                title={`View Activity Log history for @${user.username} (${userLogsCount} events)`}
                              >
                                <History className="w-3.5 h-3.5" />
                                {userLogsCount > 0 && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                              </button>

                              {/* Impersonate / Switch User */}
                              {!isCurrent && user.status === 'Active' && (
                                <button
                                  type="button"
                                  onClick={() => handleSwitchToUser(user)}
                                  className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                  title={`Switch active session to @${user.username}`}
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModal(user)}
                                className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Reset User Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Change Profile Photo */}
                              <button
                                type="button"
                                onClick={() => setPhotoModalUser(user)}
                                className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Change Profile Picture (Upload / Camera / Presets)"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit User */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(user)}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Edit User Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(user)}
                                disabled={isCurrent}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isCurrent
                                    ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200'
                                }`}
                                title={isCurrent ? 'Cannot delete your active user account' : 'Delete user account'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Resident Approvals & Verification Desk */}
      {activeTab === 'pending_approvals' && (
        <>
          {/* Approval Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{pendingApprovalsCount}</p>
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">Awaiting Admin Action</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Verified Residents</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{approvedResidentsCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Active Portal Citizens</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Declined Requests</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{rejectedResidentsCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Unverified Residency</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-200">
                <UserX className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Total Registrations</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {users.filter((u) => u.role === 'Resident').length}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Portal Sign-in Accounts</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-200">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter & Search Bar for Resident Approvals */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Input */}
              <RecentSearchesInput
                className="flex-1"
                value={approvalSearchTerm}
                onChange={setApprovalSearchTerm}
                placeholder="Search resident applicant by name, @username, purok, ID number, or mobile..."
                storageKey="manage_user_approvals"
                theme="light"
              />

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={approvalStatusFilter}
                  onChange={(e) => setApprovalStatusFilter(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All">All Application Statuses</option>
                  <option value="Pending Approval">Pending Approval Only</option>
                  <option value="Active">Approved / Active</option>
                  <option value="Rejected">Declined / Rejected</option>
                </select>

                {/* Purok Filter */}
                <select
                  value={approvalPurokFilter}
                  onChange={(e) => setApprovalPurokFilter(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All">All Puroks</option>
                  {settings.puroks.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Applications Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResidentApplications.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Resident Applications Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {approvalSearchTerm || approvalStatusFilter !== 'All' || approvalPurokFilter !== 'All'
                    ? 'No resident registrations match the current filter criteria.'
                    : 'There are no resident sign-in registrations submitted at this time.'}
                </p>
              </div>
            ) : (
              filteredResidentApplications.map((appUser, idx) => {
                const isPending = appUser.status === 'Pending Approval';
                const isApproved = appUser.status === 'Active';
                const isRejected = appUser.status === 'Rejected';

                return (
                  <div
                    key={`${appUser.id}-${idx}`}
                    className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                      isPending
                        ? 'border-amber-300 ring-2 ring-amber-400/20'
                        : isRejected
                        ? 'border-rose-200'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 text-white font-bold text-base flex items-center justify-center shrink-0 border border-slate-200">
                        {appUser.avatar ? (
                          <img
                            src={appUser.avatar}
                            alt={appUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          appUser.name.charAt(0)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {appUser.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {appUser.status}
                          </span>
                        </div>

                        <p className="text-xs font-mono text-indigo-700 font-semibold">
                          @{appUser.username}
                        </p>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{appUser.purok || 'Sangkol'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Triangulation Matching Status Badge */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {appUser.registrationType === 'existing_resident_match' || appUser.matchedResidentId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Census Match: {appUser.matchedResidentId || 'Found'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                          <UserPlus className="w-3 h-3 text-blue-600" />
                          <span>New Resident Request</span>
                        </span>
                      )}

                      {appUser.matchConfidence && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {appUser.matchConfidence}
                        </span>
                      )}
                    </div>

                    {/* Application Details Summary */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Address:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[170px]">
                          {appUser.streetAddress || `${appUser.purok || 'Sangkol'}, Barangay Sangkol`}
                        </span>
                      </div>

                      {appUser.birthDate && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Birthdate:</span>
                          <span className="font-medium text-slate-800">{appUser.birthDate}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Contact No:</span>
                        <span className="font-medium text-slate-800">{appUser.contactNumber || 'N/A'}</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Valid ID:</span>
                        <span className="font-semibold text-emerald-800 truncate max-w-[170px]">
                          {appUser.validIdType || 'PhilSys National ID'}
                        </span>
                      </div>

                      {appUser.residentId && isApproved && (
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Linked Resident:</span>
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {appUser.residentId}
                          </span>
                        </div>
                      )}

                      {appUser.submittedAt && (
                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>Date Submitted:</span>
                          <span>{new Date(appUser.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Rejection Note if any */}
                    {isRejected && appUser.rejectionReason && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 space-y-0.5">
                        <span className="font-bold block">Decline Note:</span>
                        <p className="text-rose-800">{appUser.rejectionReason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setApprovalModalUser(appUser)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isPending ? 'Review & Link' : 'View File'}</span>
                      </button>

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => setApprovalModalUser(appUser)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Tab 2: Activity Logs & Audit Trail */}
      {activeTab === 'activity_logs' && (
        <>
          {/* Activity Log Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Events Logged</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalLogCount}</p>
                <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Chronological Audit Trail</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">User Logins & Sessions</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{loginEventsCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Authentication Events</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <LogIn className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Data Mutations</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{dataMutationsCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Creates, Edits & Clearances</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Security & System Ops</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{securityOpsCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Deletions & Config Changes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Activity Logs Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Log Input */}
              <RecentSearchesInput
                className="flex-1"
                value={logSearchTerm}
                onChange={setLogSearchTerm}
                placeholder="Search logs by staff name, action details, module, IP address..."
                storageKey="manage_user_logs"
                theme="light"
              />

              {/* Log Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* User Filter */}
                <select
                  value={logUserFilter}
                  onChange={(e) => setLogUserFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Users / Staff</option>
                  {distinctUsers.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>

                {/* Action Filter */}
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Action Types</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="ISSUE_CERTIFICATE">ISSUE_CERTIFICATE</option>
                  <option value="SYSTEM_CONFIG">SYSTEM_CONFIG</option>
                  <option value="BACKUP_DATABASE">BACKUP_DATABASE</option>
                  <option value="RESTORE_DATABASE">RESTORE_DATABASE</option>
                  <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                  <option value="ARCHIVE">ARCHIVE</option>
                </select>

                {/* Module Filter */}
                <select
                  value={logModuleFilter}
                  onChange={(e) => setLogModuleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Modules</option>
                  {distinctModules.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Log Filter Summary */}
            {(logSearchTerm || logUserFilter !== 'All' || logActionFilter !== 'All' || logModuleFilter !== 'All') && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing <strong>{filteredLogs.length}</strong> matching log events of {totalLogCount} total recorded.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLogSearchTerm('');
                    setLogUserFilter('All');
                    setLogActionFilter('All');
                    setLogModuleFilter('All');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Reset Log Filters
                </button>
              </div>
            )}
          </div>

          {/* Activity Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Staff / User</th>
                    <th className="py-3.5 px-4">Module</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Activity Description & Details</th>
                    <th className="py-3.5 px-4 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-700">No activity log entries found.</p>
                          <p className="text-[11px] text-slate-400">Try adjusting your filters or search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px]">{log.timestamp}</span>
                          </div>
                        </td>

                        {/* User / Actor */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px]">
                              {log.userName ? log.userName.charAt(0) : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{log.userName}</p>
                              {log.userRole && (
                                <p className="text-[10px] text-slate-500">{log.userRole}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Module */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                            {log.module}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getLogActionBadgeStyle(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 text-xs leading-relaxed max-w-xl">
                            {log.details}
                          </p>
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                            {log.ipAddress || '192.168.1.1'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* User-Specific Activity History Modal */}
      {userActivityModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setUserActivityModalTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-200 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs">
                  {userActivityModalTarget.avatar ? (
                    <img
                      src={userActivityModalTarget.avatar}
                      alt={userActivityModalTarget.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userActivityModalTarget.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Activity Chronicle: {userActivityModalTarget.name}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 font-normal">
                      (@{userActivityModalTarget.username})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold border ${getRoleBadgeStyle(
                        userActivityModalTarget.role
                      )}`}
                    >
                      {getRoleIcon(userActivityModalTarget.role)}
                      <span>{userActivityModalTarget.role}</span>
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      {
                        auditLogs.filter(
                          (l) =>
                            l.userName.toLowerCase() === userActivityModalTarget.name.toLowerCase() ||
                            l.userName.toLowerCase() === userActivityModalTarget.username.toLowerCase()
                        ).length
                      }{' '}
                      recorded system actions
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUserActivityModalTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: User Activity List */}
            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {(() => {
                const userLogs = auditLogs.filter(
                  (l) =>
                    l.userName.toLowerCase() === userActivityModalTarget.name.toLowerCase() ||
                    l.userName.toLowerCase() === userActivityModalTarget.username.toLowerCase()
                );

                if (userLogs.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <History className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">No activity events recorded yet for this user.</p>
                      <p className="text-xs text-slate-400">
                        When this user logs in, edits residents, or issues certificates, events will appear here in real time.
                      </p>
                    </div>
                  );
                }

                return userLogs.map((log, idx) => (
                  <div
                    key={`${log.id}-${idx}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.2 rounded-md font-mono text-[9px] font-bold border ${getLogActionBadgeStyle(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                          {log.module}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {log.details}
                      </p>
                    </div>

                    <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                      {log.ipAddress || '192.168.1.1'}
                    </span>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const targetName = userActivityModalTarget.name;
                  setUserActivityModalTarget(null);
                  setActiveTab('activity_logs');
                  setLogUserFilter(targetName);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>View All in Full Activity Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setUserActivityModalTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsUserModalOpen(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? `Edit Account: @${editingUser.username}` : 'Add New System Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser ? 'Update user roles and credentials.' : 'Assign role, positions, and security access.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4">
              {/* Profile Photo Uploader Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Profile Photo / Avatar</span>
                  </label>
                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: '' })}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-indigo-200 bg-white shadow-xs">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg">
                        {formData.name ? formData.name.charAt(0) : '?'}
                      </div>
                    )}
                  </div>

                  {/* Actions / Upload Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={formFileInputRef}
                        onChange={handleFormAvatarUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => formFileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? 'Processing...' : 'Upload Image'}</span>
                      </button>

                      {editingUser && (
                        <button
                          type="button"
                          onClick={() => setPhotoModalUser(editingUser)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-500" />
                          <span>Webcam / Full Studio</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets:</p>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {AVATAR_PRESETS.slice(0, 6).map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, avatar: preset.url })}
                            className={`relative w-7 h-7 rounded-full overflow-hidden border-2 shrink-0 transition-transform hover:scale-110 cursor-pointer ${
                              formData.avatar === preset.url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-slate-200'
                            }`}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '.') })}
                      placeholder="juan.delacruz"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    System Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      if (newRole === 'Barangay Captain') {
                        const existingCap = users.find(
                          (u) => u.role === 'Barangay Captain' && (!editingUser || u.id !== editingUser.id)
                        );
                        if (existingCap) {
                          setFormError(
                            `The system refused duplicate credentials: A Barangay Captain account already exists for "${existingCap.name}" (@${existingCap.username}). Only one Barangay Captain account is permitted in the system.`
                          );
                          return;
                        }
                        if (officialCaptain) {
                          setFormData({
                            ...formData,
                            role: 'Barangay Captain',
                            name: officialCaptain.name,
                            position: 'Punong Barangay (Barangay Captain)',
                            email: officialCaptain.email || formData.email,
                            contactNumber: officialCaptain.contactNumber || formData.contactNumber,
                            purok: officialCaptain.purok || formData.purok,
                          });
                          setFormError(null);
                          return;
                        }
                      }
                      setFormData({
                        ...formData,
                        role: newRole,
                        position:
                          newRole === 'Administrator' && /punong\s*barangay/i.test(formData.position)
                            ? 'Barangay System Administrator'
                            : formData.position,
                      });
                      setFormError(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Single-Captain Wired Alert Banner */}
                {formData.role === 'Barangay Captain' && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Strictly Wired to Punong Barangay Official Record</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Barangay Captain credentials must strictly match the registered official Punong Barangay (
                      <strong className="underline font-bold">{officialCaptain?.name || 'Not appointed in Officials'}</strong>
                      ). The system prohibits duplicate or mismatched captain credentials.
                    </p>
                    {officialCaptain && !areNamesMatching(formData.name, officialCaptain.name) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            name: officialCaptain.name,
                            position: 'Punong Barangay (Barangay Captain)',
                            email: officialCaptain.email || prev.email,
                            contactNumber: officialCaptain.contactNumber || prev.contactNumber,
                            purok: officialCaptain.purok || prev.purok,
                          }));
                          setFormError(null);
                        }}
                        className="mt-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-fill Credentials from Official ({officialCaptain.name})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Position / Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Official Position / Title</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Barangay Secretary / Admin Officer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Assigned Purok */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Assigned Purok Zone</label>
                  <select
                    value={formData.purok}
                    onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {settings.puroks.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Email Address (for Gmail OTP)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Civil Demographic & Registry Fields (Religion, Citizenship, Blood Type) */}
                <div className="sm:col-span-2 pt-3 pb-1 border-t border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Civil Registry & Demographic Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Religion */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Religion / Faith <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.religion || 'Roman Catholic'}
                        onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {PHILIPPINE_RELIGIONS.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>

                    {/* Citizenship */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Citizenship <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.citizenship || 'Filipino'}
                        onChange={(e) => setFormData({ ...formData, citizenship: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {CITIZENSHIP_OPTIONS.map((cit) => (
                          <option key={cit} value={cit}>{cit}</option>
                        ))}
                      </select>
                    </div>

                    {/* Blood Type */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Blood Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.bloodType || 'O+'}
                        onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {BLOOD_TYPES.map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.birthDate || ''}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Sex */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Sex / Gender</label>
                      <select
                        value={formData.sex || 'Male'}
                        onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    {/* Civil Status */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Civil Status</label>
                      <select
                        value={formData.civilStatus || 'Single'}
                        onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Common Law">Common Law / Cohabiting</option>
                      </select>
                    </div>

                    {/* Street Address */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Street / Residential Address</label>
                      <input
                        type="text"
                        value={formData.streetAddress || ''}
                        onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                        placeholder="House No., Street Name, Sitio"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Password (for new user or optional edit) */}
                {!editingUser ? (
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Initial Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate Random</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pr-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Security Question & Answer */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Security Question</label>
                  <select
                    value={formData.securityQuestion}
                    onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {standardSecurityQuestions.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Security Answer</label>
                  <input
                    type="text"
                    value={formData.securityAnswer}
                    onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                    placeholder="e.g. Sangkol"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Account Status */}
                <div className="sm:col-span-2 space-y-1 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">Account Access Status</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="accountStatus"
                        checked={formData.status === 'Active'}
                        onChange={() => setFormData({ ...formData, status: 'Active' })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-emerald-700">Active Account (Can Log In)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="accountStatus"
                        checked={formData.status === 'Inactive'}
                        onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-600">Inactive / Suspended</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Reset Modal */}
      {isPasswordModalOpen && passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsPasswordModalOpen(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Reset User Password</h3>
                <p className="text-xs text-slate-500">
                  Setting new password for <strong>{passwordTargetUser.name}</strong> (@{passwordTargetUser.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setNewAdminPassword(generateRandomPassword())}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full pr-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Copy password to clipboard"
                  >
                    {copiedPassword ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Security & Account Unlock</span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Resetting the password clears any failed login lockout attempts immediately, allowing the user to sign in right away.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteTargetUser && (
        <DeleteConfirmationModal
          isOpen={true}
          title="Delete User Account"
          itemType="user account"
          itemName={`@${deleteTargetUser.username} (${deleteTargetUser.name})`}
          description={
            deleteError ||
            `Are you sure you want to permanently delete user account @${deleteTargetUser.username}? This will revoke their access to the system.`
          }
          confirmText="Yes, Delete User"
          onConfirm={handleConfirmDelete}
          onClose={() => {
            setDeleteTargetUser(null);
            setDeleteError(null);
          }}
        />
      )}

      {/* User Profile Photo Modal */}
      <UserProfilePhotoModal
        isOpen={Boolean(photoModalUser)}
        onClose={() => setPhotoModalUser(null)}
        targetUser={photoModalUser || undefined}
      />

      {/* Resident Registration Application Approval Modal */}
      {approvalModalUser && (
        <ResidentApprovalModal
          isOpen={Boolean(approvalModalUser)}
          user={approvalModalUser}
          onClose={() => setApprovalModalUser(null)}
          onSuccess={(msg) => triggerFeedback(msg)}
        />
      )}
    </div>
  );
};
