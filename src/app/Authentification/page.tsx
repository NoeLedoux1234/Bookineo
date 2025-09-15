'use client';

import { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function Authentification() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-2xl font-bold mb-4">Authentification</h1>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-6 py-2 rounded ${showLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'} transition`}
          onClick={() => setShowLogin(true)}
        >
          Se connecter
        </button>
        <button
          className={`px-6 py-2 rounded ${!showLogin ? 'bg-green-600 text-white' : 'bg-gray-200 text-black'} transition`}
          onClick={() => setShowLogin(false)}
        >
          S&apos;inscrire
        </button>
      </div>
      <div className="w-full max-w-md">
        {showLogin ? <Login /> : <Register />}
      </div>
    </div>
  );
}
