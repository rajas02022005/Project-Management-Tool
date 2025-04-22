import { useState, useEffect } from 'react';
import { FaPlus } from "react-icons/fa";
import { LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import ProjectBoard from './ProjectBoard';
import Navbar from '../Navigation/Navbar';
import Sidebar from '../Navigation/Sidebar';
import Toast from "../Toast";
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebaseconfig';

export default function Dashboard({ setPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userEmail, setUserEmail] = useState(""); 
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [projectStats, setProjectStats] = useState({
    totalEnrolled: 0,
    totalTasks: 0,
    completedTasks: 0
  });

  const projectData = [
    { month: 'Jan', completed: 4, ongoing: 6 },
    { month: 'Feb', completed: 6, ongoing: 4 },
    { month: 'Mar', completed: 8, ongoing: 5 },
    { month: 'Apr', completed: 5, ongoing: 7 },
    { month: 'May', completed: 7, ongoing: 3 },
  ];

  const taskCompletionData = [
    { name: 'Completed', value: 63 },
    { name: 'In Progress', value: 27 },
    { name: 'Pending', value: 10 },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  const getThemeColors = () => ({
    sidebar: isDarkMode ? 'bg-gray-800' : 'bg-white',
    navbar: isDarkMode ? 'bg-gray-800' : 'bg-white',
    content: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    hoverBg: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
  });

  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus();
  
    // Get dark mode preference from localStorage
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode !== null) {
      setIsDarkMode(storedDarkMode === 'true');
    }
  }, []);

  useEffect(() => {
    // Fetch stats when user is authenticated
    if (userEmail) {
      fetchUserStats();
    }
  }, [userEmail]);

  const fetchUserStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get user's enrolled projects
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const enrolledProjects = userData.enrolledProjects || [];
        
        // Update total enrolled count
        setProjectStats(prev => ({
          ...prev,
          totalEnrolled: enrolledProjects.length
        }));
        
        // Count tasks from enrolled projects
        let totalTasks = 0;
        let completedTasks = 0;
        
        for (const projectId of enrolledProjects) {
          const tasksCollection = collection(db, 'projects', projectId, 'tasks');
          const tasksSnapshot = await getDocs(tasksCollection);
          
          totalTasks += tasksSnapshot.size;
          
          // Count completed tasks (in 'done' status)
          tasksSnapshot.forEach(doc => {
            const taskData = doc.data();
            if (taskData.status === 'done') {
              completedTasks++;
            }
          });
        }
        
        setProjectStats(prev => ({
          ...prev,
          totalTasks,
          completedTasks
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  const handleClick = () => {
    navigate('/projectboard');
  };
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
  };

  const checkAuthStatus = async () => {
    try {
      // First check localStorage for user email
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) {
        setUserEmail(storedEmail);
        
        // Show welcome toast on initial load
        setToastMessage(`Welcome back, ${storedEmail}!`);
        setToastType("success");
        setShowToast(true);
      }
      
      // Then try to verify with server
      const response = await fetch("http://localhost:5001/auth/user", {
        credentials: "include",
      });
      const data = await response.json();
      
      if (response.ok) {
        // Update email if different from localStorage
        if (data.email && data.email !== storedEmail) {
          setUserEmail(data.email);
          localStorage.setItem("userEmail", data.email);
        }
      } else {
        // If server check fails but we have localStorage email, keep user logged in
        if (!storedEmail) {
          setPage("home");
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Only redirect if no localStorage email
      if (!localStorage.getItem("userEmail")) {
        setPage("home");
      }
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5001/auth/logout", {
        method: "GET",
        credentials: "include",
      });
  
      if (response.ok) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("token");
        setPage("home"); // This will redirect to HomePage
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const colors = getThemeColors();

  const updateStats = (type, value) => {
    setProjectStats(prev => ({
      ...prev,
      [type]: prev[type] + value
    }));
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${colors.cardBg} p-6 rounded-lg shadow-lg ${colors.text}`}>
          <h3 className="text-xl font-semibold">Total Enrolled</h3>
          <p className="text-3xl font-bold mt-2">{projectStats.totalEnrolled}</p>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {Math.floor(projectStats.totalEnrolled * 0.3)} in progress
          </p>
        </div>
        <div className={`${colors.cardBg} p-6 rounded-lg shadow-lg ${colors.text}`}>
          <h3 className="text-xl font-semibold">Total Tasks</h3>
          <p className="text-3xl font-bold mt-2">{projectStats.totalTasks}</p>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {projectStats.totalTasks - projectStats.completedTasks} pending
          </p>
        </div>
        <div className={`${colors.cardBg} p-6 rounded-lg shadow-lg ${colors.text}`}>
          <h3 className="text-xl font-semibold">Task Completion</h3>
          <p className="text-3xl font-bold mt-2">
            {projectStats.totalTasks > 0 
              ? Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100) 
              : 0}%
          </p>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {projectStats.completedTasks} completed tasks
          </p>
        </div>
      </div>

     
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent />;
      case 'projects':
        return <ProjectBoard updateStats={updateStats} isDarkMode={isDarkMode} />;
      case 'works':
        return <YourWorks isDarkMode={isDarkMode} />;
        case 'enroll':
          return <EnrollProject isDarkMode={isDarkMode} />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className={`min-h-screen ${colors.content} ${colors.text}`}>
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)}
        />
      )}
      <Navbar 
        colors={colors}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isDarkMode={isDarkMode}
        userEmail={userEmail}
        setPage={setPage}
      />

      <div className="flex pt-16">
        <Sidebar 
          colors={colors}
          sidebarOpen={sidebarOpen}
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}