import React, { useState, useEffect } from 'react';
import { 
  MessageSquare,
  MessageCircle,
  Heart,
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  Bell, 
  Search, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  MoreVertical,
  LogOut,
  UserCircle,
  FileCheck,
  DollarSign,
  Briefcase,
  ShieldCheck,
  ClipboardList,
  UserPlus,
  CreditCard,
  AlertCircle,
  Cpu,
  Layers,
  Lock,
  Eye,
  EyeOff,
  TrendingDown,
  Award,
  Building2,
  Package,
  ChevronDown,
  Camera,
  Sparkles,
  X,
  Moon,
  Sun,
  Plus,
  Check,
  Trash2,
  FileText,
  Upload,
  Star
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Role = 'principal' | 'vice_principal' | 'admin' | 'class_in_charge' | 'mentor' | 'director_dean' | 'faculty' | 'student';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  Users,
  DollarSign,
  Award,
  GraduationCap,
  Briefcase,
  BookOpen,
  Building2,
  ShieldCheck,
  ClipboardList,
  Package
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loginStage, setLoginStage] = useState<'role_selection' | 'credentials'>('role_selection');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard Overview');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Analytics', 'Approvals', 'Department Monitoring', 'Academic Supervision', 'Attendance Analytics', 'Office Management', 'Smart Timetable']);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameValue, setUsernameValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [approvalTab, setApprovalTab] = useState<'Pending' | 'History'>('Pending');
  const [editingApproval, setEditingApproval] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(5);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rit_dark_mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('rit_dark_mode', darkMode.toString());
  }, [darkMode]);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rit_token'));
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    if (token) {
      // Try to restore session if token exists
      const savedUser = localStorage.getItem('rit_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setRole(user.role);
        setFullName(user.fullName);
        setProfilePicture(user.profilePicture);
        setIsLoggedIn(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && role && token) {
      fetchDashboardData();
    }
  }, [isLoggedIn, role, token]);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/dashboard/${role}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        throw new Error("Session expired");
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data", err);
      addToast(err.message === "Session expired" ? "Session expired. Please login again." : "Failed to load dashboard data", "error");
      handleLogout();
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameValue,
          password: passwordValue,
          selectedRole: selectedRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success
      setToken(data.token);
      setRole(data.user.role);
      setFullName(data.user.fullName);
      setProfilePicture(data.user.profilePicture);
      setIsLoggedIn(true);
      localStorage.setItem('rit_token', data.token);
      localStorage.setItem('rit_user', JSON.stringify(data.user));
      addToast(`Welcome back, ${data.user.fullName}!`);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateProfilePicture = async (imageData: string) => {
    try {
      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture: imageData })
      });

      if (response.ok) {
        setProfilePicture(imageData);
        const savedUser = localStorage.getItem('rit_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          user.profilePicture = imageData;
          localStorage.setItem('rit_user', JSON.stringify(user));
        }
        addToast("Profile picture updated successfully!");
        setShowProfileModal(false);
        stopCamera();
      } else {
        addToast("Failed to update profile picture", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      addToast("Could not access camera", "error");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
      }
    }
  };

  const generateAIPhoto = async () => {
    if (!aiPrompt) {
      addToast("Please enter a prompt", "error");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `A professional profile picture of a ${role?.replace('_', ' ')}: ${aiPrompt}` }] }],
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setCapturedImage(imageUrl);
          break;
        }
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      addToast("Failed to generate image", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setToken(null);
    setFullName('');
    setProfilePicture(null);
    setLoginStage('role_selection');
    setSelectedRole(null);
    setActiveTab('Dashboard Overview');
    setLoginError('');
    setUsernameValue('');
    setPasswordValue('');
    localStorage.removeItem('rit_token');
    localStorage.removeItem('rit_user');
  };

  const handleApproval = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      const response = await fetch(`/api/approvals/${id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        addToast(`Request ${status.toLowerCase()} successfully`);
        setApprovalTab('History');
        fetchDashboardData();
      }
    } catch (err) {
      addToast("Failed to update approval", "error");
    }
  };

  const handleUpdateApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApproval) return;

    try {
      const response = await fetch(`/api/approvals/${editingApproval.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingApproval)
      });
      if (response.ok) {
        addToast("Approval updated successfully");
        setEditingApproval(null);
        fetchDashboardData();
      }
    } catch (err) {
      addToast("Failed to update approval", "error");
    }
  };

  const handleAssignActingPrincipal = async () => {
    const name = prompt("Enter the name of the Vice Principal to assign as Acting Principal:");
    if (!name) return;

    try {
      const response = await fetch('/api/system/acting-principal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (response.ok) {
        addToast(`${name} assigned as Acting Principal`);
        fetchDashboardData();
      }
    } catch (err) {
      addToast("Failed to assign acting principal", "error");
    }
  };

  const handleRunScheduler = async () => {
    addToast("AI Scheduler started...");
    try {
      const response = await fetch('/api/system/run-scheduler', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setTimeout(() => {
          addToast("Smart Timetable generated successfully!");
          fetchDashboardData();
        }, 2000);
      }
    } catch (err) {
      addToast("Failed to run scheduler", "error");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => setDarkMode(prev => !prev)}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div className={cn(
          "w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 transition-all duration-500",
          loginStage === 'role_selection' ? "max-w-2xl" : "max-w-md"
        )}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none mx-auto mb-4">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">RIT Portal</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {loginStage === 'role_selection' ? 'Select your role to continue' : `Sign in as ${selectedRole?.replace('_', ' ')}`}
            </p>
          </div>

          {loginStage === 'role_selection' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'principal', label: 'Login as Principal', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { id: 'vice_principal', label: 'Login as Vice Principal', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'admin', label: 'Login as Admin', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
                { id: 'class_in_charge', label: 'Login as Class In-Charge', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
                { id: 'mentor', label: 'Login as Mentor', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
                { id: 'director_dean', label: 'Login as Director / Dean', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { id: 'faculty', label: 'Login as Faculty', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'student', label: 'Login as Student', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((roleOption, idx, arr) => (
                <button
                  key={roleOption.id}
                  onClick={() => {
                    setSelectedRole(roleOption.id as Role);
                    setLoginStage('credentials');
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group text-left",
                    idx === arr.length - 1 && arr.length % 2 !== 0 ? "sm:col-span-2" : ""
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0", roleOption.bg, roleOption.color)}>
                    <roleOption.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{roleOption.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Access your specific dashboard</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <button 
                type="button"
                onClick={() => {
                  setLoginStage('role_selection');
                  setLoginError('');
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2"
              >
                ← Back to role selection
              </button>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                  <input 
                    name="username"
                    type="text" 
                    value={usernameValue}
                    onChange={(e) => setUsernameValue(e.target.value)}
                    required
                    placeholder="Enter your username" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                  <input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    required
                    placeholder="Enter your password" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-12 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const principalSidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Institutional Oversight', 
      icon: ShieldCheck,
      subItems: ['Compliance Monitoring', 'Strategic Planning', 'Budget Oversight']
    },
    { 
      name: 'Academic Supervision', 
      icon: BookOpen,
      subItems: ['Syllabus Completion', 'Faculty Performance', 'Student Statistics']
    },
    { name: 'Approvals', icon: CheckCircle2, subItems: ['Strategic Approvals', 'Approval History'] },
    { name: 'Administration', icon: Settings, subItems: ['Acting Principal', 'System Config'] },
    { name: 'Notifications', icon: Bell, badge: notificationCount },
  ];

  const vicePrincipalSidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Academic Operations', 
      icon: Layers,
      subItems: ['Timetable Management', 'Faculty Workload', 'Attendance Analytics']
    },
    { 
      name: 'Student Affairs', 
      icon: Users,
      subItems: ['Discipline Admin', 'Grievance Reports', 'Student Directory']
    },
    { name: 'Approvals', icon: CheckCircle2, subItems: ['Strategic Approvals', 'Approval History'] },
    { name: 'Notifications', icon: Bell, badge: notificationCount },
  ];

  const classInChargeSidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Class Management', 
      icon: Users,
      subItems: ['Attendance Entry', 'Internal Assessments', 'Student Directory']
    },
    { 
      name: 'Academic Records', 
      icon: ClipboardList,
      subItems: ['Marks Upload', 'Performance Tracking']
    },
    { name: 'Notifications', icon: Bell, badge: 3 },
  ];

  const mentorSidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Mentoring', 
      icon: Users,
      subItems: ['Assigned Mentees', 'Counseling Records', 'Progress Reviews']
    },
    { 
      name: 'Feedback', 
      icon: MessageSquare,
      subItems: ['Grievance Reports', 'Student Feedback']
    },
    { name: 'Notifications', icon: Bell, badge: 2 },
  ];

  const directorDeanSidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Department Monitoring', 
      icon: Building2,
      subItems: ['Performance Analysis', 'HOD Reports', 'Department Stats']
    },
    { 
      name: 'Academic Planning', 
      icon: BookOpen,
      subItems: ['Curriculum Planning', 'Syllabus Completion', 'Program Monitoring']
    },
    { 
      name: 'Reports & Analytics', 
      icon: TrendingUp,
      subItems: ['Institutional Reports', 'Faculty Performance', 'Student Statistics']
    },
    { 
      name: 'Supervision', 
      icon: ShieldCheck,
      subItems: ['COE Oversight', 'Research Coordination', 'Strategic Approvals']
    },
    { name: 'Notifications', icon: Bell, badge: notificationCount },
  ];

  const facultySidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Attendance Management', 
      icon: CheckCircle2,
      subItems: ['Attendance Entry', 'Attendance Reports']
    },
    { 
      name: 'Academic Records', 
      icon: ClipboardList,
      subItems: ['Internal Marks', 'Semester Marks', 'Marks Upload']
    },
    { 
      name: 'Learning Materials', 
      icon: BookOpen,
      subItems: ['Assignments', 'Material Sharing']
    },
    { 
      name: 'Student Mentoring', 
      icon: Users,
      subItems: ['Mentee Progress', 'Weekly Reviews', 'Grievance Reports']
    },
    { 
      name: 'Requests & Feedback', 
      icon: MessageSquare,
      subItems: ['Leave Submission', 'Assessment Feedback', 'Question Paper Evaluation']
    },
    { name: 'Surveys', icon: FileCheck, subItems: ['End Semester Surveys'] },
  ];

  const studentSidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Academic Schedule', 
      icon: Calendar,
      subItems: ['Timetable', 'Academic Calendar']
    },
    { 
      name: 'Attendance', 
      icon: CheckCircle2,
      subItems: ['Attendance Tracking', 'Leave Tracking']
    },
    { 
      name: 'Performance', 
      icon: Award,
      subItems: ['Results & Marks', 'CGPA Calculator', 'Lab & Cycle Tests']
    },
    { 
      name: 'Learning', 
      icon: BookOpen,
      subItems: ['Assignment Submission', 'Study Materials']
    },
    { 
      name: 'Finance', 
      icon: CreditCard,
      subItems: ['Fee Information', 'Payment History']
    },
    { name: 'Notifications', icon: Bell, badge: 3 },
    { name: 'Feedback', icon: MessageCircle, subItems: ['Submit Feedback'] },
  ];

  const adminSidebar = [
    { name: 'Dashboard Overview', icon: LayoutDashboard },
    { 
      name: 'Office Management', 
      icon: Briefcase,
      subItems: ['Staff Records', 'Inventory Management']
    },
    { 
      name: 'Smart Timetable', 
      icon: Cpu,
      subItems: ['Generate Timetable', 'Faculty Availability']
    },
  ];

  const currentSidebar = role === 'principal' ? principalSidebar :
                        role === 'vice_principal' ? vicePrincipalSidebar :
                        role === 'admin' ? adminSidebar :
                        role === 'class_in_charge' ? classInChargeSidebar :
                        role === 'mentor' ? mentorSidebar :
                        role === 'director_dean' ? directorDeanSidebar : 
                        role === 'faculty' ? facultySidebar : 
                        role === 'student' ? studentSidebar :
                        adminSidebar;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">RIT</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          {currentSidebar.map((item: any) => (
            <div key={item.name} className="space-y-1">
              <button
                onClick={() => {
                  if (item.subItems) {
                    toggleMenu(item.name);
                  } else {
                    setActiveTab(item.name);
                    setActiveSubTab(null);
                    if (item.name === 'Notifications') {
                      setNotificationCount(0);
                    }
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group text-left",
                  activeTab === item.name && !item.subItems
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn(
                    "shrink-0 transition-colors",
                    activeTab === item.name ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span className="text-sm font-medium truncate">{item.name}</span>
                </div>
                {item.subItems ? (
                  <ChevronDown size={14} className={cn("transition-transform duration-200", expandedMenus.includes(item.name) && "rotate-180")} />
                ) : item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                ) : null}
              </button>

              {item.subItems && expandedMenus.includes(item.name) && (
                <div className="ml-9 space-y-1 animate-in slide-in-from-top-1 duration-200">
                  {item.subItems.map((sub: string) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setActiveTab(item.name);
                        setActiveSubTab(sub);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all",
                        activeSubTab === sub 
                          ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/10" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        activeSubTab === sub ? "bg-indigo-600" : "bg-slate-300"
                      )} />
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-1">
          <button 
            onClick={() => setShowLogout(!showLogout)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold",
              showLogout 
                ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings size={20} />
              <span>Settings</span>
            </div>
            <ChevronDown size={16} className={cn("transition-transform duration-200", showLogout && "rotate-180")} />
          </button>
          
          {showLogout && (
            <div className="animate-in slide-in-from-bottom-2 duration-200 space-y-1">
              <button 
                onClick={() => setDarkMode(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Moon size={20} className={cn(darkMode ? "text-indigo-500" : "text-slate-400")} />
                  <span>Dark Mode</span>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full relative transition-colors duration-200",
                  darkMode ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                )}>
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200",
                    darkMode ? "left-4.5" : "left-0.5"
                  )} />
                </div>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between z-10 transition-colors duration-300">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search analytics, staff, students..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{role?.replace('_', ' ')}</p>
              </div>
              <div 
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500/20 transition-all"
                onClick={() => {
                  setShowProfileModal(true);
                  setCapturedImage(null);
                  setAiPrompt('');
                }}
              >
                <img 
                  src={profilePicture || `https://picsum.photos/seed/${role}/100/100`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 custom-scrollbar transition-colors duration-300">
          {isLoadingData ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="font-medium">Loading Dashboard Data...</p>
            </div>
          ) : dashboardData ? (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Dynamic Header */}
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {activeSubTab || activeTab}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {activeTab === 'Dashboard Overview' ? 'Overseeing institutional growth and strategic approvals.' : 
                     role === 'director_dean' ? 'Strategic oversight of departments, academic planning, and program monitoring.' :
                     role === 'faculty' ? 'Manage student attendance, marks, assignments, and mentoring activities.' :
                     role === 'student' ? 'Access your academic schedule, track performance, and manage submissions.' :
                     'Stay updated with the latest institutional alerts.'}
                  </p>
                </div>
                {activeTab === 'Dashboard Overview' && dashboardData.actingPrincipal !== 'None' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                    <ShieldCheck size={14} />
                    Acting Principal: {dashboardData.actingPrincipal}
                  </div>
                )}
              </div>

              {/* Feature Content Rendering */}
              {activeTab !== 'Dashboard Overview' && (
                <div className="space-y-8">
                  {/* Student Features */}
                  {role === 'student' && (
                    <>
                      {activeSubTab === 'Timetable' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">Weekly Timetable</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Day</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Time</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Room</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {dashboardData.timetable.map((entry: any) => (
                                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{entry.day}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{entry.time}</td>
                                    <td className="p-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">{entry.subject}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{entry.room}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Results & Marks' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Academic Results</h3>
                            <button className="text-xs font-bold text-indigo-600 hover:underline">Download Marksheet</button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Internal</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Semester</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {dashboardData.marks.map((mark: any) => (
                                  <tr key={mark.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{mark.subject}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{mark.internal_marks}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{mark.semester_marks}</td>
                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{mark.total_marks}</td>
                                    <td className="p-4">
                                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold">{mark.grade}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Academic Calendar' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {dashboardData.calendar.map((item: any) => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                                <Calendar size={24} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{item.event}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.date} • {item.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSubTab === 'Attendance Tracking' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Attendance Analytics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              {['Mathematics', 'Physics', 'Computer Science', 'English'].map((subject) => (
                                <div key={subject} className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{subject}</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">92%</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '92%' }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                              <div className="w-24 h-24 rounded-full border-8 border-indigo-600 border-t-transparent animate-spin-slow mb-4 flex items-center justify-center">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">94%</span>
                              </div>
                              <p className="font-bold text-slate-900 dark:text-white">Overall Attendance</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You have 48/52 sessions attended.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'CGPA Calculator' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">CGPA & SGPA Calculator</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {[1, 2, 3].map((sem) => (
                              <div key={sem} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Semester {sem}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">8.{5 + sem}</p>
                              </div>
                            ))}
                          </div>
                          <div className="p-6 bg-indigo-600 rounded-2xl text-white flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium opacity-80">Current Cumulative GPA</p>
                              <p className="text-4xl font-bold">3.85</p>
                            </div>
                            <button className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all">Predict CGPA</button>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Lab & Cycle Tests' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">Internal Test Scores</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Test Name</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Score</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Max Marks</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {[1, 2, 3].map((i) => (
                                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">Cycle Test {i}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">Computer Networks</td>
                                    <td className="p-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">{40 + i * 2}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">50</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Assignment Submission' && (
                        <div className="space-y-6">
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submit Assignment</h3>
                            <div className="space-y-4">
                              <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                <option>Select Assignment</option>
                                <option>Binary Search Trees - Data Structures</option>
                                <option>Process Scheduling - OS</option>
                              </select>
                              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                                <Upload className="mx-auto text-slate-300 mb-4" size={40} />
                                <p className="text-slate-500 dark:text-slate-400">Drag and drop your file here, or <span className="text-indigo-600 font-bold cursor-pointer">browse</span></p>
                                <p className="text-[10px] text-slate-400 mt-2">PDF, DOCX up to 10MB</p>
                              </div>
                              <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all">Submit Now</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Study Materials' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {['Lecture Notes', 'Lab Manuals', 'Reference Books', 'Question Bank'].map((type) => (
                            <div key={type} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-all group">
                              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white">{type}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">12 files available</p>
                              <button className="mt-4 text-indigo-600 text-xs font-bold hover:underline">Access Folder</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSubTab === 'Payment History' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">Transaction History</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">2024-01-10</td>
                                  <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">Semester Fee - Sem 5</td>
                                  <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">₹ 1,25,000</td>
                                  <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">Success</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Submit Feedback' && (
                        <div className="max-w-2xl bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Course & Faculty Feedback</h3>
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Subject</label>
                              <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                <option>Select Subject</option>
                                <option>Data Structures</option>
                                <option>Operating Systems</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Rating</label>
                              <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button key={star} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                                    <Star size={20} className="text-amber-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Comments</label>
                              <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-32" placeholder="Tell us about your experience..." />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all">Submit Feedback</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Faculty Features */}
                  {role === 'faculty' && (
                    <>
                      {activeSubTab === 'Attendance Entry' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Mark Daily Attendance</h3>
                            <div className="flex gap-2">
                              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Save Attendance</button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Student ID</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Name</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {dashboardData.students.map((student: any) => (
                                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400">{student.id}</td>
                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{student.name}</td>
                                    <td className="p-4">
                                      <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name={`att-${student.id}`} className="w-4 h-4 text-indigo-600" defaultChecked />
                                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Present</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name={`att-${student.id}`} className="w-4 h-4 text-rose-600" />
                                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Absent</span>
                                        </label>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Attendance Reports' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Attendance Analytics</h3>
                          <div className="h-[300px] w-full mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={dashboardData.attendance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#1e293b' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                                <Area type="monotone" dataKey="present" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPresent)" />
                                <defs>
                                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['Section A', 'Section B'].map((section) => (
                              <div key={section} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white">{section}</span>
                                <span className="text-emerald-600 font-bold">94% Avg</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Assignment List' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Active Assignments</h3>
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                              <Plus size={14} /> Create New
                            </button>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {['Binary Search Trees', 'Process Scheduling', 'Network Layers'].map((title, idx) => (
                              <div key={title} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                                    <FileText size={24} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Due: 2024-03-2{idx + 1} • {15 + idx * 5} Submissions</p>
                                  </div>
                                </div>
                                <button className="text-indigo-600 text-sm font-bold hover:underline">View Submissions</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {['Internal Marks', 'Semester Marks', 'Marks Upload'].includes(activeSubTab || '') && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">{activeSubTab}</h3>
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Export Excel</button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Student</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Marks</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {dashboardData.students.map((student: any) => (
                                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{student.name}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">Data Structures</td>
                                    <td className="p-4">
                                      <input type="number" className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-sm" defaultValue={85} />
                                    </td>
                                    <td className="p-4">
                                      <button className="text-indigo-600 text-xs font-bold hover:underline">Update</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Material Sharing' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Course Content Repository</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-center">
                              <Plus size={40} className="text-slate-300 mb-4" />
                              <p className="font-bold text-slate-900 dark:text-white">Upload New Material</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, PPTX, MP4 supported</p>
                              <button className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Browse Files</button>
                            </div>
                            <div className="space-y-4">
                              {['Unit 1 - Introduction.pdf', 'Unit 2 - Advanced Topics.pptx'].map((file) => (
                                <div key={file} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileText size={20} className="text-indigo-600" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{file}</span>
                                  </div>
                                  <button className="text-rose-600 hover:text-rose-700"><Trash2 size={16} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {['Mentee Progress', 'Weekly Reviews', 'Grievance Reports'].includes(activeSubTab || '') && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">{activeSubTab}</h3>
                          </div>
                          <div className="p-6 space-y-6">
                            {dashboardData.counselingRecords.map((record: any) => (
                              <div key={record.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                      {record.student_name[0]}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 dark:text-white">{record.student_name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{record.date}</p>
                                    </div>
                                  </div>
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">On Track</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                  <span className="font-bold">Topic:</span> {record.topic}<br/>
                                  <span className="font-bold">Outcome:</span> {record.outcome}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {['Leave Submission', 'Assessment Feedback', 'Question Paper Evaluation'].includes(activeSubTab || '') && (
                        <div className="max-w-2xl bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{activeSubTab}</h3>
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Subject/Category</label>
                              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Enter details..." />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Description</label>
                              <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-32" placeholder="Provide more context..." />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all">Submit Request</button>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'End Semester Surveys' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileCheck size={40} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">End Semester Surveys</h3>
                          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">Collect and analyze student feedback for the current semester to improve teaching methodologies.</p>
                          <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">Launch Survey</button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Director/Dean Features */}
                  {role === 'director_dean' && (
                    <>
                      {activeSubTab === 'Performance Analysis' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Departmental Performance Trends</h3>
                            <div className="h-[400px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData.performance}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#1e293b' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                                  <Bar dataKey="performance" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={60} />
                                  <Bar dataKey="target" fill={darkMode ? "#334155" : "#e2e8f0"} radius={[6, 6, 0, 0]} barSize={60} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      )}

                      {['HOD Reports', 'Department Stats', 'Institutional Reports'].includes(activeSubTab || '') && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">{activeSubTab}</h3>
                            <button className="text-indigo-600 text-xs font-bold hover:underline">Download PDF</button>
                          </div>
                          <div className="p-6 space-y-6">
                            {dashboardData.performance.map((dept: any) => (
                              <div key={dept.department} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-bold text-slate-900 dark:text-white">{dept.department}</h4>
                                  <span className="text-xs font-bold text-indigo-600">{dept.performance}% Efficiency</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Research</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">12 Papers</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Grants</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">₹ 4.5L</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Events</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">3 Hosted</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {['Curriculum Planning', 'Syllabus Completion', 'Program Monitoring'].includes(activeSubTab || '') && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{activeSubTab}</h3>
                          <div className="space-y-8">
                            {dashboardData.syllabus.map((item: any) => (
                              <div key={item.department} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.department}</span>
                                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.completed}% Complete</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.completed}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                  <span>Target: {item.total}%</span>
                                  <span>Remaining: {item.total - item.completed}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {['Faculty Performance', 'Student Statistics'].includes(activeSubTab || '') && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{activeSubTab}</h3>
                          <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dashboardData.workload}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#1e293b' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                                <Bar dataKey="teaching" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="research" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="admin" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-8 flex justify-center gap-8">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-indigo-600" />
                              <span className="text-xs font-bold text-slate-500">Teaching</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold text-slate-500">Research</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <span className="text-xs font-bold text-slate-500">Admin</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {['Fee Collection', 'Scholarship Status'].includes(activeSubTab || '') && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{activeSubTab}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Total Target</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">₹ 12.5 Cr</p>
                              </div>
                              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Collected</p>
                                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">₹ 8.2 Cr</p>
                              </div>
                              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                                <p className="text-sm text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">Pending</p>
                                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">₹ 4.3 Cr</p>
                              </div>
                            </div>
                            <div className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                  { name: 'Jan', collected: 1.2 },
                                  { name: 'Feb', collected: 2.5 },
                                  { name: 'Mar', collected: 4.5 },
                                  { name: 'Apr', collected: 8.2 },
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                                  <Tooltip />
                                  <Area type="monotone" dataKey="collected" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCollected)" />
                                  <defs>
                                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSubTab === 'Strategic Approvals' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">Pending Strategic Approvals</h3>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {dashboardData.approvals.map((approval: any) => (
                              <div key={approval.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                                    <FileCheck size={24} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{approval.type}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{approval.requester} • {approval.reason}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleApproval(approval.id, 'Approved')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">Approve</button>
                                  <button onClick={() => handleApproval(approval.id, 'Rejected')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700">Reject</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Principal & Vice Principal Features */}
                  {(role === 'principal' || role === 'vice_principal') && (
                    <>
                      {activeSubTab === 'Compliance Monitoring' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Institutional Compliance Status</h3>
                          <div className="space-y-4">
                            {dashboardData.compliance.map((task: any) => (
                              <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", task.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                    <ShieldCheck size={20} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{task.task}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Due: {task.deadline}</p>
                                  </div>
                                </div>
                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase", task.status === 'Completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Class In-Charge Features */}
                  {role === 'class_in_charge' && (
                    <>
                      {activeSubTab === 'Internal Assessments' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Class Assessment Overview</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {dashboardData.marks.slice(0, 3).map((m: any) => (
                              <div key={m.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{m.subject}</p>
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{m.total_marks}% Avg</h4>
                                <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full" style={{ width: `${m.total_marks}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Mentor Features */}
                  {role === 'mentor' && (
                    <>
                      {activeSubTab === 'Assigned Mentees' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">Mentee List</h3>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {dashboardData.students.slice(0, 5).map((student: any) => (
                              <div key={student.id} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                                    {student.name.split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{student.id} • Year {student.year}</p>
                                  </div>
                                </div>
                                <button className="px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">View Profile</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Generic Fallback for other tabs */}
                  {!['Timetable', 'Results & Marks', 'Academic Calendar', 'Fee Information', 'Attendance Entry', 'Assignments', 'Performance Analysis', 'Strategic Approvals', 'Compliance Monitoring', 'Strategic Planning', 'Budget Oversight', 'Syllabus Completion', 'Faculty Performance', 'Student Statistics', 'Timetable Management', 'Faculty Workload', 'Attendance Analytics', 'Discipline Admin', 'Grievance Reports', 'Student Directory', 'Internal Assessments', 'Marks Upload', 'Performance Tracking', 'Assigned Mentees', 'Counseling Records', 'Progress Reviews', 'Student Feedback', 'Staff Records', 'Inventory Management', 'Generate Timetable', 'Faculty Availability'].includes(activeSubTab || '') && (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LayoutDashboard size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{activeSubTab || activeTab}</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">This section is currently being populated with real-time data from the {role?.replace('_', ' ')} module.</p>
                      <button className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Refresh Data</button>
                    </div>
                  )}
                </div>
              )}

              {/* Original Dashboard Overview Logic (Keep for Overview Tab) */}
              {activeTab === 'Dashboard Overview' && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {dashboardData.stats.map((stat: any) => (
                      <StatCard 
                        key={stat.id}
                        title={stat.title}
                        value={
                          role === 'student' && stat.title === 'Attendance' ? `${dashboardData.attendance[0]?.present || 0}%` :
                          role === 'student' && stat.title === 'CGPA' ? '8.75' :
                          stat.value
                        }
                        change={stat.change}
                        icon={ICON_MAP[stat.icon] || TrendingUp}
                        color={stat.color}
                      />
                    ))}
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-6">
                        {role === 'director_dean' || role === 'principal' || role === 'vice_principal' ? 'Academic Performance by Dept' : 
                         role === 'faculty' || role === 'class_in_charge' ? 'Student Performance Overview' :
                         role === 'student' ? 'My Subject Performance' :
                         role === 'mentor' ? 'Mentee Performance' :
                         'System Performance'}
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={
                            role === 'student' ? 
                            dashboardData.marks.map((m: any) => ({ name: m.subject, performance: m.total_marks })) :
                            role === 'faculty' || role === 'class_in_charge' ?
                            dashboardData.students.map((s: any) => ({ name: s.name.split(' ')[0], performance: s.grade === 'A+' ? 95 : s.grade === 'A' ? 85 : s.grade === 'B' ? 75 : 65 })) :
                            role === 'mentor' ?
                            dashboardData.students.slice(0, 5).map((s: any) => ({ name: s.name.split(' ')[0], performance: s.grade === 'A+' ? 92 : 82 })) :
                            dashboardData.performance
                          }>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                            <XAxis dataKey={role === 'student' || role === 'faculty' || role === 'class_in_charge' || role === 'mentor' ? "name" : "department"} axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                            <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#1e293b' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                            <Bar dataKey="performance" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-6">
                        {role === 'director_dean' || role === 'principal' || role === 'vice_principal' ? 'Faculty Workload Distribution' : 
                         role === 'faculty' || role === 'class_in_charge' || role === 'student' ? 'Attendance Trend' :
                         role === 'mentor' ? 'Counseling Trend' :
                         'Resource Utilization'}
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {role === 'faculty' || role === 'student' || role === 'class_in_charge' || role === 'mentor' ? (
                            <AreaChart data={dashboardData.attendance.slice(0, 5)}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#1e293b' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                              <Area type="monotone" dataKey="present" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
                            </AreaChart>
                          ) : (
                            <AreaChart data={dashboardData.workload}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                              <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#1e293b' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                              <Area type="monotone" dataKey="teaching" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} strokeWidth={3} />
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity / Updates */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white">Recent Updates</h3>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {role === 'student' ? (
                          dashboardData.marks.slice(0, 4).map((item: any, idx: number) => (
                            <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", idx % 2 === 0 ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400")}>
                                  <Award size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{item.subject}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Score: {item.total_marks}% • Grade: {item.grade}</p>
                                </div>
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Recent Result</div>
                            </div>
                          ))
                        ) : role === 'faculty' || role === 'class_in_charge' || role === 'mentor' ? (
                          dashboardData.students.slice(0, 4).map((item: any, idx: number) => (
                            <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", idx % 2 === 0 ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400")}>
                                  <Users size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Grade: {item.grade} • {item.courses}</p>
                                </div>
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Student Update</div>
                            </div>
                          ))
                        ) : (
                          dashboardData.performance.slice(0, 4).map((item: any, idx: number) => (
                            <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", idx % 2 === 0 ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400")}>
                                  <TrendingUp size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{item.department}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Performance: {item.performance}%</p>
                                </div>
                              </div>
                              <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                item.performance >= 85 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              )}>
                                {item.performance >= 85 ? 'Exceeding' : 'On Track'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(activeSubTab === 'Student Statistics' || activeSubTab === 'Assigned Mentees') && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Student Directory</h3>
                    <div className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg">
                      {dashboardData.students.length} Students Enrolled
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grade</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enrolled Courses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dashboardData.students.map((student: any) => (
                          <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400">{student.id}</td>
                            <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{student.name}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold",
                                student.grade.startsWith('A') ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                student.grade.startsWith('B') ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              )}>
                                {student.grade}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{student.courses}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(activeTab === 'Analytics' || activeTab === 'Academic Supervision' || activeTab === 'Attendance Analytics' || activeTab === 'Faculty Workload' || activeTab === 'Discipline Admin' || activeTab === 'Office Management' || activeTab === 'Fee Management') && activeSubTab !== 'Student Statistics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{activeSubTab || activeTab}</h3>
                    <p className="text-sm text-slate-500 mb-8">Detailed breakdown of {(activeSubTab || activeTab).toLowerCase()} metrics for the current academic year.</p>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={
                            activeTab === 'Attendance Analytics' || activeSubTab?.includes('Attendance') ? 
                              dashboardData.attendance.map((a: any) => ({ name: a.category, value: (a.present / a.total) * 100 })) :
                            activeTab === 'Fee Management' || activeSubTab?.includes('Fee') ?
                              dashboardData.fees.map((f: any) => ({ name: f.department, collected: f.collected, total: f.total })) :
                            activeTab === 'Academic Supervision' || activeSubTab?.includes('Syllabus') ?
                              dashboardData.syllabus.map((s: any) => ({ name: s.department, completed: s.completed })) :
                            activeTab === 'Discipline Admin' || activeSubTab?.includes('Discipline') ?
                              dashboardData.discipline.map((d: any) => ({ name: d.type, count: d.count })) :
                            activeTab === 'Office Management' || activeSubTab?.includes('Inventory') ?
                              dashboardData.inventory.map((i: any) => ({ name: i.item, quantity: i.quantity })) :
                            activeSubTab === 'Faculty Performance' ? 
                              dashboardData.performance.map((p: any) => ({
                                ...p,
                                workload: dashboardData.workload.find((w: any) => w.department === p.department)?.teaching || 0
                              })) : 
                              dashboardData.performance
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey={
                            activeTab === 'Attendance Analytics' || activeSubTab?.includes('Attendance') || 
                            activeTab === 'Fee Management' || activeSubTab?.includes('Fee') ||
                            activeTab === 'Academic Supervision' || activeSubTab?.includes('Syllabus') ||
                            activeTab === 'Discipline Admin' || activeSubTab?.includes('Discipline') ||
                            activeTab === 'Office Management' || activeSubTab?.includes('Inventory') ? 'name' : 'department'
                          } axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                          <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderColor: darkMode ? '#1e293b' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                          <Legend verticalAlign="top" height={36}/>
                          
                          {/* Dynamic Bars based on Tab */}
                          {(activeTab === 'Attendance Analytics' || activeSubTab?.includes('Attendance')) && (
                            <Bar name="Attendance (%)" dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                          )}
                          {(activeTab === 'Fee Management' || activeSubTab?.includes('Fee')) && (
                            <>
                              <Bar name="Collected" dataKey="collected" fill="#10b981" radius={[6, 6, 0, 0]} />
                              <Bar name="Total" dataKey="total" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                            </>
                          )}
                          {(activeTab === 'Academic Supervision' || activeSubTab?.includes('Syllabus')) && (
                            <Bar name="Syllabus Completed (%)" dataKey="completed" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                          )}
                          {(activeTab === 'Discipline Admin' || activeSubTab?.includes('Discipline')) && (
                            <Bar name="Incident Count" dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                          )}
                          {(activeTab === 'Office Management' || activeSubTab?.includes('Inventory')) && (
                            <Bar name="Quantity" dataKey="quantity" fill="#6366f1" radius={[6, 6, 0, 0]} />
                          )}
                          
                          {/* Default Performance Bars */}
                          {!(activeTab === 'Attendance Analytics' || activeSubTab?.includes('Attendance') || 
                             activeTab === 'Fee Management' || activeSubTab?.includes('Fee') ||
                             activeTab === 'Academic Supervision' || activeSubTab?.includes('Syllabus') ||
                             activeTab === 'Discipline Admin' || activeSubTab?.includes('Discipline') ||
                             activeTab === 'Office Management' || activeSubTab?.includes('Inventory')) && (
                            <>
                              <Bar name="Performance Score (%)" dataKey="performance" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                              {activeSubTab === 'Faculty Performance' && (
                                <Bar name="Workload (Hours/Week)" dataKey="workload" fill="#10b981" radius={[6, 6, 0, 0]} />
                              )}
                              {activeSubTab !== 'Faculty Performance' && (
                                <Bar name="Target (%)" dataKey="target" fill={darkMode ? "#1e293b" : "#e2e8f0"} radius={[6, 6, 0, 0]} />
                              )}
                            </>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Approvals' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <h3 className="font-bold text-slate-900">
                        {activeSubTab || 'All Approvals'}
                      </h3>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setApprovalTab('Pending')}
                          className={cn(
                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                            approvalTab === 'Pending' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          Pending
                        </button>
                        <button 
                          onClick={() => setApprovalTab('History')}
                          className={cn(
                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                            approvalTab === 'History' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          History
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(approvalTab === 'Pending' ? dashboardData.approvals : dashboardData.approvalHistory)
                      .filter((item: any) => role !== 'principal' || !item.type.includes('Budget'))
                      .filter((item: any) => !activeSubTab || item.type.includes(activeSubTab.split(' ')[0]))
                      .map((item: any) => (
                        <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              item.status === 'Approved' ? "bg-emerald-50 text-emerald-600" :
                              item.status === 'Rejected' ? "bg-red-50 text-red-600" :
                              "bg-indigo-50 text-indigo-600"
                            )}>
                              <FileCheck size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900">{item.type}</p>
                                {item.status !== 'Pending' && (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                    item.status === 'Approved' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                  )}>
                                    {item.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{item.requester} • {item.reason}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingApproval(item)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 flex items-center gap-2"
                            >
                              <Settings size={14} />
                            </button>
                            {item.status === 'Pending' ? (
                              <>
                                <button 
                                  onClick={() => handleApproval(item.id, 'Rejected')}
                                  className="px-4 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100"
                                >
                                  Reject
                                </button>
                                <button 
                                  onClick={() => handleApproval(item.id, 'Approved')}
                                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                                >
                                  Approve
                                </button>
                              </>
                            ) : (
                              <div className="px-4 py-1.5 text-xs font-bold text-slate-400 italic">Processed</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeTab === 'Department Monitoring' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">{activeSubTab}</h3>
                    <div className="space-y-6">
                      {dashboardData.performance.map((dept: any) => (
                        <div key={dept.department} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                              <Building2 size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{dept.department}</p>
                              <p className="text-xs text-slate-500">Last updated: 2 hours ago</p>
                            </div>
                          </div>
                          <button className="text-indigo-600 text-sm font-bold hover:underline">View Report</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Administration' && (
                <div className="max-w-2xl bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Assign Acting Principal</h3>
                  <p className="text-sm text-slate-500 mb-8">Delegate principal authority to a Vice Principal for a specified duration.</p>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                      <AlertCircle className="text-amber-600 shrink-0" size={24} />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Current Status</p>
                        <p className="text-xs text-amber-700 mt-1">
                          {dashboardData.actingPrincipal === 'None' 
                            ? "No acting principal is currently assigned. You have full authority." 
                            : `Authority is currently shared with ${dashboardData.actingPrincipal}.`}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={handleAssignActingPrincipal}
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3"
                    >
                      <UserPlus size={20} />
                      {dashboardData.actingPrincipal === 'None' ? 'Assign New Acting Principal' : 'Change Acting Principal'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Notifications' && (
                <div className="max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Recent Alerts</h3>
                    <button className="text-xs font-bold text-indigo-600">Mark all as read</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          "bg-indigo-50 text-indigo-600"
                        )}>
                          <Bell size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-slate-900 text-sm">
                              {i === 1 ? 'Urgent: Budget Overrun' : 'New Approval Request'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">2h ago</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {i === 1 
                              ? 'The Department of Mechanical Engineering has exceeded its allocated budget for lab consumables by 15%.' 
                              : 'A new Casual Leave request has been submitted by Prof. Miller for your review.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Class In-Charge Views */}
              {role === 'class_in_charge' && activeTab === 'Internal Assessments' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Internal Assessments Supervision</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dashboardData.internalAssessments.map((assessment: any) => (
                          <tr key={assessment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{assessment.subject}</td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{assessment.date}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold",
                                assessment.status === 'Completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {assessment.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{assessment.avg_score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mentor Views */}
              {role === 'mentor' && activeTab === 'Counseling' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Counseling Documentation</h3>
                    <button className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all">
                      Log Session
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mentee</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Topic</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dashboardData.counselingRecords.map((record: any) => (
                          <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{record.student_name}</td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{record.date}</td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{record.topic}</td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{record.outcome}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {role === 'mentor' && activeTab === 'Feedback' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Mentee Feedback Handling</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mentee</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Feedback</th>
                          <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dashboardData.feedbackRecords.map((feedback: any) => (
                          <tr key={feedback.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{feedback.student_name}</td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{feedback.date}</td>
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{feedback.feedback_text}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold",
                                feedback.status === 'Resolved' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {feedback.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p className="font-medium">No dashboard data available.</p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Approval Modal */}
      {editingApproval && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Approval Details</h3>
            <form onSubmit={handleUpdateApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Request Type</label>
                <input 
                  type="text" 
                  value={editingApproval.type}
                  onChange={(e) => setEditingApproval({...editingApproval, type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Requester</label>
                <input 
                  type="text" 
                  value={editingApproval.requester}
                  onChange={(e) => setEditingApproval({...editingApproval, requester: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Reason</label>
                <textarea 
                  value={editingApproval.reason}
                  onChange={(e) => setEditingApproval({...editingApproval, reason: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Status</label>
                <select 
                  value={editingApproval.status}
                  onChange={(e) => setEditingApproval({...editingApproval, status: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingApproval(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 z-50 space-y-4">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-right-8 duration-300",
              toast.type === 'success' ? "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Profile Photo Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCircle className="text-indigo-600" />
                Update Profile Picture
              </h2>
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  stopCamera();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Camera Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Camera size={18} className="text-indigo-500" />
                  Take a Photo
                </h3>
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative border-2 border-dashed border-slate-200 dark:border-slate-700 group">
                  {cameraStream ? (
                    <video 
                      id="camera-preview"
                      autoPlay 
                      playsInline 
                      ref={el => el && (el.srcObject = cameraStream)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4 text-center">
                      <Camera size={40} className="mb-2 opacity-20" />
                      <p className="text-sm">Camera is off</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!cameraStream ? (
                    <button 
                      onClick={startCamera}
                      className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-all text-sm"
                    >
                      Start Camera
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={capturePhoto}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all text-sm"
                      >
                        Capture
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                      >
                        Stop
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Generation Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  AI Generated
                </h3>
                <div className="space-y-3">
                  <textarea 
                    placeholder="Describe how you want to look (e.g., professional, smiling, wearing glasses...)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all min-h-[100px] resize-none"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <button 
                    onClick={generateAIPhoto}
                    disabled={isGeneratingAI}
                    className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    Generate with AI
                  </button>
                </div>
              </div>
            </div>

            {/* Preview & Save Section */}
            {capturedImage && (
              <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
                    <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-indigo-900">New Profile Photo</h4>
                    <p className="text-sm text-indigo-600 mb-4">Does this look good?</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleUpdateProfilePicture(capturedImage)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                      >
                        Save Changes
                      </button>
                      <button 
                        onClick={() => setCapturedImage(null)}
                        className="px-6 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 transition-all"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  key?: any;
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

  function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
  };

  const isPositive = change.includes('+') || change.includes('Compliance') || change.includes('Generated') || change.includes('All Updated') || change.includes('Balanced');

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl", colorClasses[color] || "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
          <Icon size={20} />
        </div>
        <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
          <MoreVertical size={18} />
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <div className="flex items-end gap-2 mt-1">
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
          <span className={cn(
            "text-[10px] font-bold mb-1",
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}
