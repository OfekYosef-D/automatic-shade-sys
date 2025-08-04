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
        const token = await getToken();
        await fetch("/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
          }),
        });
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
