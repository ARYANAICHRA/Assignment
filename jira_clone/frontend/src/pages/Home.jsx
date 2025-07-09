import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-gray-900 py-24">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">Welcome to Jira Clone</h1>
        <p className="text-xl mb-8 opacity-90">A modern, collaborative project management tool inspired by Jira. Organize your work, manage teams, and track progress with ease.</p>
        <div className="flex justify-center gap-6">
          <a href="/login" className="bg-blue-500 text-white font-bold px-8 py-3 rounded shadow hover:bg-blue-400 transition">Login</a>
          <a href="/register" className="bg-gray-200 text-gray-800 font-bold px-8 py-3 rounded shadow hover:bg-gray-300 transition">Register</a>
        </div>
      </div>
    </section>
  );
}

function Home({ isAuthenticated }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Header isAuthenticated={isAuthenticated} />
      <Hero />
      <Footer />
    </>
  );
}

export default Home;
