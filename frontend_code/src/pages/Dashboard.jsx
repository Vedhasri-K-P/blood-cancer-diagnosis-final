import React, { useState, useEffect } from "react"; // Added useEffect
import axios from "axios";
import { FaFileUpload, FaSpinner } from "react-icons/fa"; // Added FaSpinner
import Sidebar from "../components/Sidebar";
import { toast, ToastContainer } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Import toast CSS

// Helper to get token (adjust based on where you store it)
const getToken = () => localStorage.getItem("token"); 

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null); // For image preview
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null); // Clear previous results
      setError("");
      // Create a preview URL
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
      setError("Please select an image file to upload.");
      toast.error("Please select an image file to upload."); // Toast notification
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      setResult(null); // Clear previous result during loading
      setError("");

      const token = getToken(); // Get auth token
      if (!token) {
           setError("Authentication error. Please log in again.");
           toast.error("Authentication error. Please log in again.");
           setLoading(false);
           // Optional: Redirect to login page
           // navigate('/login'); 
           return;
      }

      // Send request to backend with Authorization header
      const res = await axios.post("http://localhost:5000/api/classify", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}` // Add JWT token
        },
      });

      // Backend should send a specific error structure on invalid image
      if (res.data.error && res.data.error === "INVALID_IMAGE") {
        console.error("Backend validation error:", res.data.message);
        setError(`Upload failed: ${res.data.message || 'Invalid image file.'}`);
        toast.error(`Upload failed: ${res.data.message || 'Invalid image file.'}`);
        setResult(null);
        setLoading(false); // Make sure loading stops
        return; 
      }
      
      // --- FIX: Check for the correct top-level keys ---
      if (res.data && res.data.prediction) {
        // Log the received data for debugging
        console.log("Received data from backend:", res.data); 
        
        // --- FIX: Set the entire response data to the result state ---
        setResult(res.data); 
        toast.success("Prediction successful!"); // Success notification
      } else {
         // Handle unexpected successful response format
         console.error("Unexpected response format:", res.data);
         setError("Received an unexpected response from the server.");
         toast.error("Received an unexpected response from the server.");
         setResult(null);
      }

    } catch (err) {
      console.error("Upload error details:", err);
      // More specific error handling
      let errorMessage = "Prediction failed. Please try again.";
      if (err.response) {
         // The request was made and the server responded with a status code
         // that falls out of the range of 2xx
         console.error("Backend Error Response:", err.response.data);
         if (err.response.data && err.response.data.error === "INVALID_IMAGE") {
              errorMessage = `Upload failed: ${err.response.data.message || 'Invalid image file.'}`;
         } else if (err.response.data && err.response.data.error) {
              errorMessage = `Error: ${err.response.data.error}`; // Show specific backend error
              if (err.response.status === 401) { // Handle token expiration
                   errorMessage = "Your session expired. Please log in again.";
                   // Optional: Add logout logic here
              }
         } else if (err.response.status) {
             errorMessage = `Server Error: ${err.response.status}`;
         }
      } else if (err.request) {
         // The request was made but no response was received
         console.error("No response received:", err.request);
         errorMessage = "Network error: Could not connect to the server.";
      } else {
         // Something happened in setting up the request that triggered an Error
         console.error("Request setup error:", err.message);
         errorMessage = `Client error: ${err.message}`;
      }
      setError(errorMessage);
      toast.error(errorMessage); // Show error toast
      setResult(null); // Clear result on error
    } finally {
      setLoading(false); // Ensure loading is always turned off
    }
  };
  
  // Clear result when file selection is cleared
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
             
            {/* File Input - Styled */}
            <label htmlFor="file-upload" className="cursor-pointer bg-white text-blue-600 px-4 py-2 rounded-full border border-blue-300 hover:bg-blue-50 text-sm font-medium">
                {selectedFile ? `Selected: ${selectedFile.name}` : "Choose Image File"}
            </label>
             <input
               id="file-upload"
               type="file"
               onChange={handleFileChange}
               className="hidden" // Hide default input
               accept="image/jpeg, image/png, image/jpg" // Be specific about accepted types
             />
             
            <button
              onClick={handleUpload}
              disabled={loading || !selectedFile} // Disable button when loading or no file
              className={`bg-blue-600 text-white px-6 py-2.5 rounded-full shadow-md hover:bg-blue-700 flex items-center gap-2 transition duration-150 ease-in-out ${loading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                 <> <FaSpinner className="animate-spin mr-2" /> Processing... </>
              ) : (
                 <> <FaFileUpload /> Upload & Diagnose </>
              )}
            </button>
            {/* Error Message Area */}
            {error && !loading && ( // Only show error if not loading
              <p className="text-red-600 mt-3 font-semibold text-center text-sm bg-red-100 p-2 rounded-md">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* Loading Indicator (alternative position) */}
          {/* {loading && (
            <div className="flex justify-center items-center mt-6">
              <FaSpinner className="animate-spin text-blue-600 text-3xl" />
              <p className="ml-3 text-blue-700">Processing image, please wait...</p>
            </div>
          )} */}

          {/* Prediction result - Improved Layout */}
          {result && !loading && ( // Only show result if not loading and result exists
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mt-6 border border-blue-200 shadow-md space-y-4">
              <h2 className="text-2xl font-semibold text-blue-800 border-b pb-2 mb-4">
                🧬 Prediction Result
              </h2>

              {/* Use grid for better alignment */}
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

              {/* --- FIX: Grad-CAM visualization using result.gradcam_url --- */}
              {result.gradcam_url && ( // Check if the URL exists directly on result
                <div className="mt-5 pt-4 border-t">
                   <h3 className="font-semibold text-gray-700 mb-2">Grad-CAM Visualization</h3>
                  <img
                    src={result.gradcam_url} // Use the correct key
                    alt="Grad-CAM Heatmap"
                    className="rounded-xl border border-gray-300 max-w-xs mx-auto shadow-sm" // Center and limit size
                  />
                  <p className="text-xs text-gray-500 text-center mt-1">Heatmap highlighting areas influencing the prediction.</p>
                </div>
              )}

              {/* --- FIX: PDF report link using result.pdf_url --- */}
              {result.pdf_url && ( // Check if the URL exists directly on result
                <div className="mt-4 text-center">
                  <a
                    href={result.pdf_url} // Use the correct key
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
