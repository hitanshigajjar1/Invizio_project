import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./AdminPanel/AdminDashboard";
import Login from "./UserDetails/login";
import Home from "./home/Home";

function App() {
  const userRole = localStorage.getItem("userRole"); // Get user role from localStorage

  return (
    <Routes>
      {/* If logged in as admin, redirect to Admin Dashboard */}
      {userRole === "admin" ? (
        <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
      ) : (
        <Route path="/" element={<Navigate to="/login" replace />} />
      )}

      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;





// import { Routes, Route, Navigate } from "react-router-dom";
// import AdminDashboard from "./components/AdminDashboard";
// import Login from "./UserDetails/login";
// import Home from "./components/Home";

// function App() {
//   return (
//     <Routes>
//       {/* Redirect to Login page by default */}
//       <Route path="/" element={<Navigate to="/login" />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/home" element={<Home />} />
//       <Route path="/admin-dashboard" element={<AdminDashboard />} />
//     </Routes>
//   );
// }

// export default App;


