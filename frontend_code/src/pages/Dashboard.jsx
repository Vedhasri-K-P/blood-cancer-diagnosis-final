import React, { useState, useEffect } from "react";
import { FaFileUpload, FaSpinner } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- FIX: Import the API function instead of using axios directly ---
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewURL(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewURL(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      const msg = "Please select an image file to upload.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      setResult(null);
      setError("");

      // --- FIX: Use classifyImage from api.js ---
      // This automatically uses the correct Render URL and attaches the Token.
      const response = await classifyImage(formData);
      
      // Axios returns the data inside 'data' property
      const data = response.data;

      if (data.error && data.error === "INVALID_IMAGE") {
        console.error("Backend validation error:", data.message);
        const msg = `Upload failed: ${data.message || 'Invalid image file.'}`;
        setError(msg);
        toast.error(msg);
        return;
      }
      
      if (data && data.prediction) {
        console.log("Received data from backend:", data); 
        setResult(data); 
        toast.success("Prediction successful!");
      } else {
         console.error("Unexpected response format:", data);
         setError("Received an unexpected response from the server.");
         toast.error("Received an unexpected response from the server.");
      }

    } catch (err) {
      console.error("Upload error details:", err);
      let errorMessage = "Prediction failed. Please try again.";
      
      if (err.response) {
         console.error("Backend Error Response:", err.response.data);
         if (err.response.data && err.response.data.error === "INVALID_IMAGE") {
             errorMessage = `Upload failed: ${err.response.data.message || 'Invalid image file.'}`;
         } else if (err.response.data && err.response.data.error) {
             errorMessage = `Error: ${err.response.data.error}`;
             if (err.response.status === 401) {
                  errorMessage = "Your session expired. Please log in again.";
             }
         } else if (err.response.status) {
             errorMessage = `Server Error: ${err.response.status}`;
         }
      } else if (err.request) {
         console.error("No response received:", err.request);
         errorMessage = "Network error: Could not connect to the server.";
      } else {
         console.error("Request setup error:", err.message);
         errorMessage = `Client error: ${err.message}`;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
     if (!selectedFile) {
       setPreviewURL(null);
       setResult(null);
       setError("");
     }
  }, [selectedFile]);

  return (
    <div className="flex">
      <Sidebar />
       <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <main className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="w-full max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">
            🔬 Blood Cancer Diagnostic Tool
          </h1>

          {/* Upload section */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50 space-y-4">
             {/* Image Preview */}
             {previewURL && (
                <div className="mb-4 border rounded-lg overflow-hidden shadow-sm">
                   <img src={previewURL} alt="Selected preview" className="max-h-48 w-auto" />
                </div>
             )}
             
            {/* File Input */}
            <label htmlFor="file-upload" className="cursor-pointer bg-white text-blue-600 px-4 py-2 rounded-full border border-blue-300 hover:bg-blue-50 text-sm font-medium">
                {selectedFile ? `Selected: ${selectedFile.name}` : "Choose Image File"}
            </label>
             <input
               id="file-upload"
               type="file"
               onChange={handleFileChange}
               className="hidden"
               accept="image/jpeg, image/png, image/jpg"
             />
             
            <button
              onClick={handleUpload}
              disabled={loading || !selectedFile}
              className={`bg-blue-600 text-white px-6 py-2.5 rounded-full shadow-md hover:bg-blue-700 flex items-center gap-2 transition duration-150 ease-in-out ${loading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                 <> <FaSpinner className="animate-spin mr-2" /> Processing... </>
              ) : (
                 <> <FaFileUpload /> Upload & Diagnose </>
              )}
            </button>
            {/* Error Message Area */}
            {error && !loading && (
              <p className="text-red-600 mt-3 font-semibold text-center text-sm bg-red-100 p-2 rounded-md">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* Prediction result */}
          {result && !loading && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mt-6 border border-blue-200 shadow-md space-y-4">
              <h2 className="text-2xl font-semibold text-blue-800 border-b pb-2 mb-4">
                🧬 Prediction Result
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-gray-800">
                  <p><strong>Disease:</strong></p> 
                  <p className="font-medium text-blue-900">{result.prediction}</p>
                  
                  <p><strong>Confidence:</strong></p>
                  <p className="font-medium">{result.confidence ? `${result.confidence.toFixed(2)}%` : 'N/A'}</p> 
                  
                  <p><strong>Stage:</strong></p> 
                  <p>{result.stage || 'N/A'}</p>
              </div>

               <div className="pt-3">
                    <p className="font-semibold text-gray-700 mb-1">Explanation:</p>
                    <p className="text-gray-600 text-sm italic bg-gray-100 p-3 rounded-md">
                        📝 {result.explanation || 'No explanation provided.'}
                    </p>
               </div>

              {/* Grad-CAM visualization */}
              {result.gradcam_url && (
                <div className="mt-5 pt-4 border-t">
                   <h3 className="font-semibold text-gray-700 mb-2">Grad-CAM Visualization</h3>
                  <img
                    src={result.gradcam_url}
                    alt="Grad-CAM Heatmap"
                    className="rounded-xl border border-gray-300 max-w-xs mx-auto shadow-sm"
                  />
                  <p className="text-xs text-gray-500 text-center mt-1">Heatmap highlighting areas influencing the prediction.</p>
                </div>
              )}

              {/* PDF report link */}
              {result.pdf_url && (
                <div className="mt-4 text-center">
                  <a
                    href={result.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 text-white px-5 py-2 rounded-full shadow hover:bg-green-700 text-sm font-medium transition duration-150"
                  >
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