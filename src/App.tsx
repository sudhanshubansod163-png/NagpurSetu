import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { TalkScreen } from './components/TalkScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { MyCasesScreen } from './components/MyCasesScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ServicesScreen } from './components/ServicesScreen';
import { SchemesScreen } from './components/SchemesScreen';
import { CertificatesScreen } from './components/CertificatesScreen';
import { ComplaintsScreen } from './components/ComplaintsScreen';
import { HotspotsScreen } from './components/HotspotsScreen';
import { CaseDetailModal } from './components/CaseDetailModal';
import { StorageService } from './services/storage';
import { CaseItem, Department, MunicipalService } from './types';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.hash ? window.location.hash.replace('#', '') || '/' : '/';
  });

  // Draft report passed from TalkScreen to ReviewScreen
  const [draftReport, setDraftReport] = useState<{
    problemSummary: string;
    rawInput: string;
    category: string;
    department: Department;
    location: string;
    ward: string;
    photoUrl?: string;
  } | null>(null);

  // Active modal states
  const [selectedCaseModal, setSelectedCaseModal] = useState<CaseItem | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash ? window.location.hash.replace('#', '') || '/' : '/';
      setCurrentRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToReview = (draft: {
    problemSummary: string;
    rawInput: string;
    category: string;
    department: Department;
    location: string;
    ward: string;
    photoUrl?: string;
  }) => {
    setDraftReport(draft);
    navigate('/review');
  };

  const handleSelectService = (service: MunicipalService) => {
    setDraftReport({
      problemSummary: `Application for ${service.name}`,
      rawInput: `I want to apply for ${service.name} under ${service.department}.`,
      category: `${service.department} - Citizen Service`,
      department: service.department,
      location: '42 Dharampeth Extension, Nagpur',
      ward: 'Dharampeth (Ward 4)',
      photoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    });
    navigate('/talk');
  };

  // Determine which primary screen to render
  const renderScreen = () => {
    // Check for specific case route e.g. /cases/REQ-2024-892
    if (currentRoute.startsWith('/cases/')) {
      const caseId = currentRoute.replace('/cases/', '');
      return (
        <MyCasesScreen
          navigate={navigate}
          selectedCaseId={caseId}
        />
      );
    }

    if (currentRoute === '/talk' || currentRoute.startsWith('/talk')) {
      return (
        <TalkScreen
          navigate={navigate}
          onProceedToReview={handleProceedToReview}
        />
      );
    }

    if (currentRoute === '/review') {
      return (
        <ReviewScreen
          draftReport={draftReport}
          navigate={navigate}
          onViewCaseDetails={(c) => setSelectedCaseModal(c)}
        />
      );
    }

    if (currentRoute === '/cases') {
      return (
        <MyCasesScreen
          navigate={navigate}
        />
      );
    }

    if (currentRoute === '/notifications') {
      return (
        <NotificationsScreen
          navigate={navigate}
        />
      );
    }

    if (currentRoute === '/profile') {
      return (
        <ProfileScreen
          navigate={navigate}
        />
      );
    }

    if (currentRoute === '/services') {
      return (
        <ServicesScreen
          navigate={navigate}
          onSelectService={handleSelectService}
        />
      );
    }

    if (currentRoute === '/schemes') {
      return (
        <SchemesScreen
          navigate={navigate}
        />
      );
    }

    if (currentRoute === '/certificates') {
      return (
        <CertificatesScreen
          navigate={navigate}
        />
      );
    }

    if (currentRoute === '/complaints' || currentRoute.startsWith('/complaints')) {
      const trackingIdMatch = currentRoute.startsWith('/complaints/') ? currentRoute.replace('/complaints/', '') : undefined;
      return (
        <ComplaintsScreen
          navigate={navigate}
          initialTrackingId={trackingIdMatch}
        />
      );
    }

    if (currentRoute === '/hotspots') {
      return (
        <HotspotsScreen
          navigate={navigate}
        />
      );
    }

    // Default Home Screen (Screen 1)
    return (
      <HomeScreen
        navigate={navigate}
        onExploreServices={() => navigate('/services')}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFCFF] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 selection:bg-blue-100 selection:text-blue-900" id="nagpursetu-app">
      {/* Navigation Bar */}
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
      />

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col">
        {renderScreen()}
      </main>

      {/* Footer */}
      <Footer
        onOpenHelp={() => setHelpModalOpen(true)}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
        onOpenTerms={() => setTermsModalOpen(true)}
        onOpenAccessibility={() => navigate('/profile')}
      />

      {/* Case Details Modal */}
      {selectedCaseModal && (
        <CaseDetailModal
          caseItem={selectedCaseModal}
          onClose={() => setSelectedCaseModal(null)}
          onCaseUpdated={(updated) => {
            setSelectedCaseModal(updated);
          }}
        />
      )}

      {/* Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-[#0B1E38]">NagpurSetu Citizen Assistance</h3>
            <p className="text-slate-600 leading-relaxed">
              NagpurSetu enables every citizen of Nagpur to report issues with roads, waste collection, water supply, and streetlights using spoken Hindi, Marathi, or English.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg space-y-1">
              <div className="font-bold text-slate-900">NMC Citizen Helpline</div>
              <div className="text-slate-600">Toll Free: 1800-233-3764 / 0712-2567035</div>
              <div className="text-slate-600">Civil Lines, Nagpur - 440001</div>
            </div>
            <button
              onClick={() => setHelpModalOpen(false)}
              className="w-full py-2 bg-[#0B1E38] text-white font-bold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-[#0B1E38]">Privacy & Data Protection</h3>
            <p className="text-slate-600 leading-relaxed">
              Your location and attached photographs are strictly utilized by Nagpur Municipal Corporation zonal officers to inspect and resolve your reported civic issues.
            </p>
            <button
              onClick={() => setPrivacyModalOpen(false)}
              className="w-full py-2 bg-[#0B1E38] text-white font-bold rounded-lg"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-[#0B1E38]">Terms of Service</h3>
            <p className="text-slate-600 leading-relaxed">
              NagpurSetu is provided under the Digital Citizen Charter of the Nagpur Municipal Corporation (NMC). False or emergency reports must be verified by field inspection squads.
            </p>
            <button
              onClick={() => setTermsModalOpen(false)}
              className="w-full py-2 bg-[#0B1E38] text-white font-bold rounded-lg"
            >
              I Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
