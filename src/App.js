import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SessionAdminPage from "./pages/SessionAdminPage";
import PlayerPage from "./pages/PlayerPage";
import SuperAdminPage from "./pages/SuperAdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/manage/:sessionId" element={<SessionAdminPage />} />
        <Route path="/session/:sessionId" element={<PlayerPage />} />
        <Route path="/superadmin" element={<SuperAdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
