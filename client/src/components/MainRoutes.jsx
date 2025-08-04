import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Home from "../pages/Home";
import About from "../pages/About";
import ProtectedRoute from "./ProtectedRoute";

const MainRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/login/*" element={<Login />} />
        <Route path="/register/*" element={<Signup />} /> 
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default MainRoutes;
