import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

// Define project roles and their display names
const PROJECT_ROLES = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

function getRoleDisplay(role, isAdmin) {
  if (isAdmin) return PROJECT_ROLES.admin;
  if (!role) return PROJECT_ROLES.member;
  const key = role.toLowerCase();
  return PROJECT_ROLES[key] || role;
}

function ProjectsReview() {
  const { selectedProject, setSelectedProject } = useContext(ProjectContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState({}); // { [projectId]: { admin, members, tasks } }
  const [detailsLoading, setDetailsLoading] = useState({}); // { [projectId]: true/false }
  const [adminsById, setAdminsById] = useState({}); // { [adminId]: adminObj }

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects);
        // Fetch admin details for all projects
        const uniqueAdminIds = [...new Set(data.projects.map(p => p.admin_id).filter(Boolean))];
        const admins = {};
        await Promise.all(uniqueAdminIds.map(async (adminId) => {
          try {
            const resAdmin = await fetch(`http://localhost:5000/users/${adminId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resAdmin.ok) {
              const dataAdmin = await resAdmin.json();
              admins[adminId] = dataAdmin.user;
            }
          } catch (e) {}
        }));
        setAdminsById(admins);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  // Fetch details for a project when selected
  const fetchProjectDetails = async (project) => {
    setDetailsLoading(prev => ({ ...prev, [project.id]: true }));
    const token = localStorage.getItem('token');
    // Admin
    let admin = null;
    if (project.admin_id) {
      // Use cached admin if available
      admin = adminsById[project.admin_id] || null;
      if (!admin) {
        const res = await fetch(`http://localhost:5000/users/${project.admin_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          admin = data.user;
          setAdminsById(prev => ({ ...prev, [project.admin_id]: data.user }));
        }
      }
    }
    // Members
    let members = [];
    const resMembers = await fetch(`http://localhost:5000/projects/${project.id}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resMembers.ok) {
      const data = await resMembers.json();
      members = data.members;
    }
    // Tasks
    let tasks = [];
    const resTasks = await fetch(`http://localhost:5000/projects/${project.id}/items`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resTasks.ok) {
      const data = await resTasks.json();
      tasks = data.items;
    }
    setProjectDetails(prev => ({ ...prev, [project.id]: { admin, members, tasks } }));
    setDetailsLoading(prev => ({ ...prev, [project.id]: false }));
  };

  // When a project is selected, always fetch its details
  useEffect(() => {
    if (selectedProject) {
      fetchProjectDetails(selectedProject);
    }
    // eslint-disable-next-line
  }, [selectedProject]);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">All Projects</h2>
      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const details = projectDetails[project.id];
            const admin = adminsById[project.admin_id];
            return (
              <div key={project.id} className={`bg-white rounded-lg shadow p-6 border hover:border-blue-500 transition cursor-pointer ${selectedProject && selectedProject.id === project.id ? 'border-blue-600' : 'border-gray-200'}`}
                onClick={() => { setSelectedProject(project); if (!projectDetails[project.id]) fetchProjectDetails(project); }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">{project.name}</span>
                  {selectedProject && selectedProject.id === project.id && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Selected</span>
                  )}
                </div>
                <div className="text-gray-600 mb-2">{project.description || 'No description'}</div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                  <span>Admin: {admin ? `${admin.username} (${admin.email})` : project.admin_id}</span>
                  <span>Members: {details?.members ? details.members.length : '-'}</span>
                  <span>Tasks: {details?.tasks ? details.tasks.length : '-'}</span>
                </div>
                {selectedProject && selectedProject.id === project.id && details && (
                  <div className="mt-4 text-xs">
                    {detailsLoading[project.id] ? (
                      <div className="mb-2 text-gray-400">Loading details...</div>
                    ) : (
                      <>
                        <div className="mb-2 font-semibold text-gray-700">Members:</div>
                        <ul className="mb-2">
                          {/* Show admin at the top, then other members */}
                          {admin && (
                            <li key={admin.id || admin.user_id} className="mb-1 font-bold text-blue-700">
                              {admin.username} ({admin.email}) - {PROJECT_ROLES.admin}
                            </li>
                          )}
                          {(details.members || []).filter(m => m.user_id !== project.admin_id).map(m => (
                            <li key={m.user_id} className="mb-1">
                              {m.username} ({m.email}) - {getRoleDisplay(m.role, false)}
                            </li>
                          ))}
                        </ul>
                        <div className="mb-2 font-semibold text-gray-700">Tasks:</div>
                        <ul>
                          {(details.tasks || []).map(t => (
                            <li key={t.id} className="mb-1">{t.title} <span className="text-gray-500">[{t.status}]</span>{t.assignee_id ? ` - Assignee: ${t.assignee_id}` : ''}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProjectsReview;
// ---
// Backend suggestion: Enforce role-based permissions for project actions (edit, delete, assign, etc.)
// Example: Only Admin can edit/delete project, Members can add tasks, Viewers can only view.

