import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { HistoryProvider } from './context/HistoryContext'
import { MainLayout } from './components/MainLayout'
import Home from './pages/Home'
import Features from './pages/Features'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Account from './pages/Account'
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/features" element={<Features />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/account" element={<Account />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
