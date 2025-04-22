// src/components/admin/GradeModal.jsx
import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseconfig';

export default function GradeModal({ colors, studentProject, onClose, onSubmitGrade }) {
  const [grade, setGrade] = useState(studentProject.existingGrade || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const projectRef = doc(db, 'projects', studentProject.project.id);
      await updateDoc(projectRef, {
        [`grades.${studentProject.student.id}`]: grade
      });
      
      onSubmitGrade();
      onClose();
    } catch (error) {
      console.error("Error submitting grade:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${colors.cardBg} rounded-lg p-6 w-full max-w-md`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${colors.text}`}>Set Grade</h2>
          <button onClick={onClose} className={`${colors.text} hover:text-gray-500`}>
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <p className={`${colors.text}`}>
            Student: <span className="font-semibold">{studentProject.student.name || studentProject.student.email}</span>
          </p>
          <p className={`${colors.text} mt-2`}>
            Project: <span className="font-semibold">{studentProject.project.title}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block ${colors.text} mb-2`}>Grade</label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={`w-full p-2 rounded border ${colors.border} ${colors.text} ${colors.cardBg}`}
              placeholder="Enter grade (e.g., A, B, 85%)"
              required
            />
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
              {isLoading ? 'Submitting...' : 'Submit Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}