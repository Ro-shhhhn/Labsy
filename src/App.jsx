import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tests from "./pages/Tests";
import Patients from "./pages/Patients";
import CreateInvoice from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import PaymentHistory from "./pages/PaymentHistory";
import Users from "./pages/Users";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/tests"
            element={
              <RoleGuard roles={["admin", "receptionist"]} redirect>
                <Tests />
              </RoleGuard>
            }
          />

          <Route
            path="/patients"
            element={
              <RoleGuard
                roles={["super_admin", "admin", "receptionist", "technician"]}
                redirect
              >
                <Patients />
              </RoleGuard>
            }
          />

          <Route
            path="/create-invoice"
            element={
              <RoleGuard roles={["admin", "receptionist"]} redirect>
                <CreateInvoice />
              </RoleGuard>
            }
          />

          <Route
            path="/invoices"
            element={
              <RoleGuard
                roles={["super_admin", "admin", "receptionist", "technician"]}
                redirect
              >
                <Invoices />
              </RoleGuard>
            }
          />

          <Route
            path="/invoices/:id"
            element={
              <RoleGuard
                roles={["super_admin", "admin", "receptionist", "technician"]}
                redirect
              >
                <InvoiceDetail />
              </RoleGuard>
            }
          />

          <Route
            path="/payments"
            element={
              <RoleGuard roles={["super_admin", "admin", "receptionist"]} redirect>
                <PaymentHistory />
              </RoleGuard>
            }
          />

          <Route
            path="/users"
            element={
              <RoleGuard roles={["super_admin", "admin"]} redirect>
                <Users />
              </RoleGuard>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;