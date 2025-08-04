import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
