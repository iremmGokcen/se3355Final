import React, { useState } from "react";
import "../assets/styles/Register.css";

const countryOptions = [
  { value: "US", label: "United States" },
  { value: "TR", label: "Turkey" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
];

const cityOptions = {
  TR: ["Istanbul", "Ankara", "Izmir", "Bursa"],
  US: ["New York", "Los Angeles", "Chicago", "Houston"],
  DE: ["Berlin", "Munich", "Hamburg", "Frankfurt"],
  FR: ["Paris", "Lyon", "Marseille", "Nice"],
  IT: ["Rome", "Milan", "Naples", "Turin"],
};

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    photo: null,
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    if (name === "country") {
      setFormData((prevData) => ({ ...prevData, city: "" }));
    }
  };

  const handlePhotoUpload = (e) => {
    setFormData((prevData) => ({ ...prevData, photo: e.target.files[0] }));
  };

  // eslint-disable-next-line no-unused-vars
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (
      !/^(?=.*[0-9])(?=.*[^a-zA-Z0-9])(?=.*[a-zA-Z]).{8,}$/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must be at least 8 characters, include a number, and a special character.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (!formData.country) newErrors.country = "Country is required.";
    if (!formData.city) newErrors.city = "City is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      try {
        const response = await fetch("http://localhost:5000/auth/register", {
          method: "POST",
          body: formDataToSend,
        });

        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          window.location.href = "/login";
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error("Error during registration:", error);
        alert("An error occurred during registration.");
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Register</h2>
        <div className="register-content">
          <form className="register-form">
            <div className="register-input-group">
              <label className="register-label">First Name:</label>
              <input
                type="text"
                className="register-input"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              {errors.firstName && (
                <span className="error-message">{errors.firstName}</span>
              )}
            </div>
            <div className="register-input-group">
              <label className="register-label">Last Name:</label>
              <input
                type="text"
                className="register-input"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
              {errors.lastName && (
                <span className="error-message">{errors.lastName}</span>
              )}
            </div>
            <div className="register-input-group">
              <label className="register-label">Email:</label>
              <input
                type="email"
                className="register-input"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>
            <div className="register-input-group">
              <label className="register-label">Password:</label>
              <input
                type="password"
                className="register-input"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>
            <div className="register-input-group">
              <label className="register-label">Confirm Password:</label>
              <input
                type="password"
                className="register-input"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
            <div className="register-row">
              <div className="register-input-group">
                <label className="register-label">Country:</label>
                <select
                  className="register-input"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                >
                  <option value="">Select a Country</option>
                  {countryOptions.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <span className="error-message">{errors.country}</span>
                )}
              </div>
              <div className="register-input-group">
                <label className="register-label">City:</label>
                <select
                  className="register-input"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!formData.country}
                >
                  <option value="">Select a City</option>
                  {formData.country &&
                    cityOptions[formData.country]?.map((city, index) => (
                      <option key={index} value={city}>
                        {city}
                      </option>
                    ))}
                </select>
                {errors.city && (
                  <span className="error-message">{errors.city}</span>
                )}
              </div>
            </div>
          </form>
          <div className="photo-container">
            <label htmlFor="photoUpload" className="photo-label">
              {formData.photo ? (
                <img
                  src={URL.createObjectURL(formData.photo)}
                  alt="Profile"
                  className="profile-photo"
                />
              ) : (
                <div className="placeholder-photo">Upload Photo</div>
              )}
            </label>
            <input
              type="file"
              id="photoUpload"
              accept="image/*"
              className="photo-input"
              onChange={handlePhotoUpload}
            />
            <button
              className="photo-edit-icon"
              onClick={() => document.getElementById("photoUpload").click()}
            >
              ✎
            </button>
          </div>
        </div>
        <button
          type="button"
          className="register-button"
          onClick={handleRegister}
        >
          Register
        </button>
        <p className="login-redirect">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
