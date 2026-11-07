import { Outlet } from 'react-router-dom';

export default function HostLayout() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <Outlet />
    </div>
  );
}
