import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { mock } from 'bun:test';

GlobalRegistrator.register();

// Prevent real HTTP calls from HappyDOM's fetch polyfill (e.g. from <script>fetch('/api/data')</script> in iframe HTML)
// Without this, HappyDOM throws `NetworkError: ECONNREFUSED` which causes bun to exit with code 1
// even when the test that caused the fetch is skipped or already completed.
globalThis.fetch = Object.assign((input: RequestInfo | URL) => {
    const url = typeof input === 'string'
        ? input
        : input instanceof URL
            ? input.href
            : input.url;
    return Promise.resolve(new Response(JSON.stringify({ mocked: true, url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    }));
}, { preconnect: globalThis.fetch.preconnect });

process.env.DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";
process.env.TEST_DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";
process.env.BETTER_AUTH_SECRET = "dummy_secret_for_tests_1234567890";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID = "dummy_google_id";
process.env.GOOGLE_CLIENT_SECRET = "dummy_google_secret";

import * as React from 'react';

interface MotionOnlyProps {
    layout?: unknown;
    layoutId?: unknown;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
    variants?: unknown;
}

const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'> & MotionOnlyProps
>(function MotionDiv({ layout, layoutId, initial, animate, exit, transition, variants, ...props }, ref) {
    void layout;
    void layoutId;
    void initial;
    void animate;
    void exit;
    void transition;
    void variants;
    return React.createElement('div', { ...props, ref });
});

const MotionTr = React.forwardRef<
    HTMLTableRowElement,
    React.ComponentPropsWithoutRef<'tr'> & MotionOnlyProps
>(function MotionTr({ layout, layoutId, initial, animate, exit, transition, variants, ...props }, ref) {
    void layout;
    void layoutId;
    void initial;
    void animate;
    void exit;
    void transition;
    void variants;
    return React.createElement('tr', { ...props, ref });
});

const MotionSpan = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<'span'> & MotionOnlyProps
>(function MotionSpan({ layout, layoutId, initial, animate, exit, transition, variants, ...props }, ref) {
    void layout;
    void layoutId;
    void initial;
    void animate;
    void exit;
    void transition;
    void variants;
    return React.createElement('span', { ...props, ref });
});

const MotionPath = React.forwardRef<
    SVGPathElement,
    React.ComponentPropsWithoutRef<'path'> & MotionOnlyProps
>(function MotionPath({ layout, layoutId, initial, animate, exit, transition, variants, ...props }, ref) {
    void layout;
    void layoutId;
    void initial;
    void animate;
    void exit;
    void transition;
    void variants;
    return React.createElement('path', { ...props, ref });
});

void mock.module(
'framer-motion', () => ({
    motion: {
        div: MotionDiv,
        tr: MotionTr,
        span: MotionSpan,
        path: MotionPath,
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

globalThis.mockSearchParams = {};
globalThis.mockNavigate = mock(() => Promise.resolve());

void mock.module(
'@tanstack/react-router', () => ({
    Link: ({
        children,
        params,
        to,
        className,
        ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { params?: unknown; to?: string }) => {
        return React.createElement('a', { href: to || 'mock-link', className, 'data-params': JSON.stringify(params), ...props }, children);
    },
    useRouter: () => ({}),
    useMatch: () => ({}),
    useParams: () => ({ locale: 'en' }),
    RouterProvider: () => null,
    isRedirect: () => false,
    redirect: () => { },
    Outlet: () => null,
    createFileRoute: () => () => ({
        useParams: () => ({ locale: 'en' }),
        useSearch: () => globalThis.mockSearchParams,
        useNavigate: () => globalThis.mockNavigate,
    }),
    getRouteApi: () => ({
        useParams: () => ({ locale: 'en' }),
        useSearch: () => globalThis.mockSearchParams,
        useNavigate: () => globalThis.mockNavigate,
    }),
}));

void mock.module(
'@tanstack/react-query', () => {
    globalThis.mockUseQuery = mock(() => undefined);
    return {
        useQuery: globalThis.mockUseQuery,
        useMutation: () => ({
            mutate: mock(),
            isPending: false,
        }),
        keepPreviousData: mock(),
        queryOptions: <T,>(options: T): T => options,
        useQueryClient: () => ({
            setQueryData: mock(),
            invalidateQueries: mock()
        }),
    };
});

void mock.module(
'react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: () => new Promise(() => {}) }
    }),
    initReactI18next: {
        type: '3rdParty',
        init: () => { },
    },
}));

void mock.module(
'next-themes', () => ({
    useTheme: () => ({ theme: 'dark', setTheme: () => {} }),
    ThemeProvider: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

void mock.module(
'@/lib/storage-adapter', () => ({
    storage: {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
        clear: () => Promise.resolve()
    }
}));

void mock.module(
'@/components/ui/dialog', () => {
    return {
        Dialog: ({ open, children }: React.PropsWithChildren<{ open?: boolean }>) => open ? React.createElement('div', { 'data-testid': 'dialog-root' }, children) : null,
        DialogContent: ({ children }: React.PropsWithChildren) => React.createElement('div', { 'data-testid': 'dialog-content' }, children),
        DialogHeader: ({ children }: React.PropsWithChildren) => React.createElement('div', { 'data-testid': 'dialog-header' }, children),
        DialogFooter: ({ children }: React.PropsWithChildren) => React.createElement('div', { 'data-testid': 'dialog-footer' }, children),
        DialogTitle: ({ children }: React.PropsWithChildren) => React.createElement('h2', { 'data-testid': 'dialog-title' }, children),
        DialogDescription: ({ children }: React.PropsWithChildren) => React.createElement('div', { 'data-testid': 'dialog-description' }, children),
    };
});

void mock.module(
"@/components/ui/dropdown-menu", () => {
    return {
        DropdownMenu: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
        DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
        DropdownMenuContent: ({ children }: React.PropsWithChildren) => React.createElement('div', { 'data-testid': 'dropdown-content' }, children),
        DropdownMenuItem: ({ children, onClick, className }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => React.createElement('div', { onClick, className, 'data-testid': 'dropdown-item' }, children),
        DropdownMenuLabel: ({ children }: React.PropsWithChildren) => React.createElement('div', null, children),
        DropdownMenuSeparator: () => React.createElement('hr'),
    };
});

void mock.module(
'@monaco-editor/react', () => {
    return {
        default: ({
            defaultValue,
            value,
            onChange,
        }: {
            defaultValue?: string;
            value?: string;
            onChange?: (value: string) => void;
        }) => {
            return React.createElement('textarea', {
                'data-testid': 'monaco-editor',
                defaultValue: value || defaultValue,
                onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value)
            });
        },
        loader: { 
            init: () => Promise.resolve(),
            config: () => {}
        }
    };
});
