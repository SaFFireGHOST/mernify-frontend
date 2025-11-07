import { useAuth as useAuthFromContext } from "@/contexts/AuthContext";

// Re-export the hook for simplicity in other files
export const useAuth = () => {
  return useAuthFromContext();
};