import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-card border border-border text-foreground shadow-lg rounded-xl text-sm font-medium',
          title: 'font-semibold',
          description: 'text-muted-foreground',
          success: '!border-l-4 !border-l-green-500',
          error: '!border-l-4 !border-l-destructive',
          warning: '!border-l-4 !border-l-yellow-500',
          info: '!border-l-4 !border-l-primary',
        },
      }}
    />
  </StrictMode>,
)
