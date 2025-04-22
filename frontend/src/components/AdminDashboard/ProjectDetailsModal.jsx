// src/components/admin/ProjectDetailsModal.jsx
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import { FaTimes } from 'react-icons/fa';

export default function ProjectDetailsModal({
  colors,
  project,
  students,
  isDarkMode,
  onClose,
  onUpdateProject,
  onOpenGradeModal
}) {
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    startDate: project.startDate,
    dueDate: project.dueDate,
    groupLimit: project.groupLimit,
    status: project.status
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, formData);
      onUpdateProject();
      onClose();
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${colors.cardBg} rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${colors.text}`}>Project Details: {project.title}</h2>
          <button onClick={onClose} className={`${colors.text} hover:text-gray-500`}>
            <FaTimes />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Edit Project</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={`block ${colors.text} mb-2`}>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full p-2 rounded border ${colors.border} ${colors.text} ${colors.cardBg}`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block ${colors.text} mb-2`}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full p-2 rounded border ${colors.border} ${colors.text} ${colors.cardBg}`}
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block ${colors.text} mb-2`}>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`w-full p-2 rounded border ${colors.border} ${colors.text} ${colors.cardBg}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block ${colors.text} mb-2`}>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className={`w-full p-2 rounded border ${colors.border} ${colors.text} ${colors.cardBg}`}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className={`block ${colors.text} mb-2`}>Group Limit</label>
                <input
                  type="number"
                  name="groupLimit"
                  value={formData.groupLimit}
                  onChange={handleChange}
                  min="1"
                  className={`w-full p-2 rounded border ${colors.border} ${colors.text} ${colors.cardBg}`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block ${colors.text} mb-2`}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full p-2 rounded border ${colors.border} ${colors.text} ${colors.cardBg}`}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded ${colors.text} ${colors.hoverBg}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
          
          <div>
            <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Enrolled Students ({students.length})</h3>
            {students.length > 0 ? (
              <div className={`overflow-y-auto max-h-96 ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-200"}>
                    <tr>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${colors.text}`}>Name</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${colors.text}`}>Grade</th>
                      <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${colors.text}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {students.map(student => (
                      <tr key={student.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}>
                        <td className={`px-4 py-2 ${colors.text}`}>{student.name || student.email}</td>
                       
                        <td className={`px-4 py-2 ${colors.text}`}>
                          {student.grade || 'Not graded'}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => onOpenGradeModal(student, project)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            Set Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`${colors.text}`}>No students enrolled in this project</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}