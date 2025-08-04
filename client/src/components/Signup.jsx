import React from "react";
import { SignUp } from "@clerk/clerk-react";

const Signup = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="w-full max-w-md p-8 bg-white rounded shadow flex flex-col items-center">
      <SignUp routing="path" path="/register" signInUrl="/login"/>
    </div>
  </div>
);

export default Signup;
