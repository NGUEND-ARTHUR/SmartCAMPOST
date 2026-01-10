import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Package, Truck, MapPin, Shield } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">SmartCAMPOST</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/auth/login')}>
            Login
          </Button>
          <Button onClick={() => navigate('/auth/register')}>
            Register
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Smart Parcel Delivery <br />
          <span className="text-blue-600">Made Simple</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track, manage, and deliver parcels with confidence across Cameroon.
          Fast, reliable, and transparent logistics for everyone.
        </p>

        {/* Track Parcel */}
        <div className="max-w-md mx-auto mb-12">
          <div className="flex gap-2">
            <Input
              placeholder="Enter tracking number..."
              className="flex-1"
            />
            <Button>Track</Button>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth/register')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth/login')}>
            Sign In
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Easy Shipping</h3>
            <p className="text-sm text-gray-600">
              Create and manage shipments with just a few clicks
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-sm text-gray-600">
              Monitor your parcels every step of the way
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Fast Delivery</h3>
            <p className="text-sm text-gray-600">
              Express and standard options to suit your needs
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-2">Secure & Safe</h3>
            <p className="text-sm text-gray-600">
              Your parcels are protected with full insurance
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2026 SmartCAMPOST. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}