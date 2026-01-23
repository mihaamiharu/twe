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
