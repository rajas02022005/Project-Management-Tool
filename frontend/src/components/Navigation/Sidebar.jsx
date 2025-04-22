import { FaHome, FaBriefcase, FaTasks, FaUserFriends, FaCalendarAlt, FaMoon, FaSun, FaUpload, FaClipboardCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ 
  colors, 
  sidebarOpen, 
  isDarkMode, 
  setIsDarkMode, 
  activeSection, 
  setActiveSection 
}) {
  const navigate = useNavigate();
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

// In Sidebar.jsx
const handleNavigation = (section) => {
  setActiveSection(section);
  
  // Handle actual navigation based on section
  switch(section) {
    case 'dashboard':
      navigate('/dashboard');
      break;
    case 'enroll':
      navigate('/enrollproject');
      break;
    case 'projects':
      // Instead of always navigating to dashboard with different active sections
      // Navigate to specific routes
      navigate('/dashboard');
      setActiveSection('projects'); // This ensures the right section is active
      break;
    case 'works':
      navigate('/dashboard');
      setActiveSection('works');
      break;
  
 
    default:
      navigate('/dashboard');
  }
  
  // Store the active section in localStorage for persistence
  localStorage.setItem('activeSection', section);
};

  return (
    <aside 
      className={`fixed left-0 top-16 bottom-0 transition-all duration-300 ease-in-out z-30 
      ${isDarkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'} ${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col`}
    >
      <nav className="p-4 space-y-4 flex-grow">
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handleNavigation('dashboard');
          }}
          className={`flex items-center gap-3 p-2 rounded overflow-hidden transition-colors
            ${activeSection === 'dashboard' 
              ? 'bg-purple-500 text-white' 
              : isDarkMode 
        ? 'hover:bg-gray-700 text-white' // Added text-white for dark mode
        : 'hover:bg-gray-100 text-gray-800'}`}
        >
          <FaHome /> {sidebarOpen && 'Dashboard'}
        </a>
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handleNavigation('enroll');
          }}
          className={`flex items-center gap-3 p-2 rounded overflow-hidden transition-colors
            ${activeSection === 'enroll' 
              ? 'bg-purple-500 text-white' 
              : isDarkMode 
                ? 'hover:bg-gray-700' 
                : 'hover:bg-gray-100'}`}
        >
          <FaBriefcase /> {sidebarOpen && 'Enroll Project'}
        </a>
        <a 
  href="#" 
  onClick={(e) => {
    e.preventDefault();
    handleNavigation('projects'); // Changed from 'works' to 'projects' for consistency
  }}
  className={`flex items-center gap-3 p-2 rounded overflow-hidden transition-colors
    ${activeSection === 'projects' 
      ? 'bg-purple-500 text-white' 
      : isDarkMode 
        ? 'hover:bg-gray-700 text-white' // Added text-white for dark mode
        : 'hover:bg-gray-100 text-gray-800'}`} // Added text-gray-800 for light mode
>
  <FaTasks /> {sidebarOpen && 'Your Works'}
</a>

      
      </nav>

      {/* Theme Toggle */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-4 w-full p-2 rounded transition-colors
            ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          {isDarkMode ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-600" />}
          {sidebarOpen && (isDarkMode ? 'Light Mode' : 'Dark Mode')}
        </button>
      </div>
    </aside>
  );
}