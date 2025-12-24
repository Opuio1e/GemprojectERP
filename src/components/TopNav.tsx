import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/memos', label: 'Memo UI' },
  { to: '/cashbook', label: 'Cashbook UI' }
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
