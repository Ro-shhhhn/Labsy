// C:\Users\itsme\OneDrive\Desktop\Labsy\src\App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';

import Login from './app/login/page';
import Signup from './app/signup/page';
import Dashboard from './app/dashboard/page';
import Patients from './app/patients/page';
import Tests from './app/tests/page';
import CreateInvoice from './app/create-invoice/page';
import Invoices from './app/invoices/page';
import Users from './app/users/page';

import RootLayout from './app/layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <RootLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/create-invoice" element={<CreateInvoice />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/users" element={<Users />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;