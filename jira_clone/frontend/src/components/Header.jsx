import React from 'react';
import { Link } from 'react-router-dom';

function Header({ isAuthenticated }) {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link className="text-white text-2xl font-bold" to="/">Jira Clone</Link>
        <div className="flex gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-gray-200 hover:text-white">Login</Link>
              <Link to="/register" className="text-gray-200 hover:text-white">Register</Link>
            </>
          ) : (
            <Link to="/profile" className="text-gray-200 hover:text-white">Profile</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
