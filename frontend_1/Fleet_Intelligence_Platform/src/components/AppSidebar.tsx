import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  LayoutDashboard, Car, Battery, Zap, BarChart3, Bell,
  Wrench, FileText, Settings, Users, ChevronLeft, ChevronRight,
  LogOut, Bolt, Activity, Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/data/mockData';

// Role-based navigation configuration
const getNavSectionsForRole = (role: UserRole) => {
  const baseSections = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      ],
    },
  ];

  switch (role) {
    case 'fleet_operator':
      return [
        ...baseSections,
        {
          label: 'Fleet Management',
          items: [
            { label: 'Vehicles', icon: Car, path: '/vehicles' },
            { label: 'Alerts', icon: Bell, path: '/alerts' },
            { label: 'Analytics', icon: BarChart3, path: '/analytics' },
            { label: 'Reports', icon: FileText, path: '/reports' },
          ],
        },
        {
          label: 'System',
          items: [
            { label: 'Settings', icon: Settings, path: '/settings' },
          ],
        },
      ];

    case 'maintenance_engineer':
      return [
        ...baseSections,
        {
          label: 'Maintenance',
          items: [
            { label: 'Alerts', icon: Bell, path: '/alerts' },
            { label: 'Maintenance', icon: Wrench, path: '/maintenance' },
            { label: 'Vehicles', icon: Car, path: '/vehicles' },
          ],
        },
        {
          label: 'System',
          items: [
            { label: 'Settings', icon: Settings, path: '/settings' },
          ],
        },
      ];

    case 'admin':
      return [
        ...baseSections,
        {
          label: 'Administration',
          items: [
            { label: 'Users', icon: Users, path: '/admin' },
            { label: 'Fleet Config', icon: Car, path: '/vehicles' },
            { label: 'Chargers', icon: Zap, path: '/charging' },
            { label: 'System Logs', icon: Activity, path: '/analytics' },
          ],
        },
        {
          label: 'Monitoring',
          items: [
            { label: 'Alerts', icon: Bell, path: '/alerts' },
            { label: 'Reports', icon: FileText, path: '/reports' },
            { label: 'Maintenance', icon: Wrench, path: '/maintenance' },
          ],
        },
        {
          label: 'System',
          items: [
            { label: 'Settings', icon: Settings, path: '/settings' },
          ],
        },
      ];

    default:
      return baseSections;
  }
};

export const AppSidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navSections = getNavSectionsForRole(user.role);

  const handleLogoClick = () => {
    toggleSidebar();
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={cn(
        'flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen sticky top-0 z-30',
        'md:relative md:translate-x-0',
        isCollapsed 
          ? 'w-16 -translate-x-full md:translate-x-0' 
          : 'w-60 translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          <button 
            onClick={handleLogoClick}
            className="flex items-center justify-center hover:bg-sidebar-primary/80 transition-colors rounded w-full"
          >
            <div className="flex items-center gap-4 p-4">
              <img 
                src="/ChatGPT_Image_Feb_24__2026__04_52_19_PM-removebg-preview.png" 
                alt="Fleet Vision Logo" 
                className="h-32 w-auto object-contain max-w-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/logo-placeholder.png';
                }}
              />
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!isCollapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted transition-opacity duration-200">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 768) {
                          toggleSidebar();
                        }
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-all duration-200',
                        active
                          ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <span className="transition-opacity duration-200">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <span className="transition-opacity duration-200">Logout</span>
            )}
          </button>
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent transition-all duration-200"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
