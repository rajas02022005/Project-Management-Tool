import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Page imports
import HomePage from "./components/HomePage";
import Dashboard from "./components/StudentDashboard/Dashboard";
import EnrollProject from "./components/StudentDashboard/EnrollProject";

import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import ForgotPassword from "./components/ForgotPassword";
import Toast from "./components/Toast";

import AdminDashboard from "./components/AdminDashboard/admindashboard";
import ProjectsSection from "./components/AdminDashboard/ProjectsSection";
import ProjectDetailsPage from "./components/AdminDashboard/ProjectDetailsPage";
import StudentsSection from "./components/AdminDashboard/StudentsSection";
import ReportsSection from "./components/AdminDashboard/ReportsSection";
import DashboardContent from "./components/AdminDashboard/DashboardContent";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [projects, setProjects] = useState([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  
  // Define color schemes based on dark/light mode
  const colors = {
    sidebar: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    header: isDarkMode ? 'bg-gray-800' : 'bg-white',
    main: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
    text: isDarkMode ? 'text-white' : 'text-gray-800',
    navItem: isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200',
    navActive: isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-900',
    cardBg: isDarkMode ? 'bg-gray-750' : 'bg-white',
  };
  
  // Define handler functions
  const handleViewProjectDetails = (projectId) => {
    // Navigate to project details - you might need to use useNavigate hook 
    // or history from react-router-dom for this
  };
  
  const handleDeleteProject = (projectId) => {
    // Delete project logic
  };
  
  // If you need to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch user role from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // Create user document if it doesn't exist
            const ADMIN_EMAIL = "innovativeteachingfeedback@gmail.com";
            const userRole = user.email === ADMIN_EMAIL ? "admin" : "student";
            
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              role: userRole,
              createdAt: new Date().toISOString()
            });
            
            setUserRole(userRole);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          showNotification("Error loading user data", "error");
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  const showNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  // Protected route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-xl">Loading...</div>
        </div>
      );
    }
    
    if (!currentUser) {
      return <Navigate to="/signin" />;
    }
    
    // Special override for admin email
    if (currentUser.email === "admin@gmail.com" && 
        allowedRoles.includes("admin")) {
      return children;
    }
    
    // Check if user role is allowed
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      showNotification("Access denied. Insufficient permissions.", "error");
      return <Navigate to="/" />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="App">
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUp showNotification={showNotification} />} />
          <Route path="/signin" element={<SignIn showNotification={showNotification} />} />
          <Route path="/forgotpassword" element={<ForgotPassword showNotification={showNotification} />} />
          <Route path="/enrollproject" element={<EnrollProject showNotification={showNotification} />} />
          <Route path="/projectdetailspage" element={<ProjectDetailsPage showNotification={showNotification} />} />

          
          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          {/* Main Admin dashboard */}
          <Route path="/admindashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin dashboard content section */}
          <Route path="/admindashboard/dashboardcontent" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardContent />
            </ProtectedRoute>
          } />
          
          {/* Projects section */}
          <Route path="/admindashboard/projectssection" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ProjectsSection 
                colors={colors} 
                projects={projects} 
                isDarkMode={isDarkMode} 
                handleViewProjectDetails={handleViewProjectDetails} 
                handleDeleteProject={handleDeleteProject}
                setShowAddProjectModal={setShowAddProjectModal}
              />
            </ProtectedRoute>
          } />
            <Route path="/admindashboard/projectdetailspage/:projectId" element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <ProjectDetailsPage />
    </ProtectedRoute>
  } />
  
          {/* Project details page */}
          <Route path="/admindashboard/projectssection/:projectId" element={
    <Navigate to="/admindashboard/projectdetailspage/:projectId" replace />
  } />
          
          {/* Students section */}
        <Route path="/admindashboard/studentssection" element={
  <ProtectedRoute allowedRoles={["admin"]}>
    <StudentsSection colors={colors} isDarkMode={isDarkMode} />
  </ProtectedRoute>
} />
          
          {/* Reports section */}
          <Route path="/admindashboard/reportssection" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportsSection />
            </ProtectedRoute>
          } />
          
          {/* Add routes for /admin/projects which is causing the error */}
          <Route path="/admin/projects" element={
            <Navigate to="/admindashboard/projectssection" replace />
          } />
          
          {/* Add a catch-all route for admin paths that may be incorrectly formatted */}
          <Route path="/admin/*" element={
            <Navigate to="/admindashboard" replace />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;