// FILE: src/context/AuthContext.jsx
// PURPOSE: To create a central "brain" for our application that remembers who is currently logged in.
// ANALOGY: Think of this file as the "Bouncer's Office" at a nightclub. It's the one place
// that knows exactly who is inside at all times.

import React, { createContext, useState } from 'react';

// This is our "Guest List".
// In a real application, this information would come from a database when a user logs in.
// For now, we're just pretending these are the only three people who can use our app.
const MOCK_USER_DATA = {
  admin: { id: 1, name: 'Alice Green', email: 'alice@campus.edu', role: 'admin' },
  maintenance: { id: 2, name: 'Bob Shade', email: 'bob@campus.edu', role: 'maintenance' },
  planner: { id: 3, name: 'Dana Planner', email: 'dana@campus.edu', role: 'planner' },
};

// =========================================================================================
// STEP 1: Create a global "Information Channel" for our entire app.
// =========================================================================================
// We use React's `createContext` to make a special, shared information box.
// Any part of our app will be able to "tune into" this channel to get the user's info.
// We start it as `null`, meaning "nobody is logged in" by default.
export const AuthContext = createContext(null);

// =========================================================================================
// STEP 2: Create the "Bouncer" component that will manage the information.
// =========================================================================================
// This component, `AuthProvider`, will wrap our entire application.
// Its only job is to manage who is logged in and share that information on our "Information Channel".
export const AuthProvider = ({ children }) => {
  // `children` represents our entire application (all the other components).

  // We use `useState` to give our Bouncer a "memory".
  // `currentUser` is the information he remembers.
  // `setCurrentUser` is the only way he can update his memory.
  // We are starting the app with the 'admin' user already logged in for this example.
  const [currentUser, setCurrentUser] = useState(MOCK_USER_DATA.admin);

  // We create a function that lets us pretend to log in as someone else.
  // This is like telling the bouncer, "Let the 'planner' in now."
  const loginAs = (role) => {
    // The bouncer looks up the person on the Guest List and updates his memory.
    setCurrentUser(MOCK_USER_DATA[role] || null);
  };
  
  // A function to log out.
  // This is like telling the bouncer, "The club is empty now."
  const logout = () => {
    // The bouncer clears his memory.
    setCurrentUser(null);
  };

  // We package up all the information and tools the rest of the app might need.
  // Any component will be able to get:
  // 1. `user`: The currently logged-in user's information.
  // 2. `loginAs`: The tool to change the user.
  // 3. `logout`: The tool to log the user out.
  const value = { user: currentUser, loginAs, logout };

  // =========================================================================================
  // STEP 3: Broadcast the information on our "Information Channel".
  // =========================================================================================
  // This is the most important part.
  // The `<AuthContext.Provider>` acts like a radio tower.
  // It broadcasts the `value` (our user info and tools) to all the `children` (our entire app).
  // Any component inside this Provider can now "tune in" and get this information.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};