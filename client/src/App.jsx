import "./styles/index.css";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import MainRoutes from "./components/MainRoutes";

function App() {
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    async function syncUser() {
      if (user) {
        // Better name fallback logic
        const userName = user.fullName || user.firstName || user.username || "Unknown User";
        
        try {
          const token = await getToken();
          
          const res = await fetch("/api/users/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: userName,
              email: user.primaryEmailAddress?.emailAddress,
            }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("Sync error:", errorText);
            throw new Error(`Sync failed: ${res.status}`);
          }

          console.log("User synced successfully");
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    }
    syncUser();
  }, [user, getToken]);

  return (
    <BrowserRouter>
      <MainRoutes />
    </BrowserRouter>
  );
}

export default App;
