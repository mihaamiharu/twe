import { Github, Twitter, Zap, Bug } from 'lucide-react';
import { BugReportDialog } from '@/components/BugReportDialog';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@tanstack/react-router';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

interface FooterLink {
    label: string;
    href: string;
    isExternal?: boolean;
}

const getFooterLinks = (locale: string) => ({
    product: [
        { label: 'navigation.tutorials', href: `/${locale}/tutorials` },
        { label: 'navigation.challenges', href: `/${locale}/challenges` },
        { label: 'navigation.leaderboard', href: `/${locale}/leaderboard` },
    ] as FooterLink[],
    resources: [
        { label: 'legal:privacy.title', href: `/${locale}/privacy` },
        { label: 'legal:terms.title', href: `/${locale}/terms` },
    ] as FooterLink[],
});

export function Footer() {
    const { t } = useTranslation(['common', 'legal']);
    const params = useParams({ strict: false }) as { locale?: string };
    const locale = params.locale || 'en';
    const footerLinks = getFooterLinks(locale);

    return (
        <footer className="border-t border-border/40 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-12 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
                    {/* Brand Section - Takes 2 columns on medium+ screens */}
                    <div className="md:col-span-2 space-y-6">
                        <Link to={LocaleRoutes.home} params={localeParams(locale)} className="flex items-center gap-2">
                            <Zap className="h-6 w-6 text-primary fill-primary/20" />
                            <span className="text-xl font-bold tracking-tight">
                                TestingWithEkki
                            </span>
                        </Link>
                        <p className="text-sm leading-6 text-muted-foreground max-w-sm">
                            {t('footer.description')}
                        </p>
                        <div className="flex gap-5">
                            <a
                                href="https://github.com/mihaamiharu/twe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="md:pt-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">{t('footer.product')}</h3>
                        <ul className="mt-6 space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.href as any}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {t(link.label)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div className="md:pt-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">{t('footer.resources')}</h3>
                        <ul className="mt-6 space-y-4">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.href as any}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {t(link.label)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} TestingWithEkki. All rights reserved.
                    </p>
                    <div className="flex items-center">
                        <BugReportDialog
                            trigger={
                                <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1">
                                    <Bug className="h-3.5 w-3.5" />
                                    {t('footer.reportBug')}
                                </button>
                            }
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
