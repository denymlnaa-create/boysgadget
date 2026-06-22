import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Compose from "./pages/Compose";
import PostDetail from "./pages/PostDetail";
import BrandStream from "./pages/BrandStream";
import GadgetSearch from "./pages/GadgetSearch";
import GadgetDetail from "./pages/GadgetDetailWrapper";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import "./index.css";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/compose" element={<ProtectedRoute><Compose /></ProtectedRoute>} />
        <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/brand/:brand" element={<ProtectedRoute><BrandStream /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><GadgetSearch /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/gadget/:name" element={<ProtectedRoute><GadgetDetail /></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
        <Route path="/news/:id" element={<ProtectedRoute><NewsDetail /></ProtectedRoute>} />
        <Route path="/profile/:uid" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}