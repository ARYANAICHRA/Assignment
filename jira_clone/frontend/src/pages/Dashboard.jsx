import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Dashboard({ projectCount = 0, taskCount = 0, teamCount = 0, recentProjects = [] }) {
  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto mt-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 text-white rounded-lg shadow p-6">
            <div className="text-lg font-semibold mb-2">Projects</div>
            <div className="text-3xl font-bold">{projectCount}</div>
            <div>Total Projects</div>
          </div>
          <div className="bg-green-600 text-white rounded-lg shadow p-6">
            <div className="text-lg font-semibold mb-2">Tasks</div>
            <div className="text-3xl font-bold">{taskCount}</div>
            <div>Total Tasks</div>
          </div>
          <div className="bg-yellow-400 text-white rounded-lg shadow p-6">
            <div className="text-lg font-semibold mb-2">Teams</div>
            <div className="text-3xl font-bold">{teamCount}</div>
            <div>Total Teams</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
          <ul className="divide-y divide-gray-200">
            {recentProjects.length > 0 ? recentProjects.map((project, idx) => (
              <li className="py-2" key={idx}>
                <span className="font-medium">{project.name}</span> - <span className="text-gray-500">{project.description || 'No description'}</span>
              </li>
            )) : (
              <li className="py-2 text-gray-500">No recent projects found.</li>
            )}
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;
