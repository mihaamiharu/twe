export const defaultSelectorStyles = `
/* Base Layout */
body { font-family: 'Instrument Sans', system-ui, sans-serif; background: #FBF9F4; color: #1D1D1B; }
h1, h2, h3, h4 { color: #1D1D1B; margin-top: 0; font-family: 'Instrument Sans', sans-serif; letter-spacing: -0.02em; }

/* Components */
.card, .profile-card, .welcome-card, .login-wrapper, article {
  background: #FBF9F4; border: 1px solid #D9D3C8; border-radius: 8px; padding: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Forms */
form { display: flex; flex-direction: column; gap: 1rem; }
input, select { 
  padding: 0.625rem; border: 1px solid #D9D3C8; border-radius: 8px; width: 100%;
  font-size: 0.9rem; transition: border-color 0.2s;
}
input:focus { outline: none; border-color: #E65F3A; box-shadow: 0 0 0 2px rgba(230,95,58,0.14); }
label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: #68645E; }

/* Buttons */
button, .btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 500; font-size: 0.9rem;
  cursor: pointer; transition: background-color 0.15s, border-color 0.15s; border: 1px solid #D9D3C8;
  background-color: #F4F0E8; color: #1D1D1B;
}
button:hover, .btn:hover { background-color: #F7DED4; border-color: #E65F3A; }
button.primary, .btn.primary, button[type="submit"] {
  background-color: #E65F3A; color: #FBF9F4; border-color: #E65F3A;
}
button.primary:hover, .btn.primary:hover, button[type="submit"]:hover {
  background-color: #C74D2F; border-color: #C74D2F;
}

/* Nav */
nav { background: #FBF9F4; border-bottom: 1px solid #D9D3C8; padding: 1rem; margin: -16px -16px 1.5rem -16px; }
nav ul { display: flex; gap: 1.5rem; list-style: none; margin: 0; padding: 0; }
nav a { text-decoration: none; color: #68645E; font-weight: 500; }
nav a:hover { color: #E65F3A; }

/* Message Banners */
.msg {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  font-weight: 500;
}
.msg.error {
  background-color: #fef2f2;
  color: #C74B42;
  border-color: #C74B42;
}
.msg.success {
  background-color: rgba(35,133,109,0.1);
  color: #23856D;
  border-color: #23856D;
}

/* Utils */
.error, .error-text { color: #C74B42; font-size: 0.875rem; }
.success { color: #23856D; }
.badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #F4F0E8; color: #68645E; }
.badge.active { background: rgba(35,133,109,0.1); color: #23856D; }
.badge.suspended { background: rgba(199,75,66,0.1); color: #C74B42; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
  }

  .toast {
    animation: none !important;
  }
}
`;

export const e2eSelectorStyles = `
/* E2E challenge target environment - intentionally dark technical UI */
:root {
  --background: #171918;
  --foreground: #F2F1EC;
  --card: #202321;
  --card-foreground: #F2F1EC;
  --popover: #292C29;
  --popover-foreground: #F2F1EC;
  --primary: #E65F3A;
  --primary-foreground: #F2F1EC;
  --secondary: #292C29;
  --secondary-foreground: #F2F1EC;
  --muted: #202321;
  --muted-foreground: #A5A69F;
  --accent: #292C29;
  --accent-foreground: #F2F1EC;
  --destructive: #C74B42;
  --destructive-foreground: #F2F1EC;
  --border: #393C38;
  --input: #393C38;
  --ring: #E65F3A;
  --radius: 8px;
}

* { border-color: var(--border); box-sizing: border-box; }

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Instrument Sans', system-ui, sans-serif;
  margin: 0;
  padding: 0;
}

/* Layout */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.grid { display: grid; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }
.min-h-screen { min-height: 100vh; }

/* Colors & Typography */
.text-white { color: white; }
.text-gray-400 { color: #9ca3af; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }

/* Components */
.card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.glass {
  background: var(--elevated, #292C29);
  border: 1px solid var(--border);
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--foreground);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus { border-color: var(--ring); box-shadow: 0 0 0 2px rgba(230,95,58,0.2); }

.button {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.75rem 1.5rem; font-weight: 600; border-radius: var(--radius);
  cursor: pointer; border: none; transition: background-color 0.15s, opacity 0.15s;
}
.button:hover { opacity: 0.9; }
.button-primary { background-color: var(--primary); color: var(--primary-foreground); }
.button-ghost { background-color: transparent; color: var(--foreground); }
.button-ghost:hover { background-color: var(--accent); }

.error-text { color: #C74B42; font-size: 0.875rem; margin-top: 0.5rem; display: none; }
.toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 1rem 1.5rem;
  border-radius: var(--radius); background-color: var(--elevated, #292C29); color: white;
  display: none; z-index: 50;
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
  }

  .toast {
    animation: none !important;
  }
}
`;
