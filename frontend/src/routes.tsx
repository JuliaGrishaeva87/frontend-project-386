import { Navigate, Route, Routes } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import HostLayout from './pages/HostLayout';
import HostAvailabilityPage from './pages/HostAvailabilityPage';
import HostEventTypesPage from './pages/HostEventTypesPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BookingPage />} />
      <Route path="/host" element={<HostLayout />}>
        <Route index element={<Navigate to="availability" replace />} />
        <Route path="availability" element={<HostAvailabilityPage />} />
        <Route path="event-types" element={<HostEventTypesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
