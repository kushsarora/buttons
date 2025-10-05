import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    // If no user in localStorage, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected page
  return children;
}
