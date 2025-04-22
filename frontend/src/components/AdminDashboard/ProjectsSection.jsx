// src/components/admin/ProjectsSection.jsx
import { FaPlus, FaEdit, FaTrash, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProjectsSection({ 
  colors, 
  projects, 
  isDarkMode, 
  handleViewProjectDetails, 
  handleDeleteProject,
  setShowAddProjectModal
}) {
  const navigate = useNavigate();
  
  // Function to navigate to project details view
  const goToProjectDetails = (projectId) => {
    navigate(`/admindashboard/projectdetailspage/${projectId}`);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${colors.text}`}>Project Management</h1>
        <button 
          onClick={() => setShowAddProjectModal(true)} 
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-white"
        >
          <FaPlus /> Add Project
        </button>
      </div>

      <div className={`${colors.cardBg} rounded-lg shadow-lg overflow-hidden`}>
        <table className="min-w-full divide-y divide-gray-700">
          <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-200"}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Title</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Start Date</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Due Date</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Group Limit</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Enrolled</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {projects.length > 0 ? (
              projects.map((project) => (
                <tr 
                  key={project.id} 
                  className={`cursor-pointer ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  onClick={() => goToProjectDetails(project.id)}
                >
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{project.title}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                    {project.startDate && new Date(project.startDate).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                    {project.dueDate && new Date(project.dueDate).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{project.groupLimit}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{project.enrolled?.length || 0}</td>
                
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'active' ? 'bg-green-500 text-white' : 
                      project.status === 'completed' ? 'bg-blue-500 text-white' : 
                      'bg-yellow-500 text-white'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          goToProjectDetails(project.id);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="View Project Details and Students"
                      >
                        <FaUsers />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProjectDetails(project);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit Project"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Project"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className={`px-6 py-4 text-center ${colors.text}`}>No projects found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}