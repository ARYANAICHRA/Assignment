import React, { useState, useContext, useEffect, createContext } from 'react';
import { useAuth } from '../context/AuthContext'; // Use new AuthContext

export const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const { currentUser, isAdmin } = useAuth(); // Get user and admin status from AuthContext
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [myProjectRole, setMyProjectRole] = useState(null);
  const [myProjectPermissions, setMyProjectPermissions] = useState([]);

  // Fetch project members (for display, not for permissions)
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedProject || !currentUser) {
        setProjectMembers([]);
        setMyProjectRole(null);
        setMyProjectPermissions([]);
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
          setProjectMembers(data.members || []);
        } else {
          setMembersError(data.error || 'Failed to fetch members');
        }
      } catch (err) {
        setMembersError('Network error while fetching members.');
      }
      setMembersLoading(false);
    };
    fetchMembers();
  }, [selectedProject, currentUser]);
  
  // Fetch my permissions and role for the selected project
  useEffect(() => {
    const fetchMyRole = async () => {
      if (!selectedProject || !currentUser) {
        setMyProjectRole(null);
        setMyProjectPermissions([]);
        return;
      }
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/my-role`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setMyProjectRole(data.role);
          setMyProjectPermissions(data.permissions || []);
        } else {
          setMyProjectRole(null);
          setMyProjectPermissions([]);
        }
      } catch (err) {
        setMyProjectRole(null);
        setMyProjectPermissions([]);
      }
    };
    fetchMyRole();
  }, [selectedProject, currentUser]);

  // Helper to check permission
  const hasProjectPermission = (permission) => {
    if (isAdmin) return true;
    return myProjectPermissions.includes(permission);
  };

  const contextValue = {
    selectedProject,
    setSelectedProject,
    projectMembers,
    myProjectRole,
    myProjectPermissions,
    hasProjectPermission,
    membersLoading,
    membersError,
    currentUser
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}