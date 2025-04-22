import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const ReportsSection = ({ stats, projects, students, colors, isDarkMode }) => {
  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-bold mb-6 ${colors.text}`}>Reports & Analytics</h1>

     

      <div className={`${colors.cardBg} p-6 rounded-lg shadow-lg ${colors.text}`}>
        <h3 className="text-xl font-semibold mb-4">Project Performance</h3>
        <table className="min-w-full divide-y divide-gray-700">
          <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-200"}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Project</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Enrollment</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Avg. Grade</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${colors.text}`}>Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {projects.map(project => {
              let totalGrade = 0;
              let gradedStudents = 0;

              if (project.grades) {
  Object.values(project.grades).forEach(grade => {
    // Direct grade value, not an object with a score property
    const numericGrade = parseGradeToNumber(grade);
    if (numericGrade !== null) {
      totalGrade += numericGrade;
      gradedStudents++;
    }
  });
}

              const avgGrade = gradedStudents > 0 ? (totalGrade / gradedStudents).toFixed(1) : 'N/A';
              const enrollmentRate = project.groupLimit > 0 ?
                ((project.enrolled?.length || 0) / project.groupLimit * 100).toFixed(0) + '%' : 'N/A';
                function parseGradeToNumber(grade) {
  // If grade is already a number or percentage
  if (!isNaN(grade)) {
    return parseFloat(grade);
  }
  // If grade ends with %
  if (typeof grade === 'string' && grade.endsWith('%')) {
    return parseFloat(grade);
  }
  // If grade is a letter grade
  if (typeof grade === 'string') {
    const letterGrades = {
      'A+': 95, 'A': 90, 
      'B+': 85, 'B': 80, 
      'C+': 75, 'C': 70, 
      'D+': 66, 'D': 60, 
      'E+': 55, 'E': 50, 

      'F': 40
    };
    return letterGrades[grade.toUpperCase()] || null;
  }
  return null;
}
              return (
                <tr key={project.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{project.title}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                    {project.enrolled?.length || 0} / {project.groupLimit} ({enrollmentRate})
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>{avgGrade}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${colors.text}`}>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'active' ? 'bg-green-500 text-white' :
                      project.status === 'completed' ? 'bg-blue-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsSection;
