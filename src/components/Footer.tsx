import { Link } from '@tanstack/react-router';
import { Github, Twitter, Zap } from 'lucide-react';

interface FooterLink {
    label: string;
    href: string;
    isExternal?: boolean;
}

const footerLinks = {
    product: [
        { label: 'Tutorials', href: '/tutorials' },
        { label: 'Challenges', href: '/challenges' },
        { label: 'Leaderboard', href: '/leaderboard' },
    ] as FooterLink[],
    resources: [
        { label: 'API Docs', href: '/docs/api' },
    ] as FooterLink[],
    legal: [
        { label: 'Terms', href: '#', isExternal: true },
        { label: 'Privacy', href: '#', isExternal: true },
        { label: 'Cookies', href: '#', isExternal: true },
    ] as FooterLink[],
};

export function Footer() {
    return (
        <footer className="border-t border-border bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <Zap className="h-6 w-6 text-primary" />
                            <span className="text-lg font-bold gradient-text">
                                TestingWithEkki
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            Learn testing skills through interactive tutorials and coding
                            challenges.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://github.com/mihaamiharu/twe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href as '/tutorials' | '/challenges' | '/leaderboard'}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.href as '/docs/api'}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} TestingWithEkki. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">
                            Terms
                        </a>
                        <a href="#" className="hover:text-foreground transition-colors">
                            Privacy
                        </a>
                        <a href="#" className="hover:text-foreground transition-colors">
                            Cookies
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
