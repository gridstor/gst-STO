import React, { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  // Track current path for active state
  useEffect(() => {
    setCurrentPath(window.location.pathname);
    
    // Listen for navigation changes (for client-side routing)
    const handlePopstate = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopstate);
    
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  const dropdownItems = [
    { name: 'CAISO System', href: '/short-term-outlook/caiso-system' },
    { name: 'Goleta Node', href: '/short-term-outlook/goleta' },
  ];

  // Determine if we're on a CAISO Forecast dropdown page
  const isCAISOSystemActive = currentPath.startsWith('/short-term-outlook/caiso-system') || 
                              currentPath === '/short-term-outlook/goleta';
  const isLikedayActive = currentPath === '/short-term-outlook/likeday';

  return (
    <header className="bg-[#2A2A2A] text-white shadow-sm">
      <div className="max-w-7xl mx-auto pl-2 pr-4 sm:pl-3 sm:pr-6 lg:pl-4 lg:pr-8">
        <div className="flex justify-between items-center py-3">
          {/* Left side: Logo + Navigation */}
          <div className="flex items-center gap-7">
                         {/* GridStor Analytics Logo */}
             <a 
               href="https://gridstoranalytics.com" 
               className="hover:text-gray-300 transition-colors"
             >
               <div className="bg-white p-1 flex items-center justify-center">
                 <img src="/new_GST_logo.png" alt="GridStor Analytics Logo" className="h-6 w-auto" />
               </div>
             </a>
            
            {/* Short Term Outlook Brand Name */}
            <a 
              href="/short-term-outlook" 
              className="text-lg font-semibold hover:text-gray-300 transition-colors"
            >
              Short Term Outlook
            </a>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* CAISO Forecast Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button
                  className={`flex items-center text-sm font-medium transition-colors px-3 py-1 ${
                    isCAISOSystemActive ? 'text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  CAISO Forecast
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {dropdownItems.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Insight Tab */}
              <a
                href="/short-term-outlook/weekly-insight"
                className={`text-sm font-medium transition-colors px-3 py-1 ${
                  currentPath === '/short-term-outlook/weekly-insight' ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Weekly Insight
              </a>

              {/* Likeday Tool Tab */}
              <a
                href="/short-term-outlook/likeday"
                className={`text-sm font-medium transition-colors px-3 py-1 ${
                  isLikedayActive ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Likeday Tool
              </a>
            </nav>
          </div>
          
          {/* Right side: Settings icon */}
          <div className="flex items-center">
            {/* Settings Icon */}
            <button className="p-2 hover:bg-gray-700 rounded-md transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 