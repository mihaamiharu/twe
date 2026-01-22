import { Link, useLocation } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

export function AdminBreadcrumb() {
    const location = useLocation();
    const paths = location.pathname.split('/').filter(Boolean);

    // Skip the first "admin" path for the breadcrumb list since we'll show Home icon for it
    const breadcrumbPaths = paths.slice(1);

    return (
        <nav className="flex items-center text-sm font-medium">
            <Link
                to="/admin"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>

            {breadcrumbPaths.length > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
            )}

            {breadcrumbPaths.map((path, index) => {
                const url = `/admin/${breadcrumbPaths.slice(0, index + 1).join('/')}`;
                const isLast = index === breadcrumbPaths.length - 1;
                const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

                return (
                    <Fragment key={url}>
                        {isLast ? (
                            <span className="text-foreground font-semibold">
                                {label}
                            </span>
                        ) : (
                            <>
                                <Link
                                    to={url}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {label}
                                </Link>
                                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                            </>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
