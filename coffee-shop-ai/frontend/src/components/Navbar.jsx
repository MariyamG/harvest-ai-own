import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Coffee Shop AI</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Dashboard</Link>
              <Link to="/scheduling" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Scheduling</Link>
              <Link to="/inventory" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Inventory</Link>
              <Link to="/reports" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Reports</Link>
              <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Settings</Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-sm">Coffee Shop Owner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/scheduling" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Scheduling
            </Link>
            <Link 
              to="/inventory" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Inventory
            </Link>
            <Link 
              to="/reports" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Reports
            </Link>
            <Link 
              to="/settings" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
