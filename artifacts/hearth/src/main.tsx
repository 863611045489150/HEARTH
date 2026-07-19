import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Wire Supabase session token into every API request.
// The auth callback stores it under "hearth_token"; we read it fresh on each
// request so token refreshes are picked up automatically.
setAuthTokenGetter(() => localStorage.getItem('hearth_token'));

createRoot(document.getElementById('root')!).render(<App />);
