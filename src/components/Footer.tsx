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
    { label: 'navigation.about', href: `/${locale}/about` },
  ] as FooterLink[],
});

export function Footer() {
  const { t } = useTranslation(['common', 'legal']);
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const footerLinks = getFooterLinks(locale);

  return (
    <footer className="border-t border-border/40 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Section - Takes 2 columns on medium+ screens */}
          <div className="md:col-span-2 space-y-6">
            <Link
              to={LocaleRoutes.home}
              params={localeParams(locale)}
              className="flex items-center gap-2 group w-fit"
            >
              {/* Dark Mode Logo */}
              <img
                src="/logo-dark-new.png"
                alt="Logo"
                className="h-8 w-8 rounded-lg hidden dark:block mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity"
              />
              {/* Light Mode Logo */}
              <img
                src="/logo-light-new.png"
                alt="Logo"
                className="h-8 w-8 rounded-lg block dark:hidden mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:to-primary transition-all">
                TestingWithEkki
              </span>
            </Link>
            <p className="text-sm leading-6 text-muted-foreground max-w-sm">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/mihaamiharu/twe"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">
              {t('footer.product')}
            </h3>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href as any}
                    className="text-sm text-foreground/80 hover:text-primary hover:translate-x-1 transition-all inline-block"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="md:pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">
              {t('footer.resources')}
            </h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href as any}
                    className="text-sm text-foreground/80 hover:text-primary hover:translate-x-1 transition-all inline-block"
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
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} TestingWithEkki. All rights reserved.
          </p>
          <div className="flex items-center">
            <BugReportDialog
              trigger={
                <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70 hover:text-destructive transition-colors px-3 py-1.5 rounded-md hover:bg-destructive/5">
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
