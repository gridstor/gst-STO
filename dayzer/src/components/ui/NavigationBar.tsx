/**
 * NavigationBar Component
 * 
 * Hierarchical navigation header for GridStor Market Sight application.
 * Adapted from the GridStor Design System for the Short Term Outlook site.
 */

import React from 'react';

export interface NavLink {
  /** Link label text */
  label: string;
  /** Link URL path */
  href?: string;
  /** Optional dropdown items */
  dropdown?: NavLink[];
  /** Optional description text for dropdown items */
  description?: string;
}

export interface NavigationBarProps {
  /** Current page path for active state highlighting */
  currentPath?: string;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
  /** Page title to show next to bolt (replaces "GridStor Market Sight" on sub-pages) */
  pageTitle?: string;
  /** Sub-navigation links for the current page (replaces main nav on sub-pages) */
  subNavLinks?: NavLink[];
}

export function NavigationBar({ 
  currentPath = '/', 
  onSettingsClick,
  pageTitle,
  subNavLinks 
}: NavigationBarProps) {
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = React.useState<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = (label: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setOpenDropdown(label);
  };
  
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 200); // 200ms delay before closing
    setCloseTimeout(timeout);
  };
  
  // Determine if we're on home page or a sub-page
  const isHomePage = !pageTitle && !subNavLinks;
  
  // Default main navigation links (for home page)
  const mainNavLinks: NavLink[] = [
    { label: 'Short Term Outlook', href: '/short-term-outlook' },
    { label: 'Weekly Insight', href: '/short-term-outlook/weekly-insight' },
  ];

  // Determine which links to show
  const navigationLinks = subNavLinks || mainNavLinks;

  // Link class generator
  const getLinkClass = (href: string) => {
    const isActive = currentPath === href || currentPath.startsWith(href + '/');
    return `text-white hover:text-gray-300 transition-colors font-medium ${
      isActive ? 'text-gray-300' : ''
    }`;
  };

  // Check if any dropdown item is active
  const isDropdownActive = (dropdown: NavLink[]) => {
    return dropdown.some(item => item.href && (currentPath === item.href || currentPath.startsWith(item.href + '/')));
  };

  // Displayed title (either page title or site name)
  const displayTitle = pageTitle || 'GridStor Short Term Outlook';

  return (
    <header className="bg-gs-near-black text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo - ALWAYS links to home */}
            <a
              href="/"
              className="flex items-center gap-3 text-xl font-bold hover:text-gray-300 transition-colors"
              aria-label="GridStor Short Term Outlook Home"
            >
              {/* Lightning Bolt Icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                role="presentation"
              >
                <path
                  d="M55 10L30 55H50L45 90L70 45H50L55 10Z"
                  fill="#06B6D4"
                  stroke="#06B6D4"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{displayTitle}</span>
            </a>

            {/* Navigation Links (Main or Sub-navigation) */}
            <nav
              className="hidden lg:flex items-center gap-8"
              role="navigation"
              aria-label={isHomePage ? 'Primary' : 'Secondary'}
            >
              {navigationLinks.map((link, index) => {
                // If link has dropdown
                if (link.dropdown) {
                  const hasActiveItem = isDropdownActive(link.dropdown);
                  return (
                    <div 
                      key={link.label}
                      className="relative"
                      onMouseEnter={() => handleMouseEnter(link.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        className={`text-white hover:text-gray-300 transition-colors font-medium flex items-center gap-1 ${
                          hasActiveItem ? 'text-gray-300' : ''
                        }`}
                      >
                        {link.label}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openDropdown === link.label && (
                        <div 
                          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                          onMouseEnter={() => handleMouseEnter(link.label)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {link.dropdown.map((dropdownItem) => {
                            const isActive = dropdownItem.href && (currentPath === dropdownItem.href || currentPath.startsWith(dropdownItem.href + '/'));
                            return (
                              <a
                                key={dropdownItem.href}
                                href={dropdownItem.href}
                                className={`block px-4 py-3 hover:bg-indigo-50 transition-colors group ${
                                  isActive ? 'bg-indigo-50' : ''
                                }`}
                              >
                                <div className={`text-sm font-medium group-hover:text-indigo-600 transition-colors ${
                                  isActive ? 'text-indigo-600' : 'text-gray-900'
                                }`}>
                                  {dropdownItem.label}
                                </div>
                                {dropdownItem.description && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {dropdownItem.description}
                                  </div>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Regular link without dropdown
                const isActive = link.href && (currentPath === link.href || currentPath.startsWith(link.href + '/'));
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={getLinkClass(link.href!)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Right: Settings */}
          <div className="flex items-center gap-2 ml-4">
            <a
              href="/admin/dev-ops"
              className="p-2 hover:bg-gs-gray-700 rounded-md transition-colors"
              aria-label="Development Operations"
              title="Development Operations"
            >
              {/* Settings Icon */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

