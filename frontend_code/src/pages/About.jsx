import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 px-4 py-12 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero / Mission */}
        <section className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">
            Empowering Healthcare Through AI
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Our Smart Diagnostic Tool revolutionizes blood cancer detection by combining AI accuracy with medical expertise—making diagnostics faster, smarter, and more accessible.
          </p>
        </section>

        {/* What We Do */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-4 border-b-4 border-blue-500 inline-block">
            What We Do
          </h2>
          <p className="text-lg leading-relaxed">
            We provide AI-powered diagnosis for blood cancers like Leukemia and Multiple Myeloma using cutting-edge deep learning models. Our platform offers:
          </p>
          <ul className="list-disc ml-8 mt-4 space-y-2 text-gray-700">
            <li>Automated cancer type classification from blood smear images</li>
            <li>Visual explanation using Grad-CAM for transparency</li>
            <li>Detailed downloadable reports with confidence scores</li>
            <li>Secure and privacy-focused user experience</li>
          </ul>
        </section>

        {/* Meet the Team */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-4 border-b-4 border-blue-500 inline-block">
            Meet the Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-6">
            <div className="bg-blue-50 p-6 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-xl font-bold text-blue-700">Vedhasri</h3>
              <p className="text-gray-600 mt-2">Project Lead & Developer</p>
              <p className="text-sm text-gray-500 mt-2">Focused on AI, UX and backend architecture for seamless diagnostics.</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-xl font-bold text-blue-700">Yashpal Singh</h3>
              <p className="text-gray-600 mt-2">ML Specialist</p>
              <p className="text-sm text-gray-500 mt-2">Helped fine-tune models and interpret diagnostic visualizations.</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-xl font-bold text-blue-700">AI Research Support</h3>
              <p className="text-gray-600 mt-2">ML Specialist</p>
              <p className="text-sm text-gray-500 mt-2">Helped fine-tune models and interpret diagnostic visualizations.</p>
            </div>
          </div>
        </section>

        {/* Contact / Support */}
        <section>
          <h2 className="text-3xl font-semibold mb-4 border-b-4 border-blue-500 inline-block">
            Contact & Support
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Have feedback or need assistance? We're here to help.
          </p>
          <div className="bg-blue-100 p-6 rounded-lg max-w-2xl">
            <p className="text-gray-800"><strong>Email:</strong> support@smartdiagnostic.ai</p>
            <p className="text-gray-800 mt-2"><strong>Phone:</strong> +91-9876543210</p>
            <p className="text-gray-800 mt-2"><strong>Working Hours:</strong> Mon - Fri, 9:00 AM to 6:00 PM IST</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
