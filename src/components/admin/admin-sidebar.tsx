import { Link, useLocation } from '@tanstack/react-router';
import {
    LayoutDashboard,
    Users,
    Trophy,
    AlertCircle,
    BookOpen,
    Award,
    History,
    Settings,
    ChevronRight,
    Mail,
    MessageSquare,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
    const location = useLocation();

    const menuItems = [
        {
            label: 'Main',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
                { label: 'Submissions', icon: History, href: '/admin/submissions' },
            ],
        },
        {
            label: 'Management',
            items: [
                { label: 'Challenges', icon: Trophy, href: '/admin/challenges' },
                { label: 'Users', icon: Users, href: '/admin/users' },
                { label: 'Bug Reports', icon: AlertCircle, href: '/admin/bugs' },
            ],
        },
        {
            label: 'Content',
            items: [
                { label: 'Tutorials', icon: BookOpen, href: '/admin/tutorials' },
                { label: 'Achievements', icon: Award, href: '/admin/achievements' },
            ],
        },
        {
            label: 'System',
            items: [
                { label: 'Settings', icon: Settings, href: '/admin/settings' },
                { label: 'System Debug', icon: RefreshCw, href: '/admin/debug' },
            ],
        },
        {
            label: 'Communication',
            items: [
                { label: 'Newsletter', icon: Mail, href: '/admin/newsletter' },
                { label: 'Messages', icon: MessageSquare, href: '/admin/messages' },
            ],
        },
    ];

    return (
        <div className="flex flex-col h-full py-4">
            <nav className="flex-1 px-4 space-y-8">
                {menuItems.map((group) => (
                    <div key={group.label} className="space-y-1">
                        <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            {group.label}
                        </h4>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative",
                                            isActive
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-4 w-4 shrink-0 transition-colors",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )} />
                                        <span className="flex-1">{item.label}</span>
                                        {isActive && (
                                            <ChevronRight className="h-3 w-3 text-primary animate-in fade-in slide-in-from-left-1" />
                                        )}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="px-6 py-4 border-t mt-auto">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg">
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold truncate leading-tight">Admin Portal</span>
                        <span className="text-[10px] text-muted-foreground truncate leading-tight">v2.0 Beta</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
