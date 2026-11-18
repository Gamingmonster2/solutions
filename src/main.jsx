import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { SettingsProvider } from '@/hooks/useSettings'
import { AuthProvider } from '@/hooks/useAuth'
import { AIProvider } from '@/hooks/useAI'
import '@/styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>,
)
