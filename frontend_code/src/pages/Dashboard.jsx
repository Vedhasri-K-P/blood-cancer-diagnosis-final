import React, { useState, useEffect } from "react";
import { FaFileUpload, FaSpinner } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// IMPORT THE API FUNCTION
import { classifyImage } from "../services/api";

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError("");
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // USE THE API FUNCTION (Handles URL and Token automatically)
      const response = await classifyImage(formData);
      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success("Prediction successful!");

    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.response?.data?.error || err.message || "Connection failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <main className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="w-full max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-8">
          <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">
            🔬 Blood Cancer Diagnostic Tool
          </h1>

          {/* Upload Box */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50 space-y-4">
            {previewURL && (
              <img src={previewURL} alt="Preview" className="max-h-48 rounded shadow" />
            )}
            
            <input type="file" id="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            <label htmlFor="file" className="cursor-pointer bg-white text-blue-600 px-4 py-2 rounded-full border border-blue-300 hover:bg-blue-50">
              {selectedFile ? selectedFile.name : "Choose Image File"}
            </label>
            
            <button 
              onClick={handleUpload} 
              disabled={loading || !selectedFile}
              className={`bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaFileUpload />}
              {loading ? "Processing..." : "Upload & Diagnose"}
            </button>
            
            {error && <p className="text-red-600 bg-red-100 p-2 rounded text-sm">{error}</p>}
          </div>

          {/* Results */}
          {result && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 shadow animate-fade-in">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">🧬 Results</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Disease</p>
                  <p className="text-xl font-bold text-blue-900">{result.prediction}</p>
                </div>
                <div>
                  <p className="text-gray-600">Confidence</p>
                  <p className="text-xl font-bold text-green-600">{result.confidence.toFixed(2)}%</p>
                </div>
              </div>
              
              {result.gradcam_url && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Grad-CAM Visualization</p>
                  <img src={result.gradcam_url} alt="Heatmap" className="h-40 rounded border" />
                </div>
              )}
              
              {result.pdf_url && (
                <div className="mt-6 text-center">
                  <a href={result.pdf_url} target="_blank" rel="noreferrer" className="bg-green-600 text-white px-6 py-2 rounded-full shadow hover:bg-green-700">
                    Download PDF Report
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;