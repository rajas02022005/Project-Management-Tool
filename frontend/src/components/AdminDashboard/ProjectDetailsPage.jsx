import { useState, useEffect } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaTasks, FaEdit, FaSave, FaInfoCircle, FaCalendarAlt, FaUserFriends, FaClipboardCheck } from 'react-icons/fa';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import Sidebar from './Sidebar';
import Navbar from '../navigation/Navbar';

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [project, setProject] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentTasks, setStudentTasks] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [activeSection, setActiveSection] = useState('projects');
  
  // Define colors based on dark mode
  const colors = {
    text: isDarkMode ? 'text-gray-200' : 'text-gray-800',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    sidebar: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
    navbar: isDarkMode ? 'bg-gray-900' : 'bg-white',
    hoverBg: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
    tableBg: isDarkMode ? 'bg-gray-700' : 'bg-gray-200',
    divider: isDarkMode ? 'divide-gray-700' : 'divide-gray-200',
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };
  
  // Handle section change - FIXED VERSION
  const handleSectionChange = (section) => {
    // Fixed navigation to properly set the active section when returning to dashboard
    navigate('/admindashboard', { state: { activeSection: section } });
  };
  
  // Fetch project data
  useEffect(() => {
    const darkModeFromStorage = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkModeFromStorage);
    
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Get project details
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (projectSnap.exists()) {
          const projectData = { id: projectSnap.id, ...projectSnap.data() };
          setProject(projectData);
          console.log("Project data fetched:", projectData);
          
          // Get enrolled students data
          if (projectData.enrolled && projectData.enrolled.length > 0) {
            const studentsData = [];
            const gradesObj = {};
            
            for (const studentId of projectData.enrolled) {
              const studentRef = doc(db, 'users', studentId);
              const studentSnap = await getDoc(studentRef);
              
              if (studentSnap.exists()) {
                const studentData = { id: studentSnap.id, ...studentSnap.data() };
                console.log("Fetched student data:", studentData); // Debug log
                studentsData.push(studentData);
                
                // Initialize grades
                gradesObj[studentId] = projectData.grades?.[studentId] || '';
                
                // Fetch student tasks
                await fetchStudentTasks(studentId, projectId);
              }
            }
            
            setEnrolledStudents(studentsData);
            setGrades(gradesObj);
          }
        } else {
          console.error("Project not found");
          navigate('/admindashboard', { state: { activeSection: 'projects' } });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project data:", error);
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId, navigate]);

  // Fetch tasks for a student
  const fetchStudentTasks = async (studentId, projectId) => {
    try {
      const tasksCollection = collection(db, 'projects', projectId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      
      const tasks = [];
      tasksSnapshot.forEach((doc) => {
        const taskData = doc.data();
        // Include only tasks created by this student
        if (taskData.createdBy === studentId) {
          tasks.push({
            id: doc.id,
            ...taskData
          });
        }
      });
      
      setStudentTasks(prev => ({
        ...prev,
        [studentId]: tasks
      }));
      
    } catch (error) {
      console.error(`Error fetching tasks for student ${studentId}:`, error);
    }
  };
  
  // Handle grade change
  const handleGradeChange = (studentId, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  };
  
  // Save grades
  const saveGrades = async () => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      
      await updateDoc(projectRef, {
        grades: grades
      });
      
      alert("Grades saved successfully!");
    } catch (error) {
      console.error("Error saving grades:", error);
      alert("Failed to save grades!");
    }
  };
  
  // Handle selecting a student to view detailed tasks
  const handleSelectStudent = (student) => {
    setSelectedStudent(selectedStudent?.id === student.id ? null : student);
  };
  
  // Handle logout
  const handleLogout = () => {
    // Implement logout functionality
    navigate('/homepage');
  };

  // Handle back to projects list
  const handleBackToProjects = () => {
    // Fixed navigation to properly set the active section to projects
    navigate('/admindashboard', { state: { activeSection: 'projects' } });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <Sidebar 
        colors={colors}
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        handleLogout={handleLogout}
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        sidebarOpen={sidebarOpen}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
        <Navbar 
          colors={colors}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          userEmail={userEmail}
        />
        
        <main className="flex-1 p-6 mt-16 overflow-auto">
          {project && (
            <div className="space-y-6">
              {/* Back button */}
              <button 
                onClick={handleBackToProjects}
                className="flex items-center gap-2 text-purple-500 hover:text-purple-400 mb-4 font-medium"
              >
                <FaArrowLeft /> Back to Projects List
              </button>
              
              {/* Expanded Project details card - Now fills more width and structured better */}
              <div className={`${colors.cardBg} rounded-lg shadow-lg p-6`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Project main info - Takes up more space */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <FaInfoCircle className="text-purple-500 text-xl" />
                      <h1 className="text-2xl font-bold">{project.title}</h1>
                    </div>
                    <div className={`border-l-4 border-purple-500 pl-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-r-lg`}>
                      <p className={`${colors.text} mb-2`}>{project.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <h3 className="font-semibold flex items-center gap-2 mb-2 text-purple-500">
                          <FaClipboardCheck /> Project Status
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            project.status === 'active' ? 'bg-green-500 text-white' : 
                            project.status === 'completed' ? 'bg-blue-500 text-white' : 
                            'bg-yellow-500 text-white'
                          }`}>
                            {project.status && project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                          <span className={`${colors.text} text-sm`}>
                            {project.status === 'active' ? '• Currently in progress' : 
                             project.status === 'completed' ? '• Finalized' : 
                             '• Not yet started'}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <h3 className="font-semibold flex items-center gap-2 mb-2 text-purple-500">
                          <FaUserFriends /> Team Information
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Group Limit</p>
                            <p className={`font-semibold ${colors.text}`}>{project.groupLimit || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Currently Enrolled</p>
                            <p className={`font-semibold ${colors.text}`}>{enrolledStudents.length} students</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Project dates and side info */}
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-5 rounded-lg`}>
                    <h3 className="font-semibold flex items-center gap-2 mb-4 text-purple-500 border-b pb-2 border-gray-600">
                      <FaCalendarAlt /> Project Timeline
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className={`font-semibold ${colors.text} text-lg`}>
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className={`font-semibold ${colors.text} text-lg`}>
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      
                      {/* Calculate days remaining */}
                      {project.dueDate && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <p className="text-sm text-gray-500">Days Remaining</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              new Date(project.dueDate) > new Date() ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {new Date(project.dueDate) > new Date() 
                                ? `${Math.ceil((new Date(project.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days left` 
                                : 'Past due'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enrolled students section */}
              <div className={`${colors.cardBg} rounded-lg shadow-lg overflow-hidden`}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FaUsers /> Enrolled Students ({enrolledStudents.length})
                  </h2>
                  <button 
                    onClick={saveGrades}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white"
                  >
                    <FaSave /> Save All Grades
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-200"}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Name</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Email</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Tasks</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Status</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Grade</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                      {enrolledStudents.length > 0 ? (
                        enrolledStudents.map((student) => (
                          <React.Fragment key={student.id}>
                            <tr 
                              className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} ${selectedStudent?.id === student.id ? isDarkMode ? 'bg-gray-700' : 'bg-gray-200' : ''}`}
                            >
                              <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                                {/* Fixed student name display - now uses name from SignUp if available, otherwise falls back to firstName/lastName */}
                                {student.name || `${student.firstName || ''} ${student.lastName || ''}`}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{student.email}</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                                {studentTasks[student.id]?.length || 0}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                                <div className="flex space-x-2">
                                  {studentTasks[student.id] && (
                                    <>
                                      <span className="px-2 py-1 rounded-full text-xs bg-gray-500 text-white">
                                        {studentTasks[student.id].filter(t => t.status === 'requested').length} Requested
                                      </span>
                                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-500 text-white">
                                        {studentTasks[student.id].filter(t => t.status === 'todo').length} Todo
                                      </span>
                                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500 text-white">
                                        {studentTasks[student.id].filter(t => t.status === 'inProgress').length} In Progress
                                      </span>
                                      <span className="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
                                        {studentTasks[student.id].filter(t => t.status === 'done').length} Done
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                                <input
                                  type="text"
                                  value={grades[student.id] || ''}
                                  onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                  className={`w-20 p-1 rounded ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                                  placeholder="Grade"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => handleSelectStudent(student)}
                                  className="flex items-center gap-2 text-purple-500 hover:text-purple-400"
                                >
                                  <FaTasks /> {selectedStudent?.id === student.id ? 'Hide Tasks' : 'View Tasks'}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expanded student tasks view */}
                            {selectedStudent?.id === student.id && (
                              <tr>
                                <td colSpan="6" className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} px-6 py-4`}>
                                  <div className="space-y-3">
                                    {/* Fixed student name display in expanded view */}
                                    <h3 className="font-semibold">{student.name || student.firstName || 'Student'}'s Tasks</h3>
                                    
                                    {studentTasks[student.id]?.length > 0 ? (
                                      <div className="space-y-3">
                                        {studentTasks[student.id].map(task => (
                                          <div 
                                            key={task.id} 
                                            className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg shadow`}
                                          >
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <h4 className="font-semibold">{task.title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                              </div>
                                              <span className={`px-2 py-1 rounded-full text-xs ${
                                                task.status === 'done' ? 'bg-green-500 text-white' : 
                                                task.status === 'inProgress' ? 'bg-blue-500 text-white' : 
                                                task.status === 'todo' ? 'bg-yellow-500 text-white' :
                                                'bg-gray-500 text-white'
                                              }`}>
                                                {task.status === 'inProgress' ? 'In Progress' : 
                                                task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 text-sm">
                                              <span className="text-gray-500">
                                                Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}
                                              </span>
                                              {task.lastUpdatedAt && (
                                                <span className="text-gray-500">
                                                  Updated: {new Date(task.lastUpdatedAt).toLocaleDateString()}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500">No tasks found for this student</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className={`px-6 py-4 text-center ${colors.text}`}>No students enrolled</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}