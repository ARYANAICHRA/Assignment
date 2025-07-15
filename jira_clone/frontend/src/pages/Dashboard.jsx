import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import CreateProjectForm from '../components/CreateProjectForm';
import ProjectMembers from '../components/ProjectMembers';
import ProjectTasks from '../components/ProjectTasks';

function ProgressBar({ percent }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
      <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${percent}%` }}></div>
    </div>
  );
}

function Dashboard() {
  const { selectedProject } = useContext(ProjectContext);
  const [stats, setStats] = useState({ projectCount: 0, taskCount: 0, teamCount: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [projectProgress, setProjectProgress] = useState({ done: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Fetch stats
      const statsRes = await fetch('http://localhost:5000/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
        setRecentProjects(data.recentProjects || []);
      }
      // Fetch activity log
      const activityRes = await fetch('http://localhost:5000/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivity(data.activity || []);
      }
      // Fetch my tasks
      const myTasksRes = await fetch('http://localhost:5000/my-tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (myTasksRes.ok) {
        const data = await myTasksRes.json();
        setMyTasks(data.tasks || []);
      }
      // Fetch project progress
      if (selectedProject) {
        const progressRes = await fetch(`http://localhost:5000/projects/${selectedProject.id}/progress`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (progressRes.ok) {
          const data = await progressRes.json();
          setProjectProgress(data);
        }
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, [selectedProject]);

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-600 text-white rounded-lg shadow p-6">
          <div className="text-lg font-semibold mb-2">Projects</div>
          <div className="text-3xl font-bold">{stats.projectCount}</div>
          <div>Total Projects</div>
        </div>
        <div className="bg-green-600 text-white rounded-lg shadow p-6">
          <div className="text-lg font-semibold mb-2">Tasks</div>
          <div className="text-3xl font-bold">{stats.taskCount}</div>
          <div>Total Tasks</div>
        </div>
        <div className="bg-yellow-400 text-white rounded-lg shadow p-6">
          <div className="text-lg font-semibold mb-2">Teams</div>
          <div className="text-3xl font-bold">{stats.teamCount}</div>
          <div>Total Teams</div>
        </div>
        <div className="bg-white text-gray-900 rounded-lg shadow p-6 flex flex-col justify-between">
          <div className="text-lg font-semibold mb-2">Quick Actions</div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded mb-2 hover:bg-blue-700 transition">+ New Project</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded mb-2 hover:bg-green-700 transition">+ New Task</button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">Invite Member</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Project Progress</h3>
          <ProgressBar percent={projectProgress.total ? Math.round((projectProgress.done / projectProgress.total) * 100) : 0} />
          <div className="text-sm text-gray-600">{projectProgress.done} of {projectProgress.total} tasks done</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">My Tasks</h3>
          <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
            {myTasks.length > 0 ? myTasks.slice(0, 6).map((task, idx) => (
              <li key={idx} className="py-2 flex items-center justify-between">
                <span>{task.title}</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${task.status === 'done' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{task.status}</span>
              </li>
            )) : <li className="py-2 text-gray-500">No tasks assigned to you</li>}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Activity Feed</h3>
          <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
            {activity.length > 0 ? activity.slice(0, 8).map((log, idx) => (
              <li key={idx} className="py-2 text-sm text-gray-700">
                <span className="font-semibold">{log.user}</span> {log.action} <span className="text-gray-500">{log.details}</span> <span className="text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
              </li>
            )) : <li className="py-2 text-gray-500">No recent activity</li>}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Project Members</h3>
          <ProjectMembers />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Project Tasks</h3>
          <ProjectTasks />
        </div>
      </div>
      <div className="mt-8">
        <CreateProjectForm />
      </div>
    </div>
  );
}

export default Dashboard;
