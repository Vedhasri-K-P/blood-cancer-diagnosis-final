import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.password.value;

    try {
      const res = await axios.post("https://smart-diagnostic-tool.onrender.com/api/signup", { name, email, password });
      const data = res.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      const msg = err.response?.data?.error || "Signup failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/images/bg-medical.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.12,
          filter: "blur(2px)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-blue-200 opacity-60 z-0" />
      <div className="relative z-10 bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">👤 Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" required className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" required className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {loading ? "Creating..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} className="text-blue-600 cursor-pointer hover:underline">
              Log in
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
