import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useAuth } from '../../context/AuthContext'
import { apiDeleteUser, apiListUsers, apiRegister, apiUpdateUserRole, type ApiUser, type ApiUserRole } from '../../lib/api'
import { Users, UserPlus, Trash2, CheckCircle, Lock } from 'lucide-react'

interface ManagedAccount {
  id: number
  email: string
  name: string
  role: ApiUserRole
  isActive: boolean
}

const ACCESS_TOKEN_KEY = 'murrs_access_token'

function mapApiUser(user: ApiUser): ManagedAccount {
  return {
    id: user.id,
    email: user.email,
    name: user.full_name || user.email.split('@')[0],
    role: user.role || (user.is_admin ? 'librarian' : 'member'),
    isActive: user.is_active,
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
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newDepartment, setNewDepartment] = useState('')
  const [newRole, setNewRole] = useState<ApiUserRole>('member')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

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

  const resetCreateForm = () => {
    setNewEmail('')
    setNewName('')
    setNewDepartment('')
    setNewPassword('')
    setConfirmPassword('')
    setNewRole('member')
    setCreateError('')
  }

  const handleCreateAccount = async () => {
    setCreateError('')

    if (!newEmail || !newName || !newPassword) {
      setCreateError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setCreateError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setCreateError('Password must be at least 6 characters')
      return
    }

    if (!newEmail.includes('@')) {
      setCreateError('Please enter a valid email')
      return
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) {
      setCreateError('Missing session token. Please sign in again.')
      return
    }

    setCreating(true)
    try {
      const created = await apiRegister(newEmail.trim(), newPassword, newName.trim(), newDepartment.trim() || undefined)
      const finalUser = newRole !== 'member'
        ? await apiUpdateUserRole(created.id, newRole, accessToken)
        : created
      setAccounts((prev) => [mapApiUser(finalUser), ...prev])
      resetCreateForm()
      setDialogOpen(false)
    } catch (err) {
      setCreateError(extractErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

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

  if (user?.role !== 'librarian') {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm text-muted-foreground">Only librarians can manage user accounts</p>
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
            Account Management
          </h2>
          <p className="text-muted-foreground mt-1">Create and manage student, lecturer, staff, and librarian accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 gap-2">
            <UserPlus className="h-4 w-4" />
            Create Account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {createError && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {createError}
                </div>
              )}

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@university.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g. Computer Science"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Account Type</Label>
                <Select value={newRole} onValueChange={(val) => setNewRole(val as ApiUserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member (Student)</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleCreateAccount} className="w-full" disabled={creating}>
                <UserPlus className="h-4 w-4 mr-2" />
                {creating ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">{loadingError}</CardContent>
        </Card>
      )}

      {/* Accounts List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">Loading accounts...</CardContent>
          </Card>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No accounts created yet
            </CardContent>
          </Card>
        ) : (
          accounts.map(account => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{account.name}</h3>
                      <Badge variant={account.role === 'member' ? 'outline' : 'secondary'}>
                        {account.role === 'member' ? 'Student' : account.role === 'lecturer' ? 'Lecturer' : account.role === 'staff' ? 'Staff' : 'Librarian'}
                      </Badge>
                      <Badge variant="outline" className={account.isActive ? 'text-green-700 bg-green-50 dark:bg-green-900/20' : ''}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{account.email}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>ID {account.id}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleDeleteAccount(account.id)}
                    disabled={deletingId === account.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
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
            <CardDescription>Members</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter(a => a.role === 'member').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lecturers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter(a => a.role === 'lecturer').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Staff</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter(a => a.role === 'staff').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Librarians</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter(a => a.role === 'librarian').length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
