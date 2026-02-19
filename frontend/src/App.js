import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Appointments from "./pages/Appointments";
import AdminDoctors from "./pages/AdminDoctors";
import AppLayout from "./components/AppLayout";
import DoctorsDirectory from "./pages/DoctorsDirectory";
import DoctorDetails from "./pages/DoctorDetails";




function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <AppLayout>

          <Routes>

            {/* PUBLIC */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/doctors" element={<DoctorsDirectory />} />
            <Route path="/doctors/:id" element={<DoctorDetails />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            {/* PROTECTED */}

            <Route
              path="/appointments"
              element={
                <ProtectedRoute roles={["patient", "doctor", "admin"]}>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDoctors />
                </ProtectedRoute>
              }
            />

          </Routes>

        </AppLayout>

      </BrowserRouter>
    </AuthProvider>

  );
}

export default App;
