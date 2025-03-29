import React,{useState} from "react";
import "./login.css";
import { useNavigate } from "react-router-dom"


const Login=()=>{

  const [formData, setFormData] = useState({ email_log: '', password_log: ''});
  const navigate = useNavigate()
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
      // const { name, value } = e.target;
      setFormData({...formData,[e.target.name]: e.target.value});
      const newErrors = validateForm({ ...formData, [e.target.name]: e.target.value });
      setErrors(newErrors);
  };
  
  const handleSubmit = async (e) => {
      e.preventDefault();
      const newErrors = validateForm(formData);
      setErrors(newErrors);
  
      if (Object.keys(newErrors).length === 0) {
          // Form submission logic here
          try{
            const response = await fetch("http://localhost:5000/login", {
              method : "POST",
              headers : {"Content-type" : "application/json"},
              body : JSON.stringify(formData)
            })

            const data= await response.json()
            console.log("Data : ", data)
            if(response.ok){
              alert("User logged in successfully!!!!")
              setFormData({ email_log : "", password_log : ""})
              navigate("/")
            }
            else {
              alert("The data doesn't exists!!")
            }
          } catch (e){
            console.log("Errors : ", e)
            alert("Unable to log in!!!!!") 
          }
          // console.log('Form submitted successfully!');
      }
  };
  
  const validateForm = (data) => {
      const errors = {};
  
      if (!data.email_log.trim()) {
          errors.email_log = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(data.email_log)) {
          errors.email_log = 'Email is invalid';
      }
  
      if (!data.password_log) {
          errors.password_log = 'Password is required';
      } else if (data.password_log.length < 8) {
          errors.password_log = 'Password must be at least 8 characters long';
      }
  
  
      return errors;
  };


    return(
        <>
        <section className="section-login">
  <div className="container h-100">
    <div className="row d-flex justify-content-center align-items-center h-100">
      <div className="col-lg-12 col-xl-11">
        <div className="card text-black" >
          <div className="card-body p-md-5">
            <div className="row justify-content-center">
            <div className="col-md-10 col-lg-6 col-xl-7 d-flex align-items-center order-2 order-lg-1">

                <img src="https://img.freepik.com/premium-vector/online-registration-sign-up-with-man-sitting-near-smartphone_268404-95.jpg?semt=ais_hybrid"
                className="img-fluid" alt="Sample image"/>

                </div>
              <div className="col-md-10 col-lg-6 col-xl-5 order-1 order-lg-2">

                <p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Sign in</p>

                <form className="mx-1 mx-md-4" onSubmit={handleSubmit}>

                  {/* <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-user fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
                      <input type="text" id="form3Example1c" class="form-control" />
                      <label class="form-label" for="form3Example1c">Your Name</label>
                    </div>
                  </div> */}

                  <div className="d-flex flex-row align-items-center mb-4">
                    <i className="fas fa-envelope fa-lg me-4 fa-fw"></i>
                    <div data-mdb-input-init className="form-outline flex-fill mb-0">
                      <input type="email" id="form3Example3c" className="form-control" placeholder="Email" name="email_log" value={formData.email_log}
                        onChange={handleChange}/>
                        {errors.email_log && (
                        <span className="error-message">
                            {errors.email_log}
                        </span>
                    )}
                      {/* <label class="form-label" for="form3Example3c">Your Email</label> */}
                    </div>
                  </div>

                  <div className="d-flex flex-row align-items-center mb-4">
                    <i className="fas fa-lock fa-lg me-4 fa-fw"></i>
                    <div data-mdb-input-init className="form-outline flex-fill mb-0">
                      <input type="password" id="form3Example4c" className="form-control" placeholder="Password" name="password_log" value={formData.password_log}
                        onChange={handleChange}/>
                      {/* <label class="form-label" for="form3Example4c">Password</label> */}
                      {errors.password_log && (
                        <span className="error-message">
                            {errors.password_log}
                        </span>
                    )}
                    </div>
                  </div>

                  {/* <div class="d-flex flex-row align-items-center mb-4">
                    <i class="fas fa-key fa-lg me-3 fa-fw"></i>
                    <div data-mdb-input-init class="form-outline flex-fill mb-0">
                      <input type="password" id="form3Example4cd" class="form-control" />
                      <label class="form-label" for="form3Example4cd">Repeat your password</label>
                    </div>
                  </div> */}

                  {/* <div class="form-check d-flex justify-content-center mb-5">
                    <input class="form-check-input me-2" type="checkbox" value="" id="form2Example3c" />
                    <label class="form-check-label" for="form2Example3">
                      I agree all statements in <a href="#!">Terms of service</a>
                    </label>
                  </div> */}

                  <div className="d-flex justify-content-left mx-5 mb-3 mb-lg-4">
                    <button  type="submit" data-mdb-button-init data-mdb-ripple-init className="btn btn-primary btn-lg">Login</button>
                  </div>

                </form>

              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
        </>
    )
}

export default Login;