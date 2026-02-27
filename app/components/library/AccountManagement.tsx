import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useAuth } from '../../context/AuthContext'
import {
  apiAdminCreateUser,
  apiActivateUser,
  apiAddDepartmentSupervisors,
  apiAssignUserRole,
  apiAssignDepartmentDean,
  apiAssignDepartmentHod,
  apiDeleteUser,
  apiListDepartments,
  apiListDepartmentSupervisors,
  apiListUsers,
  apiRemoveUserRole,
  apiRemoveDepartmentSupervisor,
  apiUpdateUserRole,
  type ApiDepartment,
  type ApiDepartmentSupervisor,
  type ApiUser,
  type ApiUserRole,
} from '../../lib/api'
import { Users, Trash2, CheckCircle, Lock } from 'lucide-react'

interface ManagedAccount {
  id: number
  email: string
  schoolId: string
  school: string
  name: string
  department: string
  role: ApiUserRole
  roles: ApiUserRole[]
  isActive: boolean
  createdAt: string
}

const ACCESS_TOKEN_KEY = 'murrs_access_token'
const DEFAULT_SCHOOL_OPTIONS = [
  'Business School',
  'School of Public Service and Governance',
  'Faculty of Law',
  'School of Technology and Social Sciences (SOTSS)',
]

function mapApiUser(user: ApiUser): ManagedAccount {
  const normalizedRoles = (user.roles && user.roles.length > 0 ? user.roles : [user.role]).filter(Boolean) as ApiUserRole[]
  return {
    id: user.id,
    email: user.email,
    schoolId: user.school_id || '-',
    school: user.school || '-',
    name: user.full_name || user.email.split('@')[0],
    department: user.department || '-',
    role: user.role || (user.is_admin ? 'librarian' : 'student'),
    roles: normalizedRoles,
    isActive: user.is_active,
    createdAt: user.created_at || '-',
  }
}

