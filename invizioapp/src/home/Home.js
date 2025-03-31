// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "bootstrap/dist/css/bootstrap.min.css";

// const Home = () => {
//   const navigate = useNavigate();
//   const isLoggedIn = localStorage.getItem("userRole");

//   const handleLogout = () => {
//     localStorage.removeItem("userRole");
//     navigate("/login");
//   };

//   return (
//     <div>
//       <nav className="navbar navbar-expand-lg navbar-light bg-light shadow">
//         <div className="container">
//           <a className="navbar-brand fw-bold" href="/">Invizio</a>
//           {isLoggedIn ? (
//             <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
//           ) : (
//             <button className="btn btn-primary" onClick={() => navigate("/login")}>Login</button>
//           )}
//         </div>
//       </nav>
//       <header className="container-fluid bg-primary text-white text-center py-5">
//         <h1 className="display-4 fw-bold">Welcome to Invizio</h1>
//         <p className="lead">Your one-stop platform for seamless management.</p>
//         <button className="btn btn-light btn-lg" onClick={() => navigate("/explore")}>Explore Now</button>
//       </header>
//     </div>
//   );
// };

// export default Home;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const isLoggedIn = localStorage.getItem("userRole");

  useEffect(() => {
    fetchProducts();
    if (isLoggedIn) {
      fetchRecommendations();
    }
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/recommendations?userId=${localStorage.getItem("userId")}`
      );
      setRecommendations(response.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const handleCheckout = async () => {
    try {
      await axios.post("http://localhost:5000/api/checkout", {
        userId: localStorage.getItem("userId"),
        products: cart,
      });
      
      // Update inventory for each product
      await Promise.all(cart.map(product => 
        axios.post(`http://localhost:5000/api/inventory/${product._id}/adjust`, {
          adjustment: -1,
          notes: `Order by ${localStorage.getItem("userId")}`
        })
      ));
      
      setCart([]);
      alert("Order placed successfully!");
      fetchProducts(); // Refresh product list
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to place order");
    }
  };

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow sticky-top">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">Invizio</a>
          
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-primary me-2 position-relative"
              onClick={() => navigate("/cart")}
            >
              Cart
              {cart.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {cart.length}
                </span>
              )}
            </button>
            
            {isLoggedIn ? (
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container-fluid bg-primary text-white text-center py-5 mb-4">
        <h1 className="display-4 fw-bold">Welcome to Invizio</h1>
        <p className="lead">Smart inventory management for modern businesses</p>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Recommended Products */}
        {isLoggedIn && recommendations.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-4">Recommended For You</h2>
            <div className="row row-cols-1 row-cols-md-3 g-4">
              {recommendations.map(product => (
                <div key={product._id} className="col">
                  <div className="card h-100">
                    <img 
                      src={product.imageUrl} 
                      className="card-img-top" 
                      alt={product.name}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text">{product.category}</p>
                      <p className="fw-bold">${product.price.toFixed(2)}</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="mb-5">
          <h2 className="mb-4">Our Products</h2>
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {products.map(product => (
              <div key={product._id} className="col">
                <div className="card h-100">
                  <img 
                    src={product.imageUrl} 
                    className="card-img-top" 
                    alt={product.name}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text">{product.category}</p>
                    <p className="fw-bold">${product.price.toFixed(2)}</p>
                    <p className={product.stock > 0 ? "text-success" : "text-danger"}>
                      {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
                    </p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Cart Sidebar (can be toggled) */}
      <div className={`offcanvas offcanvas-end ${cart.length > 0 ? "show" : ""}`} tabIndex="-1" id="cartSidebar">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Your Cart</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <ul className="list-group mb-3">
                {cart.map(item => (
                  <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <h6>{item.name}</h6>
                      <small>${item.price.toFixed(2)}</small>
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-success"
                  onClick={handleCheckout}
                >
                  Checkout (${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)})
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;