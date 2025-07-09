import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add register logic
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Registration submitted!');
  };

  return (
    <>
      <Header />
      <div className="max-w-md mx-auto mt-16 bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 mb-2">Username</label>
            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2" id="username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email address</label>
            <input type="email" className="w-full border border-gray-300 rounded px-3 py-2" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded px-3 py-2" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Confirm Password</label>
            <input type="password" className="w-full border border-gray-300 rounded px-3 py-2" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold">Register</button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default Register;
