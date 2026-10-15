import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider, useLocation } from './context/LocationContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import BookingSuccessModal from './components/BookingSuccessModal';
import QRScannerModal from './components/QRScannerModal';

import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import FacilityDetailsPage from './pages/FacilityDetailsPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function MainApp() {
  const { user, openLoginModal } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [searchParams, setSearchParams] = useState({});
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);

  // Modals state
  const [gateScannerOpen, setGateScannerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  function handleInitiateSearch(params) {
    setSearchParams(params);
    setActivePage('search');
  }

  function handleOpenFacilityDetails(fac) {
    setSelectedFacilityId(fac.id);
    setActivePage('facility_details');
  }

  function handleProceedToCheckout(data) {
    if (!user) {
      openLoginModal();
      return;
    }
    setCheckoutData(data);
    setCheckoutModalOpen(true);
  }

  function handleBookingSuccess(resv) {
    setConfirmedReservation(resv);
  }

  function handleJoinWaitlist(info) {
    if (!user) {
      openLoginModal();
      return;
    }
    alert(`You have been added to the priority waitlist for this time slot! We will notify you when a bay opens.`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenGateScanner={() => setGateScannerOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            onSearch={handleInitiateSearch}
            onSelectFacility={handleOpenFacilityDetails}
          />
        )}

        {activePage === 'search' && (
          <SearchPage
            initialParams={searchParams}
            onSelectFacility={handleOpenFacilityDetails}
          />
        )}

        {activePage === 'facility_details' && selectedFacilityId && (
          <FacilityDetailsPage
            facilityId={selectedFacilityId}
            onBack={() => setActivePage('search')}
            onProceedToCheckout={handleProceedToCheckout}
            onJoinWaitlist={handleJoinWaitlist}
          />
        )}

        {activePage === 'customer_dashboard' && (
          <CustomerDashboardPage
            onSelectFacility={handleOpenFacilityDetails}
            onNavigateToSearch={() => setActivePage('search')}
          />
        )}

        {activePage === 'owner_dashboard' && (
          <OwnerDashboardPage
            onOpenGateScanner={() => setGateScannerOpen(true)}
          />
        )}

        {activePage === 'admin_dashboard' && (
          <AdminDashboardPage />
        )}
      </main>

      {/* Footer */}
      <Footer setActivePage={setActivePage} />

      {/* Global Modals */}
      <AuthModal />

      <QRScannerModal
        isOpen={gateScannerOpen}
        onClose={() => setGateScannerOpen(false)}
      />

      {checkoutModalOpen && checkoutData && (
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          facility={checkoutData.facility}
          selectedSlot={checkoutData.selectedSlot}
          startTime={checkoutData.startTime}
          endTime={checkoutData.endTime}
          vehicleType={checkoutData.vehicleType}
          needsEv={checkoutData.needsEv}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {confirmedReservation && (
        <BookingSuccessModal
          reservation={confirmedReservation}
          onClose={() => setConfirmedReservation(null)}
          onViewBookings={() => setActivePage('customer_dashboard')}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <MainApp />
      </LocationProvider>
    </AuthProvider>
  );
}
