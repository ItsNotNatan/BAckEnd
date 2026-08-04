import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx' 
import { AlertProvider } from './contexts/AlertContext.jsx' 
import ErrorBoundary from './ErrorBoundary.jsx' // 👈 Importamos a nossa armadilha de erros
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 👈 Abraçamos TUDO com a Armadilha de Erros */}
    <ErrorBoundary> 
      <AuthProvider> 
        <AlertProvider> 
          <RouterProvider router={router} />
        </AlertProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)