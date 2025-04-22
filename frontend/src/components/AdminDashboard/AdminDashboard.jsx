// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseconfig';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Import components
import Sidebar from './Sidebar';
import Navbar from '../navigation/Navbar';
import DashboardContent from './DashboardContent';
import ProjectsSection from './ProjectsSection';
import StudentsSection from './StudentsSection';
import ReportsSection from './ReportsSection';
import Toast from "../Toast";
import AddProjectModal from './AddProjectModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import GradeModal from './GradeModal';

export default function AdminDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedStudentProject, setSelectedStudentProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectStudents, setProjectStudents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  
  // Summary data for dashboard stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0
  });
  
  const navigate = useNavigate();

  const getThemeColors = () => ({
    sidebar: isDarkMode ? 'bg-gray-800' : 'bg-white',
    navbar: isDarkMode ? 'bg-gray-800' : 'bg-white',
    content: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    hoverBg: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
  });

  const colors = getThemeColors();

  useEffect(() => {
    checkAuth();
    fetchProjects();
    fetchStudents();
  }, []);

  const checkAuth = () => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
    
    if (!email || email !== 'admin@gmail.com') {
      navigate('/signin');
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsCollection = collection(db, 'projects');
      const projectsSnapshot = await getDocs(projectsCollection);
      const projectsList = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProjects(projectsList);
      
      // Update stats
      let totalTasks = 0;
      let completedTasks = 0;
      
      // Get task counts for each project
      for (const project of projectsList) {
        const tasksCollection = collection(db, 'projects', project.id, 'tasks');
        const tasksSnapshot = await getDocs(tasksCollection);
        totalTasks += tasksSnapshot.size;
        
        tasksSnapshot.docs.forEach(doc => {
          if (doc.data().status === 'done') {
            completedTasks++;
          }
        });
      }
      
      setStats(prev => ({
        ...prev,
        totalProjects: projectsList.length,
        activeProjects: projectsList.filter(p => p.status === 'active').length,
        completedProjects: projectsList.filter(p => p.status === 'completed').length,
        totalTasks,
        completedTasks
      }));
      
    } catch (error) {
      console.error("Error fetching projects:", error);
      setToastMessage("Failed to load projects");
      setToastType("error");
      setShowToast(true);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStudents(studentsList);
      setStats(prev => ({
        ...prev,
        totalStudents: studentsList.length
      }));
      
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchProjectStudents = async (projectId) => {
    try {
      // Get project details to access enrolled student IDs
      const project = projects.find(p => p.id === projectId);
      
      if (!project || !project.enrolled || project.enrolled.length === 0) {
        setProjectStudents([]);
        return;
      }
      
      // For each enrolled student ID, fetch their details and project progress
      const enrolledStudents = [];
      
      // Get student details for each enrolled student
      for (const studentId of project.enrolled) {
        // Find student in our already fetched students list
        const student = students.find(s => s.id === studentId);
        
        if (student) {
          // Fetch progress data for this student on this project
          const progressQuery = query(
            collection(db, 'projectProgress'),
            where('projectId', '==', projectId),
            where('studentId', '==', studentId)
          );
          
          const progressSnapshot = await getDocs(progressQuery);
          let progressData = { status: 'Not started', completedTasks: 0, totalTasks: 0 };
          
          if (!progressSnapshot.empty) {
            progressData = progressSnapshot.docs[0].data();
          }
          
          enrolledStudents.push({
            ...student,
            progress: progressData,
            grade: project.grades ? project.grades[studentId] : null
          });
        }
      }
      
      setProjectStudents(enrolledStudents);
      
    } catch (error) {
      console.error("Error fetching project students:", error);
    }
  };

  const handleViewProjectDetails = (project) => {
    setSelectedProject(project);
    fetchProjectStudents(project.id);
    setShowProjectDetailsModal(true);
  };
 
  const handleOpenGradeModal = (student, project) => {
    setSelectedStudentProject({
      student,
      project,
      existingGrade: project.grades ? project.grades[student.id] : null
    });
    
    setShowGradeModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userEmail');
      navigate('/homepage');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

// In AdminDashboard.jsx, add this function above the return statement:

const handleDeleteProject = async (projectId) => {
  try {
    // Reference to the project document
    const projectRef = doc(db, 'projects', projectId);
    
    // Delete the project document
    await deleteDoc(projectRef);
    
    // Show success message
    setToastMessage("Project successfully deleted");
    setToastType("success");
    setShowToast(true);
    
    // Refresh projects list
    fetchProjects();
  } catch (error) {
    console.error("Error deleting project:", error);
    setToastMessage("Failed to delete project");
    setToastType("error");
    setShowToast(true);
  }
};
  return (
    <div className={`min-h-screen flex ${colors.content}`}>
      {/* Navbar Component */}
      <Navbar 
        colors={colors}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isDarkMode={isDarkMode}
        userEmail={userEmail}
      />
      
      {/* Sidebar Component */}
      <Sidebar
        colors={colors}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} w-full p-8 mt-16`}>
        {activeSection === 'dashboard' && 
          <DashboardContent 
            colors={colors} 
            stats={stats} 
            projects={projects}
            isDarkMode={isDarkMode}
            setShowAddProjectModal={setShowAddProjectModal}
          />
        }
        
        {activeSection === 'projects' && 
  <ProjectsSection 
    colors={colors} 
    projects={projects} 
    isDarkMode={isDarkMode}
    handleViewProjectDetails={handleViewProjectDetails}
    handleDeleteProject={handleDeleteProject}
    setShowAddProjectModal={setShowAddProjectModal}
  />
}
          
        
        {activeSection === 'students' && 
          <StudentsSection 
            colors={colors} 
            students={students} 
            projects={projects}
            isDarkMode={isDarkMode} 
          />
        }
        
        {activeSection === 'reports' && 
          <ReportsSection 
            colors={colors} 
            stats={stats} 
            projects={projects}
            students={students}
            isDarkMode={isDarkMode} 
          />
        }
      </div>

      {/* Toast notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Modals */}
      {showAddProjectModal && (
        <AddProjectModal
          colors={colors}
          onClose={() => setShowAddProjectModal(false)}
          onAddProject={(projectData) => {
            // Implement add project functionality
            fetchProjects(); // Refresh projects after addition
          }}
        />
      )}

      {showProjectDetailsModal && selectedProject && (
        <ProjectDetailsModal
          colors={colors}
          project={selectedProject}
          students={projectStudents}
          isDarkMode={isDarkMode}
          onClose={() => setShowProjectDetailsModal(false)}
          onUpdateProject={() => {
            fetchProjects(); // Refresh projects after update
          }}
          onOpenGradeModal={handleOpenGradeModal}
        />
      )}

      {showGradeModal && selectedStudentProject && (
        <GradeModal
          colors={colors}
          studentProject={selectedStudentProject}
          onClose={() => setShowGradeModal(false)}
          onSubmitGrade={() => {
            fetchProjects(); // Refresh projects after grading
            
            // If project details modal is open, refresh the students data
            if (showProjectDetailsModal && selectedProject) {
              fetchProjectStudents(selectedProject.id);
            }
          }}
        />
      )}
    </div>
  );
}

