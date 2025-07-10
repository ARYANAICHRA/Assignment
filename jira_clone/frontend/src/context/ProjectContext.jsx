import React, { createContext, useState } from 'react';

export const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [selectedProject, setSelectedProject] = useState(null);
  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject }}>
      {children}
    </ProjectContext.Provider>
  );
}
