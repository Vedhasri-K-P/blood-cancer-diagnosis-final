// src/pages/History.jsx
import React from 'react';
import dummyReports from '../assets/dummyReportData';

const History = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Diagnostic History</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dummyReports.map((item, index) => (
          <div key={index} className="bg-white shadow rounded-xl p-4">
            <p><strong>File:</strong> {item.imageName}</p>
            <p><strong>Result:</strong> {item.result}</p>
            <p><strong>Date:</strong> {item.date}</p>
            <img src={item.gradcam} alt="GradCAM" className="mt-2 w-full h-40 object-cover rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
