import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { useAuth } from '../../context/AuthContext'
import { apiActivateUser, apiDeleteUser, apiListUsers, type ApiUser, type ApiUserRole } from '../../lib/api'
import { Users, Trash2, CheckCircle, Lock } from 'lucide-react'

interface ManagedAccount {
  id: number
  email: string
  schoolId: string
  school: string
  name: string
  department: string
  role: ApiUserRole
  isActive: boolean
  createdAt: string
}

const ACCESS_TOKEN_KEY = 'murrs_access_token'

function mapApiUser(user: ApiUser): ManagedAccount {
  return {
    id: user.id,
    email: user.email,
    schoolId: user.school_id || '-',
    school: user.school || '-',
    name: user.full_name || user.email.split('@')[0],
    department: user.department || '-',
    role: user.role || (user.is_admin ? 'librarian' : 'student'),
    isActive: user.is_active,
    createdAt: user.created_at || '-',
  }
}

function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Request failed'
  try {
    const parsed = JSON.parse(err.message) as { detail?: string }
    return parsed.detail || err.message
  } catch {
    return err.message
  }
}

export function AccountManagement() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<ManagedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<ManagedAccount | null>(null)

  const loadAccounts = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) {
      setLoadingError('Missing session token. Please sign in again.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadingError('')
    try {
      const users = await apiListUsers(accessToken, { limit: 200 })
      setAccounts(users.map(mapApiUser))
    } catch (err) {
      setLoadingError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'librarian') {
      void loadAccounts()
    }
  }, [user?.role])

  const handleDeleteAccount = async (id: number) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) {
      setLoadingError('Missing session token. Please sign in again.')
      return
    }
    setDeletingId(id)
    try {
      await apiDeleteUser(id, accessToken)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setLoadingError(extractErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const handleActivateAccount = async (id: number) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) {
      setLoadingError('Missing session token. Please sign in again.')
      return
    }
    setActivatingId(id)
    try {
      const updated = await apiActivateUser(id, accessToken)
      setAccounts((prev) => prev.map((a) => (a.id === id ? mapApiUser(updated) : a)))
    } catch (err) {
      setLoadingError(extractErrorMessage(err))
    } finally {
      setActivatingId(null)
    }
  }

  if (user?.role !== 'librarian') {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm text-muted-foreground">Only librarians can activate user accounts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Account Activation
          </h2>
          <p className="text-muted-foreground mt-1">Students create their own accounts. Librarians only activate pending accounts.</p>
        </div>
      </div>

      {loadingError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">{loadingError}</CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">Loading accounts...</CardContent>
          </Card>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">No accounts found</CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card
              key={account.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedAccount(account)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{account.name}</h3>
                      <Badge variant={account.role === 'student' || account.role === 'member' ? 'outline' : 'secondary'}>
                        {account.role === 'student' || account.role === 'member' ? 'Student' : account.role}
                      </Badge>
                      <Badge variant="outline" className={account.isActive ? 'text-green-700 bg-green-50 dark:bg-green-900/20' : ''}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {account.isActive ? 'Active' : 'Pending activation'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">School ID: {account.schoolId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedAccount(account) }}>
                      View
                    </Button>
                    {!account.isActive && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); void handleActivateAccount(account.id) }}
                        disabled={activatingId === account.id}
                      >
                        {activatingId === account.id ? 'Activating...' : 'Activate'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); void handleDeleteAccount(account.id) }}
                      disabled={deletingId === account.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Activation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter((a) => !a.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter((a) => a.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedAccount} onOpenChange={(open) => { if (!open) setSelectedAccount(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {selectedAccount.name}</p>
              <p><span className="font-medium">Email:</span> {selectedAccount.email}</p>
              <p><span className="font-medium">Role:</span> {selectedAccount.role}</p>
              <p><span className="font-medium">School:</span> {selectedAccount.school}</p>
              <p><span className="font-medium">Department / Academic Area:</span> {selectedAccount.department}</p>
              <p><span className="font-medium">School ID:</span> {selectedAccount.schoolId}</p>
              <p><span className="font-medium">Status:</span> {selectedAccount.isActive ? 'Active' : 'Pending activation'}</p>
              <p><span className="font-medium">Created:</span> {selectedAccount.createdAt === '-' ? '-' : new Date(selectedAccount.createdAt).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
