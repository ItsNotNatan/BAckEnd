import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx' // <-- Adicione isto
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* <-- Abrace o RouterProvider */}
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)