// src/components/admin/Sidebar.jsx
import { FaChartLine, FaUsers, FaClipboardList, FaGraduationCap, FaSignOutAlt } from "react-icons/fa";

export default function Sidebar({ 
  colors, 
  activeSection, 
  setActiveSection, 
  handleLogout, 
  toggleDarkMode, 
  isDarkMode,
  sidebarOpen
}) {
  if (!sidebarOpen) return null;
  
  return (
    <div className={`fixed inset-y-0 left-0 w-64 ${colors.sidebar} shadow-xl ${colors.text} z-10 mt-16`}>
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaGraduationCap /> Admin Portal
          </h2>
          <button onClick={toggleDarkMode} className="text-gray-400 hover:text-white">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`w-full flex items-center px-4 py-2 rounded-lg ${
                  activeSection === 'dashboard' 
                    ? 'bg-purple-600 text-white' 
                    : `${colors.text} ${colors.hoverBg}`
                }`}
              >
                <FaChartLine className="mr-3" /> Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('projects')}
                className={`w-full flex items-center px-4 py-2 rounded-lg ${
                  activeSection === 'projects' 
                    ? 'bg-purple-600 text-white' 
                    : `${colors.text} ${colors.hoverBg}`
                }`}
              >
                <FaClipboardList className="mr-3" /> Projects
              </button>
            </li>
            <li>
           
            </li>
            <li>
              <button
                onClick={() => setActiveSection('reports')}
                className={`w-full flex items-center px-4 py-2 rounded-lg ${
                  activeSection === 'reports' 
                    ? 'bg-purple-600 text-white' 
                    : `${colors.text} ${colors.hoverBg}`
                }`}
              >
                <FaChartLine className="mr-3" /> Reports
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="px-4 py-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 rounded-lg text-red-500 hover:bg-red-500 hover:text-white"
          >
            <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}