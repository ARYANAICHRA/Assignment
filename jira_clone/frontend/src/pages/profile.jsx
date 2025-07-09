import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';

function Profile() {
  // Dummy user data for now
  const user = {
    username: 'johndoe',
    email: 'johndoe@example.com',
    joined: '2025-07-01',
    projects: 3,
    teams: 2
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56">
        <Header isAuthenticated={true} />
        <div className="max-w-xl mx-auto mt-16 bg-white rounded-lg shadow p-8 border border-gray-200">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Profile</h2>
          <div className="mb-4 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-3xl font-bold text-blue-700 mb-4">
              {user.username[0].toUpperCase()}
            </div>
            <div className="text-xl font-semibold">{user.username}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
          <div className="flex justify-between mt-8 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold">{user.projects}</div>
              <div className="text-gray-500 text-sm">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{user.teams}</div>
              <div className="text-gray-500 text-sm">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{user.joined}</div>
              <div className="text-gray-500 text-sm">Joined</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Profile;
