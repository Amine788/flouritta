import { useState } from "react";
import { AdminLogin } from "../admin/AdminLogin";
import { AdminPage } from "../admin/AdminPage";

export default function AdminWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (isAuthenticated) {
    return <AdminPage onLogout={() => setIsAuthenticated(false)} />;
  }
  return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
}