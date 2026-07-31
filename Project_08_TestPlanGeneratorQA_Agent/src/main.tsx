import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PasswordGate from './components/PasswordGate';
import { StoreProvider } from './store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PasswordGate>
            <StoreProvider>
                <App />
            </StoreProvider>
        </PasswordGate>
    </StrictMode>
);
