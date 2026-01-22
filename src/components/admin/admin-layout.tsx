import { ReactNode } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminBreadcrumb } from './admin-breadcrumb';

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-[calc(100-64px)] bg-muted/30">
            {/* Sidebar - Hidden on mobile, shown on md+ */}
            <aside className="hidden md:block w-64 border-r bg-card sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                <AdminSidebar />
            </aside>

            <div className="flex-1 flex flex-col min-w-0 pb-12">
                {/* Top Header/Breadcrumb */}
                <header className="h-14 border-b bg-card px-6 flex items-center justify-between sticky top-16 z-20">
                    <AdminBreadcrumb />
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            System Online
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
