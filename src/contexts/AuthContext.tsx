import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// This matches the user object from your backend
interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  // On app load, check if token is valid
  React.useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          // Use your /api/protected route to verify the token
          const res = await fetch('/api/protected', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user); // Your backend populates req.user
            setToken(storedToken);
          } else {
            // Token is invalid or expired
            localStorage.removeItem("token");
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error("Token validation failed", error);
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    validateToken();
  }, []);

  const signIn = async (username: string, password: string) => {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Invalid credentials');
    }

    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("token", data.token);
    navigate("/");
  };

  const signUp = async (username: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Sign up failed');
    }

    // **CHANGE: Automatically sign in the user after successful sign up**
    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("token", data.token);
    navigate("/"); // Redirect to dashboard
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    navigate("/auth");
  };

  // Show loading skeleton while validating token
  if (isLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};