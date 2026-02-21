import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

export default function Dashboard() {
  const { user, labs } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Lab Management System</h1>
            <div className="text-sm text-gray-600">
              {user ? `Welcome, ${user.name}` : 'Not logged in'}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {['overview', 'labs', 'equipment', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Labs</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{labs.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Pending Issues</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
            </div>
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Labs</h2>
            </div>
            <div className="p-6">
              {labs.length > 0 ? (
                <div className="space-y-4">
                  {labs.map((lab) => (
                    <div key={lab.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold">{lab.name}</h3>
                      <p className="text-sm text-gray-600">{lab.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No labs found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Management</h2>
            <p className="text-gray-500">Equipment management coming soon...</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports</h2>
            <p className="text-gray-500">Reports coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}
