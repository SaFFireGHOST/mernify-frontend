import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* Full-screen skeleton while checking session */}
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to the login page
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;