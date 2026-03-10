import React, { useState } from 'react';

const Navigation = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2E5A] to-[#1A5F5F] flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="ml-2 text-xl font-bold text-gray-800">Stardust</span>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
              <a href="#" className="border-[#4299E1] text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Dashboard
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Assets
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Insurance
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Legal
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Nominees
              </a>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A2E5A] to-[#1A5F5F] flex items-center justify-center text-white font-medium">
                    U
                  </div>
                  <button
                    onClick={onLogout}
                    className="ml-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>

                {/* Mobile menu button */}
                <button
                  className="md:hidden text-gray-500 hover:text-gray-700"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <a href="#" className="border-[#4299E1] text-gray-900 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Dashboard
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Assets
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Insurance
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Legal
              </a>
              <a href="#" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Nominees
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;