import React, { createContext, useState, useEffect } from 'react';

export const ProjectContext = createContext();

// --- NEW: Define the permissions for each role on the client-side ---
// This should mirror your backend `generate_demo_data.py` permissions.
const PERMISSIONS_MAP = {
  admin: ['view_tasks', 'create_task', 'edit_any_task', 'delete_any_task', 'manage_project', 'add_remove_members', 'add_comment', 'edit_any_comment'],
  manager: ['view_tasks', 'create_task', 'edit_any_task', 'delete_any_task', 'manage_project', 'add_remove_members', 'add_comment', 'edit_any_comment'],
  member: ['view_tasks', 'create_task', 'edit_own_task', 'delete_own_task', 'add_comment', 'edit_own_comment'],
  visitor: ['view_tasks'],
};

export function ProjectProvider({ children }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [myProjectRole, setMyProjectRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);

  // --- NEW: A helper function to check permissions ---
  const hasPermission = (permission) => {
    if (!myProjectRole) return false;
    const userPermissions = PERMISSIONS_MAP[myProjectRole] || [];
    return userPermissions.includes(permission);
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedProject || !currentUser) {
        setProjectMembers([]);
        setMyProjectRole(null);
        return;
      }

      setMembersLoading(true);
      setMembersError(null);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const members = data.members || [];
          setProjectMembers(members);
          const myMember = members.find(m => m.user_id === currentUser.id);
          setMyProjectRole(myMember?.role || null);
        } else {
          setMembersError(data.error || 'Failed to fetch members');
          setMyProjectRole(null);
        }
      } catch (err) {
        setMembersError('Network error while fetching members.');
        setMyProjectRole(null);
      }
      setMembersLoading(false);
    };

    fetchMembers();
  }, [selectedProject, currentUser]);
  
  // Value provided by the context
  const contextValue = {
    selectedProject,
    setSelectedProject,
    projectMembers,
    myProjectRole,
    membersLoading,
    membersError,
    currentUser,
    setCurrentUser,
    hasPermission // Expose the new function
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}