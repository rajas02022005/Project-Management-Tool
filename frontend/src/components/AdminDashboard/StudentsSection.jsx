// src/components/admin/StudentsSection.jsx

export default function StudentsSection({ colors, students, projects, isDarkMode }) {
    return (
      <div className="space-y-6">
        <h1 className={`text-2xl font-bold mb-6 ${colors.text}`}>Student Management</h1>
  
        <div className={`${colors.cardBg} rounded-lg shadow-lg overflow-hidden`}>
          <table className="min-w-full divide-y divide-gray-700">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-200"}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Name</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Email</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Projects</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Average Grade</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Created At</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {students.length > 0 ? (
                students.map((student) => {
                  // Calculate average grade
                  let totalGrade = 0;
                  let gradedProjects = 0;
                  
                  projects.forEach(project => {
                    if (project.grades && project.grades[student.id]) {
                      totalGrade += parseFloat(project.grades[student.id].score) || 0;
                      gradedProjects++;
                    }
                  });
                  
                  const avgGrade = gradedProjects > 0 ? (totalGrade / gradedProjects).toFixed(1) : 'N/A';
                  
                  // Count enrolled projects
                  const enrolledProjects = projects.filter(p => p.enrolled?.includes(student.id)).length;
                  
                  return (
                    <tr key={student.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}>
                      <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{student.name || 'Unknown'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{student.email}</td>
                      <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{enrolledProjects}</td>
                      <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{avgGrade}</td>
                      <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className={`px-6 py-4 text-center ${colors.text}`}>No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }