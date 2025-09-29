// FILE: src/App.jsx
// PURPOSE: To be the main "Blueprint" or "Master Plan" for our entire application.
// ANALOGY: Think of this file as the "Club Owner". The owner doesn't manage the VIP section or check IDs at the door,
// but they make the most important decisions: they hire the Bouncer, they decide the club's layout (Navbar at the top,
// dance floor in the middle), and they set up the different rooms (the Routes).

import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Import the tools we built.
// The Bouncer component itself.
import { AuthProvider } from './context/AuthContext'; 
// The "Walkie-Talkie" to communicate with the Bouncer.
import { useAuth } from './hooks/useAuth';

// Import the main parts of our club.
import Home from './pages/Home'; // The main "lobby" page.
import Users from './pages/Users'; // The "users" page.
import AddAlert from './pages/AddAlert'; // The "add alert" page.
import Areas from './pages/Areas'; // The "areas" page.
import Navbar from './components/Navbar'; // The "VIP Section Manager" component.

// This is a small helper tool.
// Its job is to look at the current web address (like "/map") and translate it
// into a simple name (like "Map"). This helps the Navbar know which button to highlight.
const getActivePage = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/areas')) return 'Areas';
    if (pathname.startsWith('/users')) return 'Users';
    return ''; // If we don't recognize the page, highlight nothing.
};

// =========================================================================================
// This component defines the consistent LAYOUT for every page in our app.
// =========================================================================================
// Think of this as the "Club's Floor Plan". Every room will have the same fancy entrance (the Navbar)
// and the same wallpaper.
const AppLayout = () => {
  // We use our "Walkie-Talkie" (`useAuth`) to instantly get the current user's information.
  // We only need the `user` object from what the walkie-talkie gives us.
  const { user } = useAuth(); 

  // `useLocation` is a tool from the router library that tells us the current web address.
  const location = useLocation();
  // We use our helper tool to figure out which page name to tell the Navbar.
  const activePage = getActivePage(location.pathname);

  // Now we build the visual layout.
  return (
    // This is the main container for the whole screen.
    <div className="min-h-screen bg-neutral-light text-neutral-dark">
      {/* The Navbar is always at the top. We give it the `user` info and the `activePage` name
          so it knows exactly what to display and which button to highlight. */}
      <Navbar user={user} activePage={activePage} />

      {/* The <main> section is where the content of each specific page will appear. */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* The <Routes> component is like a "Door Manager". It looks at the web address
            and shows ONLY the page that matches. */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/add-alert" element={<AddAlert />} />
          <Route path="/areas" element={<Areas />} />
          {/* We will add more "rooms" (Routes) here later. */}
        </Routes>
      </main>
    </div>
  );
};

// =========================================================================================
// This is the TOP-LEVEL component of our entire application.
// =========================================================================================
// This is the final decision from the "Club Owner".
function App() {
  return (
    // DECISION 1: "Hire the Bouncer." We wrap EVERYTHING in `<AuthProvider>`.
    // This "activates" the user-management system for the whole app.
    <AuthProvider>
      {/* DECISION 2: "Install the routing system." `<BrowserRouter>` enables changing pages
          without a full page refresh. */}
      <BrowserRouter>
        {/* DECISION 3: "Use our main floor plan." We tell the app to render our `AppLayout`. */}
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;