function roleChipLabel(role: ApiUserRole): string {
  if (role === 'project_supervisor') return 'Project Supervisor'
  if (role === 'project_coordinator') return 'Project Coordinator'
  if (role === 'system_admin') return 'System Admin'
  if (role === 'head_library') return 'Head Library'
  if (role === 'hod') return 'HOD'
  return role.charAt(0).toUpperCase() + role.slice(1)
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

function normalizeText(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function AccountManagement() {
  const { user } = useAuth()
  const hasRole = (role: ApiUserRole) => !!user && (user.role === role || (user.roles || []).includes(role))
  const canManageAccounts = hasRole('system_admin')
  const canAssignDean = hasRole('system_admin')
  const canAssignHod = hasRole('dean')
  const canAssignCoordinators = hasRole('hod')
  const canAssignSupervisors = hasRole('project_coordinator')
  const canManageAssignments = canAssignDean || canAssignHod || canAssignCoordinators || canAssignSupervisors
  const canManage = canManageAccounts || canManageAssignments
  const [accounts, setAccounts] = useState<ManagedAccount[]>([])
  const [candidateUsers, setCandidateUsers] = useState<ApiUser[]>([])
  const [departments, setDepartments] = useState<ApiDepartment[]>([])
  const [departmentSupervisors, setDepartmentSupervisors] = useState<ApiDepartmentSupervisor[]>([])
  const [selectedSchoolKey, setSelectedSchoolKey] = useState<string>('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [selectedDeanUserId, setSelectedDeanUserId] = useState<string>('')
  const [selectedHodUserId, setSelectedHodUserId] = useState<string>('')
  const [selectedCoordinatorUserId, setSelectedCoordinatorUserId] = useState<string>('')
  const [selectedSupervisorUserId, setSelectedSupervisorUserId] = useState<string>('')
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<ManagedAccount | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    role: 'student' as ApiUserRole,
    school_id: '',
    school: '',
    department: '',
  })

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

  const loadAssignmentData = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) {
      setLoadingError('Missing session token. Please sign in again.')
      return
    }

    try {
      const [deptItems, users] = await Promise.all([
        apiListDepartments(accessToken),
        apiListUsers(accessToken, { limit: 200, is_active: true }),
      ])
      setDepartments(deptItems)
      setCandidateUsers(users)

      if (!selectedDepartmentId && deptItems.length > 0) {
        setSelectedDepartmentId(String(deptItems[0].id))
      }
    } catch (err) {
      setLoadingError(extractErrorMessage(err))
    }
  }

  const loadDepartmentSupervisors = async (departmentId: number) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) return
    try {
      const rows = await apiListDepartmentSupervisors(departmentId, accessToken)
      setDepartmentSupervisors(rows.filter((r) => r.active))
    } catch (err) {
      setAssignmentMessage(extractErrorMessage(err))
    }
  }

  useEffect(() => {
    if (canManageAccounts) {
      void loadAccounts()
    } else {
      setLoading(false)
    }
    if (canManageAssignments) {
      void loadAssignmentData()
    }
  }, [canManageAccounts, canManageAssignments])

  useEffect(() => {
    const deptId = Number(selectedDepartmentId)
    if (canManageAssignments && Number.isFinite(deptId) && deptId > 0) {
      void loadDepartmentSupervisors(deptId)
    } else {
      setDepartmentSupervisors([])
    }
  }, [selectedDepartmentId, canManageAssignments])

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

  const resetCreateForm = () => {
    setCreateForm({
      full_name: '',
      email: '',
      role: 'student',
      school_id: '',
      school: '',
      department: '',
    })
  }

  const handleCreateAccount = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) {
      setCreateMessage('Missing session token. Please sign in again.')
      return
    }
    if (!createForm.email.trim()) {
      setCreateMessage('Email is required.')
      return
    }
    if (!createForm.full_name.trim()) {
      setCreateMessage('Full name is required.')
      return
    }

    const needsSchoolAndId = createForm.role === 'student' || createForm.role === 'member'
    const needsDepartment = ['lecturer', 'staff', 'project_coordinator', 'hod'].includes(createForm.role)
    if (needsSchoolAndId && (!createForm.school.trim() || !createForm.school_id.trim())) {
      setCreateMessage('School and School ID are required for students.')
      return
    }
    if (needsDepartment && (!createForm.school.trim() || !createForm.department.trim())) {
      setCreateMessage('School and Department are required for this role.')
      return
    }

    setCreateBusy(true)
    setCreateMessage('')
    try {
      const payload = {
        email: createForm.email.trim(),
        role: createForm.role,
        full_name: createForm.full_name.trim(),
        school_id: createForm.school_id.trim() || undefined,
        school: createForm.school.trim() || undefined,
        department: createForm.department.trim() || undefined,
      }
      const result = await apiAdminCreateUser(payload, accessToken)
      setCreateMessage(
        result.email_sent
          ? `Account created for ${result.user.email}. Login details were sent by email.`
          : `Account created for ${result.user.email}, but email delivery failed. Check SMTP settings.`,
      )
      await loadAccounts()
      resetCreateForm()
    } catch (err) {
      setCreateMessage(extractErrorMessage(err))
    } finally {
      setCreateBusy(false)
    }
  }

  const refreshDepartment = async (departmentId: number) => {
    await loadAssignmentData()
    await loadDepartmentSupervisors(departmentId)
  }

  const handleAssignDeanBySchool = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const userId = Number(selectedDeanUserId)
    if (!accessToken || !selectedSchoolKey || !userId) {
      setAssignmentMessage('Select school and dean to continue.')
      return
    }
    const selectedSchoolNormalized = selectedSchoolKey.trim().toLowerCase()
    const schoolDepartments = departments.filter((d) => {
      const idMatch = String(d.institution_id) === selectedSchoolKey
      const nameMatch = (d.institution_name || '').trim().toLowerCase() === selectedSchoolNormalized
      return idMatch || nameMatch
    })
    setSavingAssignment(true)
    setAssignmentMessage('')
    try {
      if (schoolDepartments.length > 0) {
        for (const dept of schoolDepartments) {
          await apiAssignDepartmentDean(dept.id, userId, accessToken)
        }
      }
      await apiUpdateUserRole(userId, 'dean', accessToken)
      await loadAssignmentData()
      setAssignmentMessage(
        schoolDepartments.length > 0
          ? 'Dean assigned to selected school successfully.'
          : 'Dean role assigned. No departments are mapped to that school yet.',
      )
      setSelectedDeanUserId('')
    } catch (err) {
      setAssignmentMessage(extractErrorMessage(err))
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleAssignHod = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const departmentId = Number(selectedDepartmentId)
    const userId = Number(selectedHodUserId)
    if (!accessToken || !departmentId || !userId) {
      setAssignmentMessage('Select department and HOD to continue.')
      return
    }
    setSavingAssignment(true)
    setAssignmentMessage('')
    try {
      await apiAssignDepartmentHod(departmentId, userId, accessToken)
      await refreshDepartment(departmentId)
      setAssignmentMessage('HOD assigned successfully.')
      setSelectedHodUserId('')
    } catch (err) {
      setAssignmentMessage(extractErrorMessage(err))
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleAddSupervisor = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const departmentId = Number(selectedDepartmentId)
    const userId = Number(selectedSupervisorUserId)
    if (!accessToken || !departmentId || !userId) {
      setAssignmentMessage('Select department and supervisor to continue.')
      return
    }
    setSavingAssignment(true)
    setAssignmentMessage('')
    try {
      await apiAddDepartmentSupervisors(departmentId, [userId], accessToken)
      await loadDepartmentSupervisors(departmentId)
      setAssignmentMessage('Project supervisor appointed successfully.')
      setSelectedSupervisorUserId('')
    } catch (err) {
      setAssignmentMessage(extractErrorMessage(err))
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleAddCoordinator = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const userId = Number(selectedCoordinatorUserId)
    if (!accessToken || !userId) {
      setAssignmentMessage('Select project coordinator to continue.')
      return
    }
    setSavingAssignment(true)
    setAssignmentMessage('')
    try {
      await apiAssignUserRole(userId, 'project_coordinator', accessToken)
      await loadAssignmentData()
      setAssignmentMessage('Project coordinator appointed successfully.')
      setSelectedCoordinatorUserId('')
    } catch (err) {
      setAssignmentMessage(extractErrorMessage(err))
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleRemoveCoordinator = async (userId: number) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!accessToken) return
    setSavingAssignment(true)
    setAssignmentMessage('')
    try {
      await apiRemoveUserRole(userId, 'project_coordinator', accessToken)
      await loadAssignmentData()
      setAssignmentMessage('Project coordinator removed.')
    } catch (err) {
      setAssignmentMessage(extractErrorMessage(err))
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleRemoveSupervisor = async (supervisorUserId: number) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const departmentId = Number(selectedDepartmentId)
    if (!accessToken || !departmentId) return
    setSavingAssignment(true)
    setAssignmentMessage('')
    try {
      await apiRemoveDepartmentSupervisor(departmentId, supervisorUserId, accessToken)
      await loadDepartmentSupervisors(departmentId)
      setAssignmentMessage('Project supervisor removed.')
    } catch (err) {
      setAssignmentMessage(extractErrorMessage(err))
    } finally {
      setSavingAssignment(false)
    }
  }

  const displayNameByUserId = (userId: number | null | undefined): string => {
    if (!userId) return '-'
    const found = candidateUsers.find((u) => u.id === userId)
    if (!found) return `User #${userId}`
    return `${found.full_name || found.email} (${found.email})`
  }

  const actorDepartment = normalizeText(user?.department)
  const actorSchool = normalizeText(user?.school)
  const deanVisibleSchools = new Set(
    candidateUsers
      .map((u) => normalizeText(u.school))
      .filter((s) => !!s),
  )
  const deanMappedDepartments = departments.filter((d) => d.dean_user_id === user?.id)
  const visibleDepartments = departments.filter((d) => {
    if (hasRole('system_admin')) {
      if (!selectedSchoolKey) return true
      const selectedSchoolNormalized = selectedSchoolKey.trim().toLowerCase()
      const idMatch = String(d.institution_id) === selectedSchoolKey
      const nameMatch = (d.institution_name || '').trim().toLowerCase() === selectedSchoolNormalized
      return idMatch || nameMatch
    }
    if (hasRole('dean')) {
      const mapped = d.dean_user_id === user?.id
      const schoolName = normalizeText(d.institution_name)
      const sameSchool = !!actorSchool && schoolName === actorSchool
      const inDeanVisibleSchool = schoolName ? deanVisibleSchools.has(schoolName) : false
      const fallbackWhenUnmapped = deanMappedDepartments.length === 0
      return mapped || sameSchool || inDeanVisibleSchool || fallbackWhenUnmapped
    }
    if (hasRole('hod') || hasRole('project_coordinator')) {
      const sameDepartment = normalizeText(d.name) === actorDepartment
      const mapped = d.hod_user_id === user?.id
      return sameDepartment || mapped
    }
    return true
  })
  const selectedDepartment = visibleDepartments.find((d) => String(d.id) === selectedDepartmentId) || null

  const schoolOptions = Array.from(
    new Map(
      departments.map((d) => [
        String(d.institution_id),
        d.institution_name || `School #${d.institution_id}`,
      ]),
    ).entries(),
  ).map(([id, label]) => ({ id, label }))
  const effectiveSchoolOptions = schoolOptions.length > 0
    ? schoolOptions
    : DEFAULT_SCHOOL_OPTIONS.map((label) => ({ id: label, label }))
  const selectedSchoolOption = effectiveSchoolOptions.find((s) => s.id === selectedSchoolKey) || null
  const selectedSchoolName = normalizeText(selectedSchoolOption?.label || selectedSchoolKey)
  const matchesSelectedSchool = (school: string | null | undefined): boolean => {
    if (!hasRole('system_admin')) return true
    if (!selectedSchoolKey) return true
    return normalizeText(school) === selectedSchoolName
  }
  const deanCandidates = candidateUsers.filter((u) => {
    const roles = [u.role, ...(u.roles || [])]
    const lecturerOnly = roles.includes('lecturer')
    return lecturerOnly && matchesSelectedSchool(u.school)
  })
  const schoolDeanSummary = Array.from(
    new Map(
      departments.map((d) => [String(d.institution_id), d.institution_name || `School #${d.institution_id}`]),
    ).entries(),
  ).map(([institutionId, schoolName]) => {
    const schoolDepartments = departments.filter((d) => String(d.institution_id) === institutionId)
    const deanIds = Array.from(new Set(schoolDepartments.map((d) => d.dean_user_id).filter((v): v is number => typeof v === 'number')))
    const deanLabel =
      deanIds.length === 0
        ? 'Not assigned'
        : deanIds.length === 1
          ? displayNameByUserId(deanIds[0])
          : 'Multiple assignments'
    return { institutionId, schoolName, deanLabel }
  })
  const userHasRole = (u: ApiUser, role: ApiUserRole) =>
    (u.role === role) || ((u.roles || []).includes(role))
  const targetDepartmentName = (normalizeText(selectedDepartment?.name) || actorDepartment)
  const hodCandidates = candidateUsers.filter((u) => {
    const lecturerOnly = userHasRole(u, 'lecturer')
    if (!lecturerOnly) return false

    const sameDepartment = normalizeText(u.department) === targetDepartmentName

    if (hasRole('dean')) {
      // Dean assigns HOD from lecturers in the selected department.
      return sameDepartment
    }
    return sameDepartment
  })
  const supervisorCandidates = candidateUsers.filter((u) => {
    const lecturerOnly = userHasRole(u, 'lecturer')
    const notAlreadyAssigned = !departmentSupervisors.some((s) => s.supervisor_user_id === u.id)

    if (!lecturerOnly || !notAlreadyAssigned) return false
    if (hasRole('project_coordinator')) {
      // Project Coordinator appoints supervisors from lecturers in selected department.
      return normalizeText(u.department) === targetDepartmentName
    }
    return normalizeText(u.department) === targetDepartmentName
  })

  const coordinatorCandidates = candidateUsers.filter((u) => {
    const lecturerOnly = userHasRole(u, 'lecturer')
    const sameDepartment = normalizeText(u.department) === targetDepartmentName
    const alreadyCoordinator = userHasRole(u, 'project_coordinator')
    return lecturerOnly && sameDepartment && !alreadyCoordinator
  })

  const currentDepartmentCoordinators = candidateUsers.filter((u) => {
    const sameDepartment = normalizeText(u.department) === targetDepartmentName
    return sameDepartment && userHasRole(u, 'project_coordinator')
  })

  useEffect(() => {
    if (!hasRole('system_admin')) return
    if (selectedSchoolKey) return
    if (schoolOptions.length > 0) {
      setSelectedSchoolKey(schoolOptions[0].id)
      return
    }
    if (DEFAULT_SCHOOL_OPTIONS.length > 0) {
      setSelectedSchoolKey(DEFAULT_SCHOOL_OPTIONS[0])
    }
  }, [departments.length, selectedSchoolKey])

  useEffect(() => {
    if (visibleDepartments.length === 0) {
      if (selectedDepartmentId) setSelectedDepartmentId('')
      return
    }
    const isCurrentVisible = visibleDepartments.some((d) => String(d.id) === selectedDepartmentId)
    if (!isCurrentVisible) {
      setSelectedDepartmentId(String(visibleDepartments[0].id))
    }
  }, [visibleDepartments, selectedDepartmentId])

  if (!canManage) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm text-muted-foreground">Only system admins, deans, HODs, and project coordinators can access this area</p>
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
            Administration
          </h2>
          <p className="text-muted-foreground mt-1">Manage accounts and department role assignment workflow.</p>
        </div>
      </div>

      {canManageAssignments && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Department Role Assignment</h3>
            <CardDescription>Admin assigns Dean, Dean assigns HOD, HOD appoints Project Coordinator(s), and Project Coordinator(s) appoint project supervisors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {loadingError}
              </div>
            )}
            {canAssignDean && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Assign Dean</p>
                <Select value={selectedSchoolKey} onValueChange={setSelectedSchoolKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveSchoolOptions.map((school) => (
                      <SelectItem key={school.id} value={school.id}>{school.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDeanUserId} onValueChange={setSelectedDeanUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dean user (lecturers only)" />
                  </SelectTrigger>
                  <SelectContent>
                    {deanCandidates.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.full_name || u.email} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => void handleAssignDeanBySchool()} disabled={savingAssignment}>Assign Dean</Button>
              </div>
            )}
            {visibleDepartments.length > 0 && (
              <div className="space-y-4">
                <div>
                  {!hasRole('system_admin') && (
                    <>
                      <p className="text-sm font-medium mb-2">Department</p>
                      <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {visibleDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>

                {selectedDepartment && (
                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <p><span className="font-medium">Current Dean:</span> {displayNameByUserId(selectedDepartment.dean_user_id)}</p>
                    <p><span className="font-medium">Current HOD:</span> {displayNameByUserId(selectedDepartment.hod_user_id)}</p>
                  </div>
                )}

                {canAssignHod && selectedDepartment && (
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-sm font-medium">Assign HOD</p>
                    <Select value={selectedHodUserId} onValueChange={setSelectedHodUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select HOD user" />
                      </SelectTrigger>
                      <SelectContent>
                        {hodCandidates.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.full_name || u.email} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => void handleAssignHod()} disabled={savingAssignment}>Assign HOD</Button>
                  </div>
                )}

                {canAssignSupervisors && selectedDepartment && (
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-sm font-medium">Appoint Project Supervisors</p>
                    <Select value={selectedSupervisorUserId} onValueChange={setSelectedSupervisorUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supervisor user" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisorCandidates.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.full_name || u.email} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => void handleAddSupervisor()} disabled={savingAssignment}>Add Supervisor</Button>

                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium">Current Supervisors</p>
                      {departmentSupervisors.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No supervisors assigned yet.</p>
                      ) : (
                        departmentSupervisors.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                            <span>{displayNameByUserId(item.supervisor_user_id)}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleRemoveSupervisor(item.supervisor_user_id)}
                              disabled={savingAssignment}
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {canAssignCoordinators && selectedDepartment && (
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-sm font-medium">Appoint Project Coordinators</p>
                    <Select value={selectedCoordinatorUserId} onValueChange={setSelectedCoordinatorUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project coordinator user" />
                      </SelectTrigger>
                      <SelectContent>
                        {coordinatorCandidates.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.full_name || u.email} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => void handleAddCoordinator()} disabled={savingAssignment}>Add Project Coordinator</Button>

                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium">Current Project Coordinators</p>
                      {currentDepartmentCoordinators.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No project coordinators assigned yet.</p>
                      ) : (
                        currentDepartmentCoordinators.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                            <span>{item.full_name || item.email} ({item.email})</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleRemoveCoordinator(item.id)}
                              disabled={savingAssignment}
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {visibleDepartments.length === 0 && !canAssignDean && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                No departments are configured yet. Department role assignment needs departments to be created/imported first.
              </div>
            )}
            {assignmentMessage && <p className="text-sm">{assignmentMessage}</p>}
            {schoolDeanSummary.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Current Deans by School</p>
                {schoolDeanSummary.map((row) => (
                  <div key={row.institutionId} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>{row.schoolName}</span>
                    <span className="text-muted-foreground">{row.deanLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canManageAccounts && (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Create Account</h3>
          <CardDescription>Create one account and send default password to the user by email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => { setCreateDialogOpen(true); setCreateMessage('') }}>
            Create Account
          </Button>
          {createMessage && <p className="text-sm text-muted-foreground">{createMessage}</p>}
        </CardContent>
      </Card>
      )}

      {canManageAccounts && (
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
                      {account.roles
                        .filter((r) => ['dean', 'hod', 'project_supervisor'].includes(r) && r !== account.role)
                        .map((extraRole) => (
                          <Badge key={`${account.id}-${extraRole}`} variant="outline">
                            {roleChipLabel(extraRole)}
                          </Badge>
                        ))}
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
      )}

      {canManageAccounts && (
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
      )}

      <Dialog open={!!selectedAccount} onOpenChange={(open) => { if (!open) setSelectedAccount(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-3 text-sm">
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

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) {
            resetCreateForm()
            setCreateMessage('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="create-full-name">Full Name</Label>
              <Input
                id="create-full-name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="e.g. Ama Mensah"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="name@gimpa.edu.gh"
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, role: value as ApiUserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="project_supervisor">Project Supervisor</SelectItem>
                  <SelectItem value="project_coordinator">Project Coordinator</SelectItem>
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="dean">Dean</SelectItem>
                  <SelectItem value="librarian">Librarian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-school">School</Label>
              <Input
                id="create-school"
                value={createForm.school}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, school: e.target.value }))}
                placeholder="e.g. Business School"
              />
            </div>
            {(createForm.role === 'student' || createForm.role === 'member') && (
              <div className="space-y-1">
                <Label htmlFor="create-school-id">School ID</Label>
                <Input
                  id="create-school-id"
                  value={createForm.school_id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, school_id: e.target.value }))}
                  placeholder="Student ID"
                />
              </div>
            )}
            {['lecturer', 'staff', 'project_coordinator', 'hod'].includes(createForm.role) && (
              <div className="space-y-1">
                <Label htmlFor="create-department">Department</Label>
                <Input
                  id="create-department"
                  value={createForm.department}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, department: e.target.value }))}
                  placeholder="Department"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreateAccount()} disabled={createBusy}>
                {createBusy ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
            {createMessage && <p className="text-xs text-muted-foreground">{createMessage}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
