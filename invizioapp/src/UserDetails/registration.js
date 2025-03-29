import React, { useState } from "react";
import "./registration.css"
import { useNavigate } from "react-router-dom"

const Registration = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });

const navigate = useNavigate()
const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        const newErrors = validateForm({ ...formData, [e.target.name]: e.target.value });
        setErrors(newErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm(formData);
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
          try {
              const response = await fetch("http://localhost:5000/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(formData),
              });

              const data = await response.json();
              console.log("Response:", data);

              if (response.ok) {
                  alert("User registered successfully!");
                  setFormData({ name: "", email: "", phone:"" ,password: "" }); // Clear form
                  navigate("/login")
              } else {
                  alert(data.message);
              }
          } catch (error) {
              console.error("Error:", error);
              alert("Failed to register. Try again!");
          }
        }
    };

    const validateForm = (data) => {
      const errors = {};
  
      // Username Validation
      if (!data.name.trim()) {
        errors.name = 'Username is required';
      } else if (data.name.length < 4) {
        errors.name = 'Username must be at least 4 characters long';
      }
  
      // Email Validation
      if (!data.email.trim()) {
        errors.email = 'Email is required';
      } else if (!data.email.includes('@')) {
        errors.email = 'Email must contain @';
      } else if (!data.email.includes('.')) {
        errors.email = 'Email must contain a dot (.)';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/.test(data.email)) {
        errors.email = 'Enter a valid email format (e.g., user@domain.com)';
      }
  
      // Phone Validation
      if (!data.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(data.phone)) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
  
      // Password Validation
      if (!data.password) {
        errors.password = 'Password is required';
      } else {
        if (data.password.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(data.password)) {
          errors.password = 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(data.password)) {
          errors.password = 'Password must contain at least one lowercase letter';
        }
        if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(data.password)) {
          errors.password = 'Password must contain at least one special character (!@#$%^&*)';
        }
      }
  
      // Confirm Password Validation
      if (data.confirmPassword !== data.password) {
        errors.confirmPassword = 'Passwords do not match';
      }
  
      return errors;
    };

    return (
        <>
        <section className="section-registration">
      <div className="container h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-lg-12 col-xl-11">
            <div className="card text-black">
              <div className="card-body p-md-5">
                <div className="row justify-content-center">
                  <div className="col-md-10 col-lg-6 col-xl-5 order-2 order-lg-1">
                    <p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Sign up</p>
                    <form className="mx-1 mx-md-4" onSubmit={handleSubmit}>

                      {/* Username Input */}
                      <div className="d-flex flex-row align-items-center mb-4">
                        <i className="fas fa-user fa-lg me-4 fa-fw"></i>
                        <div className="form-outline flex-fill mb-0">
                          <input type="text" className="form-control" placeholder='Name' name="name"
                            value={formData.name} onChange={handleChange} />
                          {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="d-flex flex-row align-items-center mb-4">
                        <i className="fas fa-envelope fa-lg me-4 fa-fw"></i>
                        <div className="form-outline flex-fill mb-0">
                          <input type="email" className="form-control" placeholder='Email' name="email"
                            value={formData.email} onChange={handleChange} />
                          {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>
                      </div>

                      {/* Phone Input */}
                      <div className="d-flex flex-row align-items-center mb-4">
                        <i className="fas fa-phone fa-lg me-4 fa-fw"></i>
                        <div className="form-outline flex-fill mb-0">
                          <input type="tel" className="form-control" placeholder='Phone Number' name="phone"
                            value={formData.phone} onChange={handleChange} />
                          {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="d-flex flex-row align-items-center mb-4">
                        <i className="fas fa-lock fa-lg me-4 fa-fw"></i>
                        <div className="form-outline flex-fill mb-0">
                          <input type="password" className="form-control" placeholder='Password' name="password"
                            value={formData.password} onChange={handleChange} />
                          {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                      </div>

                      {/* Confirm Password Input */}
                      <div className="d-flex flex-row align-items-center mb-4">
                        <i className="fas fa-key fa-lg me-4 fa-fw"></i>
                        <div className="form-outline flex-fill mb-0">
                          <input type="password" className="form-control" placeholder='Confirm Password' name="confirmPassword"
                            value={formData.confirmPassword} onChange={handleChange} />
                          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                      </div>

                      {/* Register Button */}
                      <div className="d-flex justify-content-left mx-5 mb-3 mb-lg-4">
                        <button type="submit" className="btn btn-primary btn-lg">Register</button>
                      </div>

                    </form>
                  </div>

                  {/* Image Section */}
                  <div className="col-md-10 col-lg-6 col-xl-7 d-flex align-items-center order-1 order-lg-2">
                    <img src="https://img.freepik.com/premium-vector/online-shopping-platform-illustration-concept-white-background_701961-239.jpg"
                      className="img-fluid" alt="Sample" />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
        </>
    );
};

export default Registration;
