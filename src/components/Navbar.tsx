import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Globe, 
  Bell, 
  Sparkles,
  Headphones
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('English / हिन्दी / मराठी');

  useEffect(() => {
    const updateNotifs = () => {
      const notifs = StorageService.getMyNotifications();
      setUnreadCount(notifs.filter((n) => !n.read).length);
    };

    updateNotifs();
    const unsub = subscribeToStorage(updateNotifs);
    return () => {
      unsub();
    };
  }, []);

  const logoClicksRef = React.useRef(0);
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    logoClicksRef.current += 1;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (logoClicksRef.current >= 5) {
      logoClicksRef.current = 0;
      navigate('/admin');
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 2500);

    if (currentRoute !== '/') {
      navigate('/');
    }
  };

  const navLinks = [
    { label: 'Home', route: '/' },
    { label: 'Solutions', route: '/services', isHighlighted: true },
    { label: 'Schemes', route: '/schemes' },
    { label: 'Certificates', route: '/certificates', isHighlighted: true },
    { label: 'Complaints', route: '/complaints' },
    { label: 'Hotspot Map', route: '/hotspots' },
    { label: 'My Cases', route: '/cases' },
    { label: 'Notifications', route: '/notifications', badge: unreadCount },
    { label: 'Preferences', route: '/profile' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer select-none"
              id="nav-logo"
              title="NagpurSetu"
            >
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-[#0B1E38] group-hover:text-blue-900 transition-colors">
                  NagpurSetu
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 -mt-1">
                  NMC Civic Portal
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
              {navLinks.map((link) => {
                const isActive =
                  currentRoute === link.route ||
                  (link.route === '/cases' && currentRoute.startsWith('/cases')) ||
                  (link.route === '/talk' && currentRoute.startsWith('/talk'));

                if (link.isHighlighted) {
                  return (
                    <button
                      key={link.route}
                      onClick={() => navigate(link.route)}
                      className={`relative px-3.5 py-1.5 text-sm font-bold rounded-lg transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-blue-700 text-white border-blue-800 shadow-md ring-2 ring-blue-400/30'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border-blue-200 shadow-2xs'
                      }`}
                      id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {link.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={link.route}
                    onClick={() => navigate(link.route)}
                    className={`relative px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#0B1E38] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {link.label}
                      {link.badge && link.badge > 0 ? (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold text-white bg-red-600 rounded-full">
                          {link.badge}
                        </span>
                      ) : null}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0B1E38] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Tools */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                id="language-selector-button"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentLang}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <button
                    onClick={() => {
                      setCurrentLang('English / हिन्दी / मराठी');
                      StorageService.setLanguage('en');
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800 cursor-pointer"
                  >
                    <span>English (Default)</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLang('हिन्दी (Hindi)');
                      StorageService.setLanguage('hi');
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800 cursor-pointer"
                  >
                    <span>हिन्दी (Hindi)</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLang('मराठी (Marathi)');
                      StorageService.setLanguage('mr');
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800 cursor-pointer"
                  >
                    <span>मराठी (Marathi)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tell NagpurSetu Primary Button */}
            <button
              onClick={() => navigate('/talk')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0B1E38] hover:bg-[#152e52] rounded-md transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              id="nav-tell-nagpursetu-button"
            >
              <Headphones className="w-4 h-4" />
              <span>Tell NagpurSetu</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate('/talk')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0B1E38] rounded-md flex items-center gap-1 cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Tell NagpurSetu</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.route}
              onClick={() => {
                navigate(link.route);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium flex items-center justify-between cursor-pointer ${
                link.isHighlighted
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                {link.isHighlighted && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                {link.label}
              </span>
              {link.badge && link.badge > 0 ? (
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                  {link.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
