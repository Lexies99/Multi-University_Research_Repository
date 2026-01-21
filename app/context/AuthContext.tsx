import React, { createContext, useContext, useState } from 'react'

export type UserRole = 'guest' | 'member' | 'staff' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  university?: string
  department?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: UserRole) => boolean
  logout: () => void
  createAccount: (email: string, password: string, name: string, role: 'member' | 'staff') => boolean
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Test accounts for development
const TEST_ACCOUNTS = {
  member: [
    { email: 'john.smith@student.edu', password: 'password123', name: 'John Smith', university: 'MIT', department: 'Computer Science' },
    { email: 'sarah.jones@student.edu', password: 'password123', name: 'Sarah Jones', university: 'Harvard', department: 'Physics' },
  ],
  staff: [
    { email: 'ama.owusu@university.edu', password: 'password123', name: 'Ama Owusu', university: 'Stanford', department: 'Library Services' },
    { email: 'michael.brown@university.edu', password: 'password123', name: 'Michael Brown', university: 'Oxford', department: 'Research Administration' },
  ],
  admin: [
    { email: 'admin@murrs.edu', password: 'admin123', name: 'Admin User', university: 'MURRS Central', department: 'System Administration' },
  ],
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = (email: string, password: string, role: UserRole): boolean => {
    if (!email || !password) return false

    // Check test accounts
    const accounts = TEST_ACCOUNTS[role as keyof typeof TEST_ACCOUNTS] || []
    const account = accounts.find(acc => acc.email === email && acc.password === password)

    if (account) {
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: account.email,
        name: account.name,
        role,
        university: account.university,
        department: account.department,
      }
      setUser(newUser)
      localStorage.setItem('murrs_user', JSON.stringify(newUser))
      return true
    }

    // Fallback mock authentication for any email/password
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
      role,
      university: 'MURRS University',
      department: role === 'member' ? 'Computer Science' : 'Administration',
    }

    setUser(newUser)
    localStorage.setItem('murrs_user', JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('murrs_user')
  }

  const createAccount = (email: string, password: string, name: string, role: 'member' | 'staff'): boolean => {
    if (!email || !password || !name || user?.role !== 'admin') return false

    // In a real app, this would save to database
    return true
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, createAccount, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
