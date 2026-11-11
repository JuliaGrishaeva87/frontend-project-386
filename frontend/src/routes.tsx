import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingFlowProvider } from './context/BookingContext';
import BookingConfirmedPage from './pages/BookingConfirmedPage';
import BookingFormPage from './pages/BookingFormPage';
import AvailabilityPage from './pages/AvailabilityPage';
import EventSelectionPage from './pages/EventSelectionPage';
import LandingPage from './pages/LandingPage';
import BookingsPage from './pages/BookingsPage';

export default function AppRoutes() {
  return (
    <BookingFlowProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/event-types" element={<EventSelectionPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/confirm" element={<BookingFormPage />} />
        <Route path="/confirmed" element={<BookingConfirmedPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BookingFlowProvider>
  );
}
