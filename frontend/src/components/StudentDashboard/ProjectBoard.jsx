import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaPlus, FaEdit, FaTrash, FaTasks, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../../firebaseconfig';

export default function ProjectBoard({ updateStats, isDarkMode }) {
  const [projects, setProjects] = useState([]);
  const [columns, setColumns] = useState({
    requested: { title: 'REQUESTED', items: [] },
    todo: { title: 'TO DO', items: [] },
    inProgress: { title: 'IN PROGRESS', items: [] },
    done: { title: 'DONE', items: [] }
  });
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '' });
  const [activeProject, setActiveProject] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'project'
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Load enrolled projects and user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        setUserId(user.uid);
        
        // Check if user is admin (adjust this based on your authentication setup)
        setIsAdmin(user.email === "innovativeteachingfeedback@gmail.com");
        
        // Get user's enrolled projects
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const enrolledProjectIds = userData.enrolledProjects || [];
          
          if (enrolledProjectIds.length > 0) {
            // Fetch full project data for enrolled projects
            const enrolledProjectsData = [];
            for (const projectId of enrolledProjectIds) {
              const projectDoc = await getDoc(doc(db, 'projects', projectId));
              if (projectDoc.exists()) {
                enrolledProjectsData.push({
                  id: projectId,
                  ...projectDoc.data(),
                  expanded: false
                });
              }
            }
            
            setProjects(enrolledProjectsData);
            
            // Load tasks for all enrolled projects
            await loadAllProjectTasks(enrolledProjectIds);
          }
        }
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error loading user data:", error);
        setIsDataLoaded(true);
      }
    };
    
    const loadAllProjectTasks = async (projectIds) => {
      try {
        const newColumns = {
          requested: { title: 'REQUESTED', items: [] },
          todo: { title: 'TO DO', items: [] },
          inProgress: { title: 'IN PROGRESS', items: [] },
          done: { title: 'DONE', items: [] }
        };
        
        for (const projectId of projectIds) {
          const tasksCollection = collection(db, 'projects', projectId, 'tasks');
          const tasksSnapshot = await getDocs(tasksCollection);
          
          tasksSnapshot.forEach(taskDoc => {
            const taskData = taskDoc.data();
            const task = {
              id: taskDoc.id,
              projectId: projectId,
              title: taskData.title,
              description: taskData.description,
              tag: taskData.tag || `Task-${Math.floor(Math.random() * 1000)}`,
              status: taskData.status || 'requested',
              createdBy: taskData.createdBy || userId
            };
            
            if (newColumns[task.status]) {
              newColumns[task.status].items.push(task);
            } else {
              newColumns.requested.items.push(task);
            }
          });
        }
        
        setColumns(newColumns);
      } catch (error) {
        console.error("Error loading project tasks:", error);
      }
    };
    
    // Load data from localStorage if available
    const loadDataFromLocalStorage = () => {
      try {
        const savedViewMode = localStorage.getItem('viewMode');
        const savedCurrentProjectId = localStorage.getItem('currentProjectId');
        
        if (savedViewMode) {
          setViewMode(savedViewMode);
        }
        
        if (savedCurrentProjectId) {
          setCurrentProjectId(savedCurrentProjectId);
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    };
    
    loadUserData();
    loadDataFromLocalStorage();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('viewMode', viewMode);
      if (currentProjectId) {
        localStorage.setItem('currentProjectId', currentProjectId);
      } else {
        localStorage.removeItem('currentProjectId');
      }
    }
  }, [viewMode, currentProjectId, isDataLoaded]);

  // Update activeProject when currentProjectId changes
  useEffect(() => {
    if (currentProjectId) {
      const project = projects.find(p => p.id === currentProjectId);
      if (project) {
        setActiveProject(project);
      }
    } else {
      setActiveProject(null);
    }
  }, [currentProjectId, projects]);

  // Filter tasks based on view mode
  const getFilteredColumns = () => {
    if (viewMode === 'all') {
      return columns;
    } else {
      const filteredColumns = {};
      Object.entries(columns).forEach(([columnId, column]) => {
        filteredColumns[columnId] = {
          ...column,
          items: column.items.filter(item => item.projectId === currentProjectId)
        };
      });
      return filteredColumns;
    }
  };

  const filteredColumns = getFilteredColumns();

  // Check if user can modify task
  const canModifyTask = (task) => {
    return isAdmin || task.createdBy === userId;
  };

  // Handle drag and drop of tasks
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
  
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
  
    const sourceItems = [...sourceColumn.items];
    const destItems = destination.droppableId !== source.droppableId 
      ? [...destColumn.items] 
      : sourceItems;
  
    const [movedItem] = sourceItems.splice(source.index, 1);
    
    // Store original item for potential revert
    const originalItem = { ...movedItem };
    
    // Check if user can modify this task
    if (!canModifyTask(movedItem)) {
      console.log("Permission denied: User cannot modify this task");
      alert("You don't have permission to update this task. Only the creator or admin can update tasks.");
      return;
    }
    
    // Update status if the column changed
    if (source.droppableId !== destination.droppableId) {
      movedItem.status = destination.droppableId;
    }
    
    destItems.splice(destination.index, 0, movedItem);
  
    // Immediately update local state
    const newColumns = {
      ...columns,
      [source.droppableId]: { ...sourceColumn, items: sourceItems },
      [destination.droppableId]: { ...destColumn, items: destItems }
    };
    
    setColumns(newColumns);
  
    // Only sync with Firebase if the column changed
    if (source.droppableId !== destination.droppableId) {
      try {
        if (!userId) {
          alert("Please sign in to update tasks");
          return;
        }
        
        if (!movedItem.projectId || !movedItem.id) {
          console.error("Missing required task data:", movedItem);
          alert("Failed to update task: Missing task data");
          
          // Revert UI
          setColumns(columns);
          return;
        }
        
        console.log("Updating task:", {
          taskId: movedItem.id,
          projectId: movedItem.projectId,
          newStatus: destination.droppableId,
          userId: userId,
          createdBy: movedItem.createdBy,
          isAdmin: isAdmin
        });
        
        const taskRef = doc(db, 'projects', movedItem.projectId, 'tasks', movedItem.id);
        
        const updateData = {
          status: destination.droppableId,
          lastUpdatedBy: userId,
          lastUpdatedAt: new Date().toISOString()
        };
  
        await updateDoc(taskRef, updateData);
        console.log("Task successfully updated in Firebase");
      } catch (error) {
        console.error("Error updating task status in Firebase:", error);
        
        // Revert the UI on error
        const revertColumns = {
          ...columns,
          [source.droppableId]: { 
            ...sourceColumn, 
            items: [...sourceItems, originalItem] 
          },
          [destination.droppableId]: { 
            ...destColumn, 
            items: destItems.filter(item => item.id !== movedItem.id) 
          }
        };
        
        setColumns(revertColumns);
        
        if (error.code === 'permission-denied') {
          alert("You don't have permission to update this task. Only the creator or admin can update tasks.");
        } else {
          alert("Failed to update task status. Please try again.");
        }
      }
    }
  };

  // Add a new task
  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.projectId) {
      alert("Please enter a task title and select a valid project.");
      return;
    }
    
    if (!userId) {
      alert("Please sign in to add tasks");
      return;
    }
    
    try {
      // Find the project
      const project = projects.find(p => p.id === newTask.projectId);
      
      // Calculate next task number for this project
      const projectTasks = Object.values(columns)
        .flatMap(col => col.items)
        .filter(task => task.projectId === newTask.projectId);
      
      const nextTaskNum = projectTasks.length + 1;
      
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        projectId: newTask.projectId,
        tag: `Task-${nextTaskNum}`,
        status: "requested",
        createdBy: userId,
        createdAt: new Date().toISOString()
      };

      // Add task to Firebase
      const taskRef = await addDoc(collection(db, 'projects', newTask.projectId, 'tasks'), taskData);
      
      // Add task to local state
      const newTaskWithId = {
        id: taskRef.id,
        ...taskData
      };
      
      // Update the columns
      const updatedColumns = {
        ...columns,
        requested: {
          ...columns.requested,
          items: [...columns.requested.items, newTaskWithId],
        },
      };
      
      setColumns(updatedColumns);
      
      // Reset form and close modal
      setNewTask({ title: "", description: "", projectId: "" });
      setShowNewTaskModal(false);
    } catch (error) {
      console.error("Error adding task to Firebase:", error);
      alert("Failed to add task. Please try again.");
    }
  };

  // Update an existing task
  const handleUpdateTask = async () => {
    if (!editingTask.title.trim() || !editingTask.projectId) {
      alert("Task title and project are required.");
      return;
    }
    
    if (!userId) {
      alert("Please sign in to update tasks");
      return;
    }
    
    // Check if user can modify this task
    if (!canModifyTask(editingTask)) {
      alert("You don't have permission to update this task. Only the creator or admin can update tasks.");
      return;
    }
    
    try {
      console.log("Updating task:", {
        taskId: editingTask.id,
        projectId: editingTask.projectId,
        userId: userId,
        createdBy: editingTask.createdBy,
        isAdmin: isAdmin
      });
      
      // Update task in Firebase
      const taskRef = doc(db, 'projects', editingTask.projectId, 'tasks', editingTask.id);
      await updateDoc(taskRef, {
        title: editingTask.title,
        description: editingTask.description,
        lastUpdatedBy: userId,
        lastUpdatedAt: new Date().toISOString()
      });
      
      // Update the task in columns
      const newColumns = {};
      Object.entries(columns).forEach(([columnId, column]) => {
        newColumns[columnId] = {
          ...column,
          items: column.items.map(item =>
            item.id === editingTask.id ? editingTask : item
          )
        };
      });
      
      setColumns(newColumns);
      setShowEditTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task in Firebase:", error);
      
      if (error.code === 'permission-denied') {
        alert("You don't have permission to update this task. Only the creator or admin can update tasks.");
      } else {
        alert("Failed to update task. Please try again.");
      }
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (!userId) {
      alert("Please sign in to delete tasks");
      return;
    }
    
    // Find the task
    let taskToDelete = null;
    let taskColumnId = null;
    
    Object.entries(columns).forEach(([columnId, column]) => {
      const task = column.items.find(item => item.id === taskId);
      if (task) {
        taskToDelete = task;
        taskColumnId = columnId;
      }
    });
    
    if (!taskToDelete) {
      alert("Task not found");
      return;
    }
    
    // Check if user can modify this task
    if (!canModifyTask(taskToDelete)) {
      alert("You don't have permission to delete this task. Only the creator or admin can delete tasks.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }
    
    try {
      console.log("Deleting task:", {
        taskId: taskToDelete.id,
        projectId: taskToDelete.projectId,
        userId: userId,
        createdBy: taskToDelete.createdBy,
        isAdmin: isAdmin
      });
      
      // Delete task from Firebase
      await deleteDoc(doc(db, 'projects', taskToDelete.projectId, 'tasks', taskId));
      
      // Remove the task from columns
      const newColumns = {};
      Object.entries(columns).forEach(([columnId, column]) => {
        newColumns[columnId] = {
          ...column,
          items: column.items.filter(item => item.id !== taskId),
        };
      });
      
      setColumns(newColumns);
    } catch (error) {
      console.error("Error deleting task from Firebase:", error);
      
      if (error.code === 'permission-denied') {
        alert("You don't have permission to delete this task. Only the creator or admin can delete tasks.");
      } else {
        alert("Failed to delete task. Please try again.");
      }
    }
  };

  const handleEditTask = (task) => {
    // Check if user can modify this task before allowing edit
    if (!canModifyTask(task)) {
      alert("You don't have permission to edit this task. Only the creator or admin can edit tasks.");
      return;
    }
    
    setEditingTask({...task});
    setShowEditTaskModal(true);
  };

  const toggleProjectExpansion = (projectId) => {
    const updatedProjects = projects.map(project => 
      project.id === projectId 
        ? { ...project, expanded: !project.expanded } 
        : project
    );
    setProjects(updatedProjects);
  };

  const viewProjectTasks = (projectId) => {
    setViewMode('project');
    setCurrentProjectId(projectId);
  };

  const viewAllProjects = () => {
    setViewMode('all');
    setCurrentProjectId(null);
  };

  const countProjectTasks = (projectId) => {
    let count = 0;
    Object.values(columns).forEach(column => {
      count += column.items.filter(item => item.projectId === projectId).length;
    });
    return count;
  };

  if (!isDataLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">
            {viewMode === 'project' && activeProject 
              ? <>
                  <button 
                    onClick={viewAllProjects}
                    className="text-purple-500 hover:text-purple-400 mr-2"
                  >
                    Enrolled Projects
                  </button> 
                  / {activeProject.title}
                </>
              : 'Enrolled Projects'
            }
          </h2>
        </div>
        <div className="flex gap-2">
          {viewMode === 'project' && activeProject && (
            <button
              onClick={() => {
                setNewTask({ ...newTask, projectId: activeProject.id });
                setShowNewTaskModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white flex items-center gap-2"
            >
              <FaPlus /> New Task
            </button>
          )}
        </div>
      </div>

      {viewMode === 'all' && (
        <div className={`mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-4`}>
          <h3 className="text-xl font-bold mb-4">Your Enrolled Projects</h3>
          {projects.length === 0 ? (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p>You're not enrolled in any projects yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} p-4 rounded-lg cursor-pointer transition-colors`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleProjectExpansion(project.id)}
                          className="text-purple-500"
                        >
                          {project.expanded ? <FaChevronDown /> : <FaChevronRight />}
                        </button>
                        <h4 
                          className="font-semibold text-lg hover:text-purple-500 transition-colors"
                          onClick={() => viewProjectTasks(project.id)}
                        >
                          {project.title}
                        </h4>
                        <span className="ml-2 text-xs bg-purple-500 px-2 py-1 rounded text-white">
                          {countProjectTasks(project.id)} tasks
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setNewTask({ ...newTask, projectId: project.id });
                          setShowNewTaskModal(true);
                        }}
                        className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm"
                      >
                        <FaPlus /> Task
                      </button>
                    </div>
                  </div>
                  
                  {project.expanded && (
                    <div className="mt-2 ml-7">
                      <p className="text-sm text-gray-400">{project.description}</p>
                      
                      {/* Project tasks summary */}
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {Object.entries(columns).map(([columnId, column]) => {
                          const columnTasks = column.items.filter(item => item.projectId === project.id);
                          if (columnTasks.length === 0) return null;
                          
                          return (
                            <div key={columnId} className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium">{column.title}</span>
                                <span className="text-xs bg-gray-600 px-1 rounded">{columnTasks.length}</span>
                              </div>
                              <div className="space-y-1">
                                {columnTasks.slice(0, 2).map(task => (
                                  <div 
                                    key={task.id} 
                                    className={`text-xs p-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                  >
                                    {task.title}
                                  </div>
                                ))}
                                {columnTasks.length > 2 && (
                                  <div className="text-xs text-purple-500">
                                    +{columnTasks.length - 2} more...
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <button 
                        onClick={() => viewProjectTasks(project.id)}
                        className="mt-4 text-purple-500 hover:text-purple-400 text-sm flex items-center gap-1"
                      >
                        <FaTasks /> View All Tasks
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(filteredColumns).map(([columnId, column]) => (
            <div key={columnId} className={isDarkMode ? "bg-gray-800 p-4 rounded-lg" : "bg-white p-4 rounded-lg shadow-lg"}>
              <h3 className="text-lg font-semibold mb-4 flex justify-between items-center">
                {column.title}
                <span className="text-sm bg-gray-700 px-2 py-1 rounded">{column.items.length}</span>
              </h3>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    className="space-y-4 min-h-32"
                  >
                    {column.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={isDarkMode ? "bg-gray-700 p-4 rounded-lg" : "bg-gray-50 p-4 rounded-lg shadow"}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold">{item.title}</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditTask(item)}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(item.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">{item.description}</p>
                            <div className="mt-4 flex justify-between items-center">
                              <span className="text-xs bg-purple-500 px-2 py-1 rounded text-white">{item.tag}</span>
                              {viewMode === 'all' && (
                                <span className="text-xs px-2 py-1 bg-blue-500 rounded text-white">
                                  {projects.find(p => p.id === item.projectId)?.title || 'Unknown'}
                                </span>
                              )}
                              {!canModifyTask(item) && (
                                <span className="text-xs px-2 py-1 bg-red-500 rounded text-white">
                                  View only
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={isDarkMode ? "bg-gray-800 p-6 rounded-lg w-96" : "bg-white p-6 rounded-lg w-96 shadow-lg"}>
            <h3 className="text-xl font-bold mb-4">Add New Task</h3>
            <input
              type="text"
              placeholder="Task Title"
              className={`w-full p-2 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <textarea
              placeholder="Task Description"
              className={`w-full p-2 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <select
              className={`w-full p-2 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}
              value={newTask.projectId}
              onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
            >
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 bg-gray-600 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-blue-600 rounded text-white"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Task Modal */}
      {showEditTaskModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={isDarkMode ? "bg-gray-800 p-6 rounded-lg w-96" : "bg-white p-6 rounded-lg w-96 shadow-lg"}>
            <h3 className="text-xl font-bold mb-4">Edit Task</h3>
            <input
              type="text"
              placeholder="Task Title"
              className={`w-full p-2 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
            />
            <textarea
              placeholder="Task Description"
              className={`w-full p-2 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}
              value={editingTask.description}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
            />
            <select
              className={`w-full p-2 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded hidden`}
              value={editingTask.projectId}
              readOnly
              disabled
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditTaskModal(false)}
                className="px-4 py-2 bg-gray-600 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                className="px-4 py-2 bg-blue-600 rounded text-white"
              >
                Update Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}