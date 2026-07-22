import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx' 
import { AlertProvider } from './contexts/AlertContext.jsx' // 👈 Importamos o nosso novo Contexto
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> 
      <AlertProvider> {/* 👈 Abraçamos a aplicação com o provedor de alertas */}
        <RouterProvider router={router} />
      </AlertProvider>
    </AuthProvider>
  </StrictMode>,
)