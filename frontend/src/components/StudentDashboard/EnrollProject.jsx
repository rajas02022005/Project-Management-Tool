import { useState, useEffect } from 'react';
import { FaClipboardCheck, FaListUl, FaTh, FaCheck } from 'react-icons/fa';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseconfig';
import Toast from '../Toast';
import Navbar from '../Navigation/Navbar';
import Sidebar from '../Navigation/Sidebar';
import { useNavigate } from 'react-router-dom';

export default function EnrollProject({ isDarkMode: propIsDarkMode, setIsDarkMode: setAppIsDarkMode }) {
  // Define all necessary state variables
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode);
  const [activeSection, setActiveSection] = useState('enroll');
  const [userEmail, setUserEmail] = useState('');
  const [projects, setProjects] = useState([]);
  const [enrolledProjects, setEnrolledProjects] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  // In EnrollProject.jsx, update the colors object:
  const colors = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    card: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    btnPrimary: 'bg-purple-600 hover:bg-purple-500 text-white',
    btnSecondary: isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    btnDisabled: isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed',
    navbar: isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800",
    sidebar: isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800", // Ensure text is white in dark mode
    main: isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800",
  };
  
  // At the beginning of EnrollProject component
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode !== null) {
      const darkMode = storedDarkMode === 'true';
      setIsDarkMode(darkMode);
      // If there's a parent component that controls dark mode
      if (setAppIsDarkMode) {
        setAppIsDarkMode(darkMode);
      }
    } else if (propIsDarkMode !== undefined) {
      // If no localStorage but prop is passed
      setIsDarkMode(propIsDarkMode);
    }
  }, []);
  
  // Update this function to ensure it affects both local and app-level dark mode
  const handleDarkModeChange = (newDarkMode) => {
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (setAppIsDarkMode) {
      setAppIsDarkMode(newDarkMode);
    }
  };

  useEffect(() => {
    const getCurrentUser = () => {
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email); // Set email for navbar
        return user.uid;
      }
      return '';
    };

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const uid = getCurrentUser();
        
        // Fetch all projects
        const projectsCollection = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsCollection);
        const projectsList = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsList);
        
        // Get user's enrolled projects
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const enrolledProjectIds = userData.enrolledProjects || [];
            setEnrolledProjects(enrolledProjectIds);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setToastMessage('Failed to load projects');
        setToastType('error');
        setShowToast(true);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Check if a project has reached its group limit
  const isProjectFull = (project) => {
    return project.enrolled && project.enrolled.length >= project.groupLimit;
  };

  const handleEnroll = async (projectId) => {
    try {
      if (!userId) {
        setToastMessage('Please sign in to enroll in projects');
        setToastType('error');
        setShowToast(true);
        return;
      }
      
      // Get the project data
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        setToastMessage('Project not found');
        setToastType('error');
        setShowToast(true);
        return;
      }
      
      const projectData = projectDoc.data();
      
      // Check if project is full
      if (projectData.enrolled && projectData.enrolled.length >= projectData.groupLimit) {
        setToastMessage('This project is full');
        setToastType('error');
        setShowToast(true);
        return;
      }
      
      // Update user's enrolled projects
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentEnrolledProjects = userData.enrolledProjects || [];
        
        if (!currentEnrolledProjects.includes(projectId)) {
          const updatedEnrolledProjects = [...currentEnrolledProjects, projectId];
          
          await updateDoc(userRef, {
            enrolledProjects: updatedEnrolledProjects
          });
          
          // Update project's enrolled students
          const currentEnrolled = projectData.enrolled || [];
          
          if (!currentEnrolled.includes(userId)) {
            await updateDoc(projectRef, {
              enrolled: [...currentEnrolled, userId]
            });
          }
          
          // Update local state
          setEnrolledProjects([...currentEnrolledProjects, projectId]);
          
          setToastMessage('Successfully enrolled in project!');
          setToastType('success');
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Error enrolling in project:', error);
      setToastMessage('Failed to enroll in project');
      setToastType('error');
      setShowToast(true);
    }
  };

  const isEnrolled = (projectId) => {
    return enrolledProjects.includes(projectId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'card' ? 'list' : 'card');
  };

  // Fix navigation in EnrollProject.jsx
  const handleNavigation = (section) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
    
    // Direct navigation to specific routes
    if (section === 'dashboard') {
      navigate('/dashboard');
    } else if (section === 'enroll') {
      navigate('/enrollproject');
    } else if (section === 'works') { // Changed from 'your works' to 'works'
      navigate('/projectboard');
    } else {
      // Fallback to dashboard if unknown section
      navigate('/dashboard');
    }
  };

  // Card view for projects
  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <div 
          key={project.id} 
          className={`${colors.card} rounded-lg shadow-lg overflow-hidden border ${colors.border} flex flex-col`}
        >
          <div className="p-6 flex-grow">
            <h3 className={`text-xl font-bold mb-2 ${colors.text}`}>{project.title}</h3>
            <div className={`mb-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className="mb-1"><span className="font-semibold">Start:</span> {formatDate(project.startDate)}</p>
              <p><span className="font-semibold">Due:</span> {formatDate(project.dueDate)}</p>
            </div>
            <p className={`${colors.text} mb-4 text-sm`}>{project.description}</p>
            <div className="flex items-center justify-between mt-auto">
              <span className={`text-xs px-2 py-1 rounded-full ${
                project.status === 'active' ? 'bg-green-500 text-white' : 
                project.status === 'completed' ? 'bg-blue-500 text-white' : 
                'bg-yellow-500 text-white'
              }`}>
                {project.status && project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Group Limit: {project.enrolled?.length || 0}/{project.groupLimit}
              </span>
            </div>
          </div>
          <div className={`px-6 py-3 border-t ${colors.border}`}>
            {isEnrolled(project.id) ? (
              <button 
                disabled 
                className={`w-full py-2 px-4 rounded flex items-center justify-center gap-2 ${colors.btnDisabled}`}
              >
                <FaCheck /> Enrolled
              </button>
            ) : isProjectFull(project) ? (
              <button 
                disabled 
                className={`w-full py-2 px-4 rounded flex items-center justify-center gap-2 ${colors.btnDisabled}`}
              >
                Full
              </button>
            ) : (
              <button 
                onClick={() => handleEnroll(project.id)} 
                className={`w-full py-2 px-4 rounded flex items-center justify-center gap-2 ${colors.btnPrimary}`}
              >
                <FaClipboardCheck /> Enroll Now
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // List view for projects
  const ListView = () => (
    <div className={`${colors.card} rounded-lg shadow-lg overflow-hidden border ${colors.border}`}>
      <table className="min-w-full divide-y divide-gray-700">
        <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}>
          <tr>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Project</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Start Date</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Due Date</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Status</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Group Limit</th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Action</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
          {projects.length > 0 ? (
            projects.map(project => (
              <tr key={project.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}>
                <td className={`px-6 py-4 ${colors.text}`}>
                  <div>
                    <div className="font-medium">{project.title}</div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} truncate max-w-xs`}>
                      {project.description}
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{formatDate(project.startDate)}</td>
                <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{formatDate(project.dueDate)}</td>
                <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    project.status === 'active' ? 'bg-green-500 text-white' : 
                    project.status === 'completed' ? 'bg-blue-500 text-white' : 
                    'bg-yellow-500 text-white'
                  }`}>
                    {project.status && project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                  {project.enrolled?.length || 0}/{project.groupLimit}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                  {isEnrolled(project.id) ? (
                    <button 
                      disabled 
                      className={`py-1 px-3 rounded text-sm flex items-center gap-1 ${colors.btnDisabled}`}
                    >
                      <FaCheck className="text-xs" /> Enrolled
                    </button>
                  ) : isProjectFull(project) ? (
                    <button 
                      disabled 
                      className={`py-1 px-3 rounded text-sm flex items-center gap-1 ${colors.btnDisabled}`}
                    >
                      Full
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEnroll(project.id)} 
                      className={`py-1 px-3 rounded text-sm flex items-center gap-1 ${colors.btnPrimary}`}
                    >
                      <FaClipboardCheck className="text-xs" /> Enroll
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className={`px-6 py-4 text-center ${colors.text}`}>No projects available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
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
      />
      
      <Sidebar 
        colors={colors}
        sidebarOpen={sidebarOpen}
        isDarkMode={isDarkMode}
        setIsDarkMode={handleDarkModeChange}
        activeSection={activeSection}
        setActiveSection={handleNavigation}
      />
      
      <main className={`${colors.main} transition-all duration-300 ease-in-out pt-20 ${sidebarOpen ? "pl-64" : "pl-16"}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${colors.text}`}>Enroll in Projects</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleViewMode} 
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} ${colors.text}`}
                title={viewMode === 'card' ? 'Switch to List View' : 'Switch to Card View'}
              >
                {viewMode === 'card' ? <FaListUl /> : <FaTh />}
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className={`flex justify-center items-center p-12 ${colors.card} rounded-lg shadow-md`}>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className={`p-8 ${colors.card} rounded-lg shadow-md text-center ${colors.text}`}>
              <h3 className="text-xl font-semibold mb-2">No Projects Available</h3>
              <p>There are currently no projects available for enrollment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {viewMode === 'card' ? <CardView /> : <ListView />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}