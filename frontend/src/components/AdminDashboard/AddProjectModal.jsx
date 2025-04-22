// src/components/admin/AddProjectModal.jsx
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';

export default function AddProjectModal({ colors, onClose, onAddProject }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    groupLimit: 1,
    status: 'active'
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
      const projectsRef = collection(db, 'projects');
      const docRef = await addDoc(projectsRef, {
        ...formData,
        enrolled: [],
        tasks: [],
        createdAt: new Date()
      });
      
      onAddProject({ id: docRef.id, ...formData });
      onClose();
    } catch (error) {
      console.error("Error adding project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${colors.cardBg} rounded-lg p-6 w-full max-w-md`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${colors.text}`}>Add New Project</h2>
          <button onClick={onClose} className={`${colors.text} hover:text-gray-500`}>
            &times;
          </button>
        </div>
        
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
              {isLoading ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}