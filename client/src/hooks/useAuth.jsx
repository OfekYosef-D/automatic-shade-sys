// FILE: src/hooks/useAuth.jsx
// PURPOSE: To create a simple, clean shortcut for any component to get the logged-in user's information.
// ANALOGY: If the `AuthContext` is the "Bouncer's Office", this file creates a special, easy-to-use "Walkie-Talkie".
// Instead of a component having to run all the way to the office, it can just use this walkie-talkie to ask, "Who's logged in?"

import { useContext } from 'react';
// We need to import the "Information Channel" we created in the other file.
// This tells our walkie-talkie which frequency to tune into.
import { AuthContext } from '../context/AuthContext';

// =========================================================================================
// STEP 1: Create our custom "Walkie-Talkie" hook.
// =========================================================================================
// A "hook" in React is just a reusable tool. We're making our own tool called `useAuth`.
// Any component in our app can now "use" this tool.
export const useAuth = () => {
  // `useContext` is React's built-in way of "listening" to an Information Channel.
  // We're telling it to listen to the `AuthContext` channel.
  // The `context` variable will hold whatever information the Bouncer's Office is broadcasting
  // (which is the { user, loginAs, logout } object).
  const context = useContext(AuthContext);

  // =========================================================================================
  // STEP 2: Add a helpful safety check.
  // =========================================================================================
  // What if a component tries to use the walkie-talkie, but the Bouncer's Office was never set up?
  // (This happens if you forget to wrap your app in the `<AuthProvider>`).
  // This `if` statement checks for that problem.
  if (context === undefined) {
    // If the walkie-talkie gets nothing but static, it means the radio tower (`AuthProvider`) is off.
    // We throw an error to immediately tell the developer they made a mistake in their setup.
    // This saves a lot of time debugging!
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // =========================================================================================
  // STEP 3: Hand the information to the component that asked for it.
  // =========================================================================================
  // If everything is working correctly, we just return the information we received from the channel.
  // The component that used the `useAuth()` walkie-talkie now has direct access to the user's info.
  return context;
};