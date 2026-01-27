export const defaultSelectorStyles = `
/* Base Layout */
body { font-family: 'Outfit', system-ui, sans-serif; background: #f8fafc; color: #334155; }
h1, h2, h3, h4 { color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif; letter-spacing: -0.02em; }

/* Components */
.card, .profile-card, .welcome-card, .login-wrapper, article {
  background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin-bottom: 1.5rem;
}

/* Forms */
form { display: flex; flex-direction: column; gap: 1rem; }
input, select { 
  padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%;
  font-size: 0.9rem; transition: border-color 0.2s;
}
input:focus { outline: none; border-color: #3b82f6; ring: 2px solid rgba(59,130,246,0.1); }
label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: #475569; }

/* Buttons */
button, .btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 500; font-size: 0.9rem;
  cursor: pointer; transition: all 0.2s; border: 1px solid #cbd5e1;            
  background-color: #f1f5f9; color: #334155;
}
button:hover, .btn:hover { background-color: #e2e8f0; border-color: #94a3b8; }
button.primary, .btn.primary, button[type="submit"] {
  background-color: #0f172a; color: white; border-color: #0f172a;
}
button.primary:hover, .btn.primary:hover, button[type="submit"]:hover {
  background-color: #1e293b; border-color: #1e293b;
}

/* Nav */
nav { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem; margin: -16px -16px 1.5rem -16px; }
nav ul { display: flex; gap: 1.5rem; list-style: none; margin: 0; padding: 0; }
nav a { text-decoration: none; color: #64748b; font-weight: 500; }
nav a:hover { color: #0f172a; }

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
  color: #991b1b;
  border-color: #fecaca;
}
.msg.success {
  background-color: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

/* Utils */
.error, .error-text { color: #ef4444; font-size: 0.875rem; }
.success { color: #22c55e; }
.badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #e2e8f0; color: #475569; }
.badge.active { background: #dcfce7; color: #166534; }
.badge.suspended { background: #fee2e2; color: #991b1b; }
`;

export const e2eSelectorStyles = `
/* E2E Challenges Tailwind Subset - Dark Theme */
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
  --radius: 0.5rem;
}

* { border-color: hsl(var(--border)); box-sizing: border-box; }

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
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
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: hsl(var(--input));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  color: hsl(var(--foreground));
  outline: none;
  transition: all 0.2s;
}
.input:focus { border-color: hsl(var(--ring)); box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2); }

.button {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.75rem 1.5rem; font-weight: 600; border-radius: var(--radius);
  cursor: pointer; border: none; transition: all 0.2s;
}
.button:hover { opacity: 0.9; transform: translateY(-1px); }
.button:active { transform: translateY(0); }
.button-primary { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
.button-ghost { background-color: transparent; color: hsl(var(--foreground)); }
.button-ghost:hover { background-color: hsl(var(--accent)); }

.error-text { color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; display: none; }
.toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 1rem 1.5rem;
  border-radius: var(--radius); background-color: #1f2937; color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2); display: none; z-index: 50;
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
