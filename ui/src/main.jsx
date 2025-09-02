import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
)
