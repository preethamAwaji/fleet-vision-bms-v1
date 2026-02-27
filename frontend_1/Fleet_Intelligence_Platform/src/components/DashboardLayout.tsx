import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

const DashboardContent = () => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? 'ml-0' : 'ml-0'
      }`}>
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
};
