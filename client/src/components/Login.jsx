import React from "react";
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  UserButton,
} from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <>
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <h1 className="text-xl font-bold text-gray-800">
          Automatic Shade System
        </h1>
        <div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="w-full max-w-md p-8 bg-white rounded shadow flex flex-col items-center">
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
              forceRedirectUrl="/"
            />
            <div className="mt-4" />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
          <nav className="mb-8">
            <ul className="flex gap-6 text-lg">
              <li>
                <Link className="text-blue-600 hover:underline" to="/login">
                  Login
                </Link>
              </li>
              <li>
                <Link className="text-blue-600 hover:underline" to="/about">
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </SignedIn>
    </>
  );
};

export default Login;
