import { useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = () => {
    if (trackingNumber.trim()) {
      window.location.href = `/track?ref=${trackingNumber}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-amber-400">SmartCAMPOST</span>
        </div>
        <nav className="flex space-x-6">
          <Link to="/auth/login" className="text-slate-300 hover:text-white">Login</Link>
          <Link to="/auth/login" className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-amber-400">Get Started</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Intelligent Postal Tracking <br />
          <span className="text-amber-400">with QR Technology</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Track your parcels in real-time with AI-powered logistics, geolocation, and secure QR-based verification.
        </p>

        {/* Tracking Input */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex">
            <input
              type="text"
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="flex-1 px-4 py-3 rounded-l-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleTrack}
              className="px-6 py-3 bg-amber-500 text-slate-900 rounded-r-lg hover:bg-amber-400 font-semibold"
            >
              Track
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-amber-500 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">QR Code Tracking</h3>
            <p className="text-slate-300">Scan QR codes at every step for secure, real-time updates.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-amber-500 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered ETA</h3>
            <p className="text-slate-300">Predictive delivery times with machine learning.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="w-12 h-12 bg-amber-500 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Home Pickup</h3>
            <p className="text-slate-300">Convenient door-to-door collection service.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-700 text-center text-slate-400">
        <p>&copy; 2025 SmartCAMPOST. Powered by AI Logistics.</p>
      </footer>
    </div>
  );
}