import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("https://smart-diagnostic-tool.onrender.com/api/reports", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    .then((res) => { setReports(res.data || []); })
    .catch((err) => {
      console.error("Failed to load reports:", err);
      setError(err.response?.data?.error || err.message || "Unable to load reports.");
    })
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-center">Loading reports...</p>;
  if (error) return <p className="p-6 text-center text-red-600">Error: {error}</p>;

  return (
    <div className="p-6 container mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">📄 Past Diagnosis Reports</h2>
      {reports.length === 0 ? (
        <p className="text-gray-600">No reports found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-2xl shadow">
            <thead>
              <tr className="bg-blue-100 text-blue-900 text-left">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Disease</th>
                <th className="px-4 py-2">Confidence</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Grad-CAM</th>
                <th className="px-4 py-2">PDF</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, idx) => (
                <tr key={report.id || idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">{idx + 1}</td>
                  <td className="px-4 py-3 align-top">{report.username || "Unknown"}</td>
                  <td className="px-4 py-3 align-top">{report.disease || "N/A"}</td>
                  <td className="px-4 py-3 align-top">{report.confidence != null ? `${report.confidence}%` : "N/A"}</td>
                  <td className="px-4 py-3 align-top">{report.stage || "N/A"}</td>
                  <td className="px-4 py-3 align-top">{report.date || "N/A"}</td>
                  <td className="px-4 py-3 align-top">
                    {report.gradcam_url ? (
                      <a href={report.gradcam_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                    ) : "No Image"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {report.pdf_url ? (
                      <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                    ) : "No Report"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
