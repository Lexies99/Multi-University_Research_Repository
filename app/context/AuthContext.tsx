import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserRole = 'guest' | 'member' | 'staff' | 'librarian'

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
  createAccount: (email: string, password: string, name: string, role: 'member' | 'staff' | 'librarian') => boolean
  setUser: (user: User | null) => void
  changePassword: (oldPassword: string, newPassword: string) => boolean
  updateProfile: (name: string, department?: string) => boolean
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
  librarian: [
    { email: 'librarian@murrs.edu', password: 'librarian123', name: 'Librarian User', university: 'MURRS Central', department: 'Library Administration' },
  ],
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('murrs_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {}
  }, []);

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
      department: role === 'member' ? 'Computer Science' : 'Library Administration',
    }

    setUser(newUser)
    localStorage.setItem('murrs_user', JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('murrs_user')
  }

  const createAccount = (email: string, password: string, name: string, role: 'member' | 'staff' | 'librarian'): boolean => {
    if (!email || !password || !name || user?.role !== 'librarian') return false

    // In a real app, this would save to database
    return true
  }

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    if (!user || !oldPassword || !newPassword) return false
    if (oldPassword === newPassword) return false
    // Mock: assume success. In a real app, call API and update stored credentials.
    return true
  }

  const updateProfile = (name: string, department?: string): boolean => {
    if (!user || !name) return false

    const updatedUser: User = {
      ...user,
      name,
      department: department || user.department,
    }

    setUser(updatedUser)
    localStorage.setItem('murrs_user', JSON.stringify(updatedUser))
    return true
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, createAccount, setUser, changePassword, updateProfile }}>
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
