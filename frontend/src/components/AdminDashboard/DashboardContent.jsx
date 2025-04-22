// src/components/admin/DashboardContent.jsx
import { FaPlus } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function DashboardContent({ colors, stats, projects, isDarkMode, setShowAddProjectModal }) {
  // Chart data
  const projectStatusData = [
    { name: 'Active', value: stats.activeProjects },
    { name: 'Completed', value: stats.completedProjects },
    { name: 'Pending', value: projects.filter(p => p.status === 'pending').length }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-bold mb-6 ${colors.text}`}>Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${colors.cardBg} p-6 rounded-lg shadow-lg ${colors.text}`}>
          <h3 className="text-xl font-semibold">Total Projects</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalProjects}</p>
        </div>
        
        <div className={`${colors.cardBg} p-6 rounded-lg shadow-lg ${colors.text}`}>
          <h3 className="text-xl font-semibold">Active Projects</h3>
          <p className="text-3xl font-bold mt-2">{stats.activeProjects}</p>
        </div>
        
        <div className={`${colors.cardBg} p-6 rounded-lg shadow-lg ${colors.text}`}>
          <h3 className="text-xl font-semibold">Tasks Completion</h3>
          <p className="text-3xl font-bold mt-2">{stats.completedTasks}/{stats.totalTasks}</p>
        </div>
      </div>

      <div className={`${colors.cardBg} p-4 rounded-lg shadow-lg ${colors.text}`}>
        <h3 className="text-lg font-semibold mb-2">Project Status</h3>
        <div className="flex justify-center">
          <PieChart width={250} height={200}>
            <Pie
              data={projectStatusData}
              cx={125}
              cy={70}
              innerRadius={50}
              outerRadius={70}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label
            >
              {projectStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', color: isDarkMode ? '#fff' : '#000' }} />
            <Legend layout="horizontal" verticalAlign="bottom" height={36} />
          </PieChart>
        </div>
      </div>
    </div>
  );
}