import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.password.value;

    try {
      const res = await axios.post("https://smart-diagnostic-tool.onrender.com/api/login", { email, password });
      const data = res.data;

      // Save token and user to localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.response?.data?.error || "Login failed";
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
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">🧬 Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" required className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" required className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {loading ? "Signing in..." : "Log In"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/signup")} className="text-blue-600 cursor-pointer hover:underline">
              Sign up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
