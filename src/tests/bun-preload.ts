import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { mock } from 'bun:test';

GlobalRegistrator.register();
process.env.DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";
process.env.TEST_DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";

import * as React from 'react';

mock.module('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, className, ...props }: any, ref) => {
            const domProps = { ...props, ref };
            ['layout', 'layoutId', 'initial', 'animate', 'exit', 'transition', 'variants'].forEach(k => delete domProps[k]);
            return React.createElement('div', { className, ...domProps }, children);
        }),
        tr: React.forwardRef(({ children, className, ...props }: any, ref) => {
            const domProps = { ...props, ref };
            ['layout', 'layoutId', 'initial', 'animate', 'exit', 'transition', 'variants'].forEach(k => delete domProps[k]);
            return React.createElement('tr', { className, ...domProps }, children);
        }),
        span: React.forwardRef(({ children, className, ...props }: any, ref) => {
            const domProps = { ...props, ref };
            ['layout', 'layoutId', 'initial', 'animate', 'exit', 'transition', 'variants'].forEach(k => delete domProps[k]);
            return React.createElement('span', { className, ...domProps }, children);
        }),
        path: React.forwardRef(({ children, className, ...props }: any, ref) => {
            const domProps = { ...props, ref };
            ['layout', 'layoutId', 'initial', 'animate', 'exit', 'transition', 'variants'].forEach(k => delete domProps[k]);
            return React.createElement('path', { className, ...domProps }, children);
        }),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

globalThis.mockSearchParams = {};
globalThis.mockNavigate = mock(() => Promise.resolve());

mock.module('@tanstack/react-router', () => ({
    Link: ({ children, params, search, to, activeProps, partiallyActive, className, ...props }: any) => {
        return React.createElement('a', { href: to || 'mock-link', className, 'data-params': JSON.stringify(params), ...props }, children);
    },
    useRouter: () => ({}),
    useMatch: () => ({}),
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

mock.module('@tanstack/react-query', () => {
    const { mock } = require('bun:test');
    return {
        useQuery: mock(),
        useMutation: () => ({
            mutate: mock(),
            isPending: false,
        }),
        keepPreviousData: mock(),
        queryOptions: (opts: any) => opts,
        useQueryClient: () => ({
            setQueryData: mock(),
            invalidateQueries: mock()
        }),
    };
});

mock.module('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: () => new Promise(() => {}) }
    }),
    initReactI18next: {
        type: '3rdParty',
        init: () => { },
    },
}));

mock.module('next-themes', () => ({
    useTheme: () => ({ theme: 'dark', setTheme: () => {} }),
    ThemeProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

mock.module('@/lib/storage-adapter', () => ({
    storage: {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
        clear: () => Promise.resolve()
    }
}));

mock.module("@/components/ui/dropdown-menu", () => {
    const React = require('react');
    return {
        DropdownMenu: ({ children }: any) => React.createElement(React.Fragment, null, children),
        DropdownMenuTrigger: ({ children }: any) => React.createElement(React.Fragment, null, children),
        DropdownMenuContent: ({ children }: any) => React.createElement('div', { 'data-testid': 'dropdown-content' }, children),
        DropdownMenuItem: ({ children, onClick, className }: any) => React.createElement('div', { onClick, className, 'data-testid': 'dropdown-item' }, children),
        DropdownMenuLabel: ({ children }: any) => React.createElement('div', null, children),
        DropdownMenuSeparator: () => React.createElement('hr'),
    };
});

mock.module('@monaco-editor/react', () => {
    const React = require('react');
    return {
        default: ({ defaultValue, value, onChange }: any) => {
            return React.createElement('textarea', {
                'data-testid': 'monaco-editor',
                defaultValue: value || defaultValue,
                onChange: (e: any) => onChange?.(e.target.value)
            });
        },
        loader: { 
            init: () => Promise.resolve(),
            config: () => {}
        }
    };
});

