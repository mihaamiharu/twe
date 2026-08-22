import type { editor } from 'monaco-editor';

// Custom dark theme matching the locked neutral challenge workspace palette.
export const CUSTOM_DARK_THEME: editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: 'A5A69F', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'E6A28B' },
        { token: 'string', foreground: '9CC7AE' },
        { token: 'number', foreground: 'D9B56E' },
        { token: 'function', foreground: 'F2C0AE' },
        { token: 'variable', foreground: 'F2F1EC' },
        { token: 'type', foreground: 'C7D0C7' },
    ],
    colors: {
        'editor.background': '#171918',
        'editor.foreground': '#F2F1EC',
        'editor.lineHighlightBackground': '#202321',
        'editor.selectionBackground': '#393C38',
        'editorCursor.foreground': '#E65F3A',
        'editor.inactiveSelectionBackground': '#292C29',
        'editorLineNumber.foreground': '#68645E',
        'editorLineNumber.activeForeground': '#A5A69F',
        'editorIndentGuide.background1': '#292C29',
        'editorGutter.background': '#171918',
        'scrollbarSlider.background': '#393C3880',
        'scrollbarSlider.hoverBackground': '#68645E80',
    },
};

// Warm light theme retained for internal editor consumers.
export const CUSTOM_LIGHT_THEME: editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '68645E', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'A94D31' },
        { token: 'string', foreground: '1F745F' },
        { token: 'number', foreground: '8B651C' },
        { token: 'function', foreground: '9B4A31' },
        { token: 'variable', foreground: '1D1D1B' },
        { token: 'type', foreground: '4A554D' },
    ],
    colors: {
        'editor.background': '#FBF9F4',
        'editor.foreground': '#1D1D1B',
        'editor.lineHighlightBackground': '#F4F0E8',
        'editor.selectionBackground': '#F7DED4',
        'editorCursor.foreground': '#E65F3A',
        'editor.inactiveSelectionBackground': '#F4F0E8',
        'editorLineNumber.foreground': '#A6A097',
        'editorLineNumber.activeForeground': '#68645E',
        'editorIndentGuide.background1': '#D9D3C8',
        'editorGutter.background': '#FBF9F4',
        'scrollbarSlider.background': '#D9D3C8',
        'scrollbarSlider.hoverBackground': '#A6A097',
    },
};
