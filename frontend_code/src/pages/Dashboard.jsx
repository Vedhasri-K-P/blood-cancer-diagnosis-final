// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// FIX: Import the classifyImage function from api.js
import { classifyImage } from "../services/api";
import { toast } from "react-toastify";

// Icons (optional)
import { FaCloudUploadAlt, FaSpinner, FaFilePdf, FaNotesMedical, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null); // Clear previous results
    }
  };

  // Handle Upload & Predict
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // FIX: Use the API function instead of fetch/axios directly
      // This ensures it goes to /api/classify with the correct Token
      const response = await classifyImage(formData);
      
      // Handle the response (axios returns data in response.data)
      const data = response.data || response;
      
      setResult(data);
      toast.success("Prediction successful!");
    } catch (error) {
      console.error("Upload error details:", error);
      const msg = error.response?.data?.error || error.message || "Failed to classify image";
      toast.error(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Blood Cancer Diagnostic Tool</h1>
          <p className="text-gray-500">Upload a blood smear image for instant AI analysis.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/profile" className="px-4 py-2 border rounded-lg hover:bg-gray-50">My Profile</Link>
          <Link to="/reports" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Past Reports</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Upload Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors">
            
            {!preview ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <FaCloudUploadAlt size={32} />
                </div>
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer bg-white px-6 py-2 rounded-lg shadow-sm border border-gray-200 text-blue-600 font-semibold hover:text-blue-700">
                    Choose Image File
                  </label>
                  <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <p className="text-sm text-gray-400">Supported formats: JPG, PNG, JPEG</p>
              </div>
            ) : (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                <button 
                  onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  title="Remove image"
                >
                  ✕
                </button>
                <p className="mt-2 text-sm text-gray-500">{selectedFile.name}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className={`w-full mt-6 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              !selectedFile || loading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
            }`}
          >
            {loading ? (
              <><FaSpinner className="animate-spin" /> Processing...</>
            ) : (
              <><FaNotesMedical /> Upload & Diagnose</>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Results Section */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100 p-8 min-h-[300px]">
              <FaNotesMedical size={48} className="mb-4 opacity-20" />
              <p>Results will appear here after diagnosis.</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-8 min-h-[300px]">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Analyzing cell structure...</p>
              <p className="text-sm text-gray-400">Generating Grad-CAM visualization...</p>
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className={`p-4 flex items-center gap-3 ${
                result.prediction === "Normal" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                {result.prediction === "Normal" ? <FaCheckCircle size={24} /> : <FaExclamationTriangle size={24} />}
                <div>
                  <h2 className="font-bold text-xl">Prediction Result</h2>
                  <p className="text-sm opacity-90">Analysis Complete</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Disease</p>
                    <p className="font-bold text-xl text-gray-800">{result.prediction}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Confidence</p>
                    <p className="font-bold text-xl text-blue-600">{result.confidence}%</p>
                  </div>
                </div>

                {/* Stage Info (Only if applicable) */}
                {result.stage && result.stage !== "N/A" && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-sm text-orange-600 mb-1 font-semibold">Detected Stage</p>
                    <p className="font-bold text-gray-800">{result.stage}</p>
                  </div>
                )}

                {/* Explanation */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">AI Explanation:</h3>
                  <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border">
                    {result.explanation || "No explanation provided."}
                  </p>
                </div>

                {/* Visualizations */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-700 mb-3">Grad-CAM Visualization</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {result.gradcam_url ? (
                      <div className="relative group">
                        <img 
                          src={result.gradcam_url} 
                          alt="Grad-CAM" 
                          className="h-32 rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(result.gradcam_url, '_blank')}
                        />
                        <span className="text-xs text-center block mt-1 text-gray-500">Heatmap</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No visualization available.</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {result.pdf_url && (
                  <a 
                    href={result.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-gray-800 text-white text-center rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaFilePdf /> Download PDF Report
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}