import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useUser';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Patients', href: '/patients', icon: '👥' },
  { label: 'Tests', href: '/tests', icon: '🧪' },
  { label: 'Invoices', href: '/invoices', icon: '📄' },
  { label: 'Create Invoice', href: '/create-invoice', icon: '➕' },
  { label: 'Users', href: '/users', icon: '👤' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
      <div className="p-4 flex justify-between items-center">
        {isOpen && <h2 className="text-xl font-bold">LabSys</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-gray-800 rounded">
          {isOpen ? '←' : '→'}
        </button>
      </div>

      <nav className="space-y-2 p-4 flex-1">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition ${
              location.pathname === item.href ? 'bg-gray-800' : ''
            }`}
            title={isOpen ? '' : item.label}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {isOpen && user && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      )}
    </aside>
  );
}