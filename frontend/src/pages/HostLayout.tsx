import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1 border rounded ${isActive ? 'bg-gray-200 font-semibold' : ''}`;

export default function HostLayout() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <nav className="flex gap-2 mb-4">
        <NavLink to="/" className={linkClass}>
          Guest view
        </NavLink>
        <NavLink to="/host/availability" className={linkClass}>
          Availability
        </NavLink>
        <NavLink to="/host/event-types" className={linkClass}>
          Event types
        </NavLink>
        <NavLink to="/host/bookings" className={linkClass}>
          Upcoming meetings
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
