import React from 'react';
import { Sprout, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl">MASHTAL</span>
            </div>
            <p className="text-neutral-400 mb-4">
              Connecting agricultural communities and empowering sustainable farming across the region.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">About Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Featured Businesses</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Success Stories</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Blog & Resources</a>
              </li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="text-white mb-4">For Businesses</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Register Your Business</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Pricing Plans</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Marketing Tools</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Support Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">Partner Program</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Riyadh, Saudi Arabia</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">+966 11 234 5678</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">support@mashtal.sa</span>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="text-white text-sm mb-2">Subscribe to Newsletter</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm outline-none focus:border-green-600 transition-colors"
                />
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
            <div>
              © 2024 Mashtal. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-green-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-green-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
