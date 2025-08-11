// FILE: src/components/Navbar.jsx
// PURPOSE: To be a "smart" navigation bar that shows the correct links to the correct user.
// ANALOGY: Think of this as the "VIP Section Manager" at our nightclub. The manager's job is to look at a guest's
// wristband (their "role") and show them the correct menu of options available only to them.

import React, { useState } from 'react';
// We're importing some nice-looking icons (hamburger menu and 'X') for our mobile view.
import { Menu, X } from 'lucide-react';

// This is the "Master Menu" for our entire app.
// It's like a list of all possible menus for all possible types of guests.
// When a user logs in, we'll look up their role (like 'admin') and grab the correct list of links.
const navLinksConfig = {
  admin: [
    { name: 'Dashboard', href: '/' },
    { name: 'Shading Control', href: '/shading-control' },
    { name: 'Users', href: '/users' },
    { name: 'Scheduler', href: '/scheduler' },
  ],
  maintenance: [
    { name: 'Dashboard', href: '/' },
    { name: 'Shading Control', href: '/shading-control' },
    { name: 'Maintenance Log', href: '/logs' },
  ],
  planner: [
    { name: 'Dashboard', href: '/' },
    { name: 'Shading Control', href: '/shading-control' },
    { name: 'Scheduler', href: '/scheduler' },
  ],
};

// =========================================================================================
// This is a small, reusable component for a SINGLE navigation link.
// =========================================================================================
// It knows how to look "active" or "normal".
const NavLink = ({ name, href, isActive }) => (
  <li>
    <a
      href={href}
      // We pass the `isActive` state as a `data-active` attribute.
      // This is like putting a special "You Are Here" sticker on the link.
      data-active={isActive}
      // The `className` string is where all the styling happens.
      // It's a list of instructions for how the link should look.
      className="
        block md:inline-block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 /* Basic styling: size, font, transitions */
        text-neutral-dark hover:bg-neutral-dark/10                                                    /* Normal state: dark text, light gray on hover */
        data-[active=true]:text-accent data-[active=true]:bg-accent/10                                /* Active state: If it has the `You Are Here` sticker, make it orange. */
      "
    >
      {name} {/* This is the visible text of the link, like "Dashboard" */}
    </a>
  </li>
);

// =========================================================================================
// This is the MAIN Navbar component.
// =========================================================================================
// It receives two important pieces of information (props) from App.jsx:
// 1. `user`: The full object of the person who is logged in.
// 2. `activePage`: The name of the page the user is currently looking at.
const Navbar = ({ user, activePage }) => {
  // We give the Navbar a "memory" to know if the mobile menu is open or closed.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // SAFETY CHECK: If no one is logged in (`user` is null), we show a simple, empty version of the Navbar.
  if (!user) {
    return (
        <nav className="bg-neutral-light/95 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200">
            {/* Just shows the logo, nothing else. */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <a href="/" className="text-xl font-bold text-neutral-dark">
                        <span className="text-primary">Auto</span>Shade
                    </a>
                </div>
            </div>
        </nav>
    );
  }

  // If a user *is* logged in, we continue...
  // We look up the user's role in our "Master Menu" to get the correct list of links for them.
  const links = navLinksConfig[user.role] || []; // If the role is weird, default to an empty list.
  // We get the first letter of the user's name to display in their profile icon.
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  // Now, we build the full Navbar with all its parts.
  return (
    <nav className="bg-neutral-light/95 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: The Logo */}
          <a href="/" className="text-xl font-bold text-neutral-dark">
            <span className="text-primary">Auto</span>Shade
          </a>

          {/* Center: The Navigation Links (for desktop screens) */}
          <div className="hidden md:block"> {/* This div is hidden on small (mobile) screens */}
            <ul className="ml-10 flex items-baseline space-x-4">
              {/* We go through the list of links for this user and create a <NavLink> component for each one. */}
              {links.map((link) => (
                <NavLink key={link.name} {...link} isActive={activePage === link.name} />
              ))}
            </ul>
          </div>

          {/* Right Side: Profile Icon and Mobile Menu Button */}
          <div className="flex items-center">
            {/* The user's profile icon */}
            <div className="w-10 h-10 rounded-full bg-primary flex ...">
              {userInitial}
            </div>

            {/* The mobile "hamburger" menu button */}
            <div className="ml-3 md:hidden"> {/* This div ONLY appears on small (mobile) screens */}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="...">
                {/* We show the 'X' icon if the menu is open, or the 'hamburger' icon if it's closed. */}
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Dropdown Mobile Menu Itself */}
      {/* This entire block of code ONLY appears if `isMobileMenuOpen` is true. */}
      {isMobileMenuOpen && (
        <div className="md:hidden"> {/* It's also hidden on desktop screens */}
          <ul className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* We show the same list of links, but styled for a mobile dropdown. */}
            {links.map((link) => (
              <NavLink key={link.name} {...link} isActive={activePage === link.name} />
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;