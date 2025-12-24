import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/inventory', label: 'Inventory / Sell Records' },
  { to: '/invoice', label: 'Invoice' },
  { to: '/memos', label: 'Memo In / Out' },
  { to: '/production', label: 'Production Tracking' },
  { to: '/cashbook', label: 'Cashbook / Ledger' },
  { to: '/reports', label: 'Reporting' },
  { to: '/settings', label: 'Settings' }
];

const TopNav = () => (
  <nav className="flex flex-wrap gap-2 border-b border-border bg-white px-6 py-4">
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          [
            'rounded-full px-4 py-2 text-sm font-medium transition',
            isActive
              ? 'bg-primary text-white shadow'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          ].join(' ')
        }
      >
        {item.label}
      </NavLink>
    ))}
  </nav>
);

export default TopNav;
