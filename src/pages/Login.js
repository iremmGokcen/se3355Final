import React, { useState } from "react";
import "../assets/styles/Login.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  
  // const handleLogin = async () => {
  //   if (email && password) {
  //     try {
  //       const response = await fetch("http://localhost:5000/auth/login", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ email, password }),
  //       });
  
  //       const data = await response.json();
  //       if (response.ok) {
  //         alert(data.message);
  //         window.location.href = "/";
  //       } else {
  //         alert(data.error);
  //       }
  //     } catch (error) {
  //       console.error("Error during login:", error);
  //       alert("An error occurred during login.");
  //     }
  //   } else {
  //     alert("Please fill in all fields.");
  //   }
  // };

  const handleLogin = async () => {
    if (email && password) {
      try {
        const response = await fetch("http://localhost:5000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });
  
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("user", JSON.stringify(data)); // Kullanıcı bilgilerini sakla
          window.location.href = "/";
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error("Error during login:", error);
      }
    } else {
      alert("Please fill in all fields.");
    }
  };
  
  

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("Google Login Success:", decoded);
    alert(`Welcome, ${decoded.name}`);
    window.location.href = "/";
  };

  const handleGoogleFailure = () => {
    alert("Google Login Failed. Please try again.");
  };

  return (
    <GoogleOAuthProvider clientId="115723821569-e01s7gsur3k6kn55va5c76rfu9pgeo8j.apps.googleusercontent.com">
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Login</h2>

          {/* Google Login */}
          <div className="google-login">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
            />
          </div>

          {/* Email Login */}
          <div className="login-input-group">
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-input-group">
            <label className="login-label">Password</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="password-toggle-icon"
                onClick={handleTogglePassword}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <button className="login-button" onClick={handleLogin}>
            Login
          </button>

          <p className="login-footer">
            Don't have an account? <a href="/register">Register</a>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
