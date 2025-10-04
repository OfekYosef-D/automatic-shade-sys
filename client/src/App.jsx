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
import AddAlert from './pages/AddAlert'; // The "add alert" page.
import Areas from './pages/Areas'; // The "areas" page.
import Login from './pages/Login'; // The login page.
import Navbar from './components/Navbar'; // The "VIP Section Manager" component.

// This is a small helper tool.
// Its job is to look at the current web address (like "/map") and translate it
// into a simple name (like "Map"). This helps the Navbar know which button to highlight.
const getActivePage = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/areas')) return 'Areas';
    return ''; // If we don't recognize the page, highlight nothing.
};

// =========================================================================================
// This component defines the consistent LAYOUT for every page in our app.
// =========================================================================================
// Think of this as the "Club's Floor Plan". Every room will have the same fancy entrance (the Navbar)
// and the same wallpaper.
const AppLayout = () => {
  const { user, loading } = useAuth(); 
  const location = useLocation();
  const activePage = getActivePage(location.pathname);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not logged in and not on login page, redirect to login
  if (!user && location.pathname !== '/login') {
    return <Routes><Route path="*" element={<Login />} /></Routes>;
  }

  // If logged in and on login page, redirect to home
  if (user && location.pathname === '/login') {
    return <Routes><Route path="*" element={<Home />} /></Routes>;
  }

  // Login page (no navbar)
  if (location.pathname === '/login') {
    return <Routes><Route path="/login" element={<Login />} /></Routes>;
  }

  // Regular authenticated layout
  return (
    <div className="min-h-screen bg-neutral-light text-neutral-dark">
      <Navbar user={user} activePage={activePage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-alert" element={<AddAlert />} />
          <Route path="/areas" element={<Areas />} />
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