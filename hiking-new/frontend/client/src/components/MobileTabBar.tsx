import { NavLink, useNavigate } from 'react-router-dom';
import { Backpack, CalendarDays, Home, Plus, Route as RouteIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const LEFT_TABS: TabItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/routes', label: '路线', icon: RouteIcon },
];

const RIGHT_TABS: TabItem[] = [
  { path: '/gear', label: '装备', icon: Backpack },
  { path: '/events', label: '活动', icon: CalendarDays },
];

const MobileTabBar = () => {
  const navigate = useNavigate();

  const renderTab = (item: TabItem) => {
    const Icon: LucideIcon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }: { isActive: boolean }) =>
          `flex min-h-11 flex-col items-center justify-center gap-0.5 transition-colors ${
            isActive
              ? 'font-semibold text-pine-800'
              : 'font-medium text-muted-foreground hover:text-ink'
          }`
        }
      >
        {({ isActive }: { isActive: boolean }) => (
          <>
            <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
            <span className="text-[11px] leading-none">{item.label}</span>
            <span
              className={`h-1 w-1 rounded-full transition-opacity ${
                isActive ? 'bg-ember-500 opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}
      </NavLink>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-paper/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {LEFT_TABS.map(renderTab)}
        <button
          onClick={() => navigate('/publish')}
          aria-label="发帖"
          className="flex min-h-11 flex-col items-center justify-end pb-1.5"
        >
          <span className="-mt-5 mb-1 grid h-12 w-12 place-items-center rounded-full bg-ember-500 text-paper shadow-lg shadow-ember-500/40 ring-4 ring-paper">
            <Plus size={22} strokeWidth={2.5} />
          </span>
          <span className="text-[11px] leading-none font-medium text-muted-foreground">发帖</span>
        </button>
        {RIGHT_TABS.map(renderTab)}
      </div>
    </nav>
  );
};

export default MobileTabBar;
