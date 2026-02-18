const DEFAULT_API_URL = "http://127.0.0.1:8000"

const baseUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL || DEFAULT_API_URL
const apiBase = `${baseUrl.replace(/\/$/, "")}/api`

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export type ApiUserRole = "student" | "member" | "lecturer" | "staff" | "project_coordinator" | "hod" | "librarian"

export interface ApiUser {
  id: number
  email: string
  school_id: string | null
  school: string | null
  full_name: string | null
  department: string | null
  is_active: boolean
  is_admin: boolean
  role: ApiUserRole
  created_at: string | null
}

export interface ApiListUsersParams {
  skip?: number
  limit?: number
  email?: string
  is_active?: boolean
  is_admin?: boolean
  role?: ApiUserRole
}

export interface ApiAuthor {
  id: number
  name: string
  email: string | null
  affiliation: string | null
  author_order: number
}

export interface ApiPaper {
  id: number
  title: string
  abstract: string | null
  status: "draft" | "pending" | "pending_lecturer" | "pending_coordinator" | "pending_hod" | "pending_hod_and_coordinator" | "approved_for_library" | "approved" | "revision" | "rejected"
  discipline: string | null
  university: string | null
  year: number
  document_type: string | null
  license: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  views: number
  downloads: number
  citations: number
  rating: number | null
  review_comments: string | null
  supervisor_id: number | null
  created_at: string | null
  authors: ApiAuthor[]
  tags: string[]
}

export interface ApiCreatePaperPayload {
  title: string
  abstract?: string
  discipline?: string
  university?: string
  year?: number
  document_type?: string
  license?: string
  file_name?: string
  supervisor_id?: number
  tags?: string[]
  authors?: Array<{ name: string; email?: string; affiliation?: string }>
}

export interface ApiUploadPaperPayload extends ApiCreatePaperPayload {
  file: File
}

export interface ApiPaperStats {
  total_papers: number
  total_views: number
  total_downloads: number
  pending_reviews: number
}

export interface ApiNotification {
  id: number
  user_id: number
  paper_id: number | null
  type: string
  message: string
  is_read: boolean
  created_at: string | null
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    let message = text || response.statusText
    if (text) {
      try {
        const parsed = JSON.parse(text) as { detail?: string }
        if (parsed?.detail) {
          message = parsed.detail
        }
      } catch {}
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams()
  body.set("username", email)
  body.set("password", password)
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  return handleResponse<TokenResponse>(response)
}

export async function apiRegister(
  email: string,
  password: string,
  fullName: string,
  role: ApiUserRole,
  schoolId?: string,
  school?: string,
  department?: string,
): Promise<ApiUser> {
  const response = await fetch(`${apiBase}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role, full_name: fullName, school_id: schoolId, school, department }),
  })
  return handleResponse<ApiUser>(response)
}

export async function apiRefresh(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${apiBase}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  return handleResponse<TokenResponse>(response)
}

export async function apiLogout(refreshToken: string): Promise<void> {
  await fetch(`${apiBase}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export async function apiMe(accessToken: string): Promise<ApiUser> {
  const response = await fetch(`${apiBase}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiUser>(response)
}

export async function apiUpdateUser(
  userId: number,
  payload: { full_name?: string; school_id?: string; school?: string; department?: string; password?: string },
  accessToken: string,
): Promise<ApiUser> {
  const response = await fetch(`${apiBase}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<ApiUser>(response)
}

export async function apiListUsers(accessToken: string, params: ApiListUsersParams = {}): Promise<ApiUser[]> {
  const query = new URLSearchParams()
  if (typeof params.skip === "number") query.set("skip", String(params.skip))
  if (typeof params.limit === "number") query.set("limit", String(params.limit))
  if (params.email) query.set("email", params.email)
  if (typeof params.is_active === "boolean") query.set("is_active", String(params.is_active))
  if (typeof params.is_admin === "boolean") query.set("is_admin", String(params.is_admin))
  if (params.role) query.set("role", params.role)

  const response = await fetch(`${apiBase}/users${query.toString() ? `?${query.toString()}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiUser[]>(response)
}

export async function apiDeleteUser(userId: number, accessToken: string): Promise<void> {
  const response = await fetch(`${apiBase}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
}

export async function apiUpdateUserRole(userId: number, role: ApiUserRole, accessToken: string): Promise<ApiUser> {
  const response = await fetch(`${apiBase}/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role }),
  })
  return handleResponse<ApiUser>(response)
}

export async function apiActivateUser(userId: number, accessToken: string): Promise<ApiUser> {
  const response = await fetch(`${apiBase}/users/${userId}/activate`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return handleResponse<ApiUser>(response)
}

export async function apiListPapers(params: {
  q?: string
  discipline?: string
  university?: string
  year?: number
  status?: string
  sort?: string
  skip?: number
  limit?: number
  catalog?: boolean
} = {}): Promise<ApiPaper[]> {
  const query = new URLSearchParams()
  if (params.q) query.set("q", params.q)
  if (params.discipline) query.set("discipline", params.discipline)
  if (params.university) query.set("university", params.university)
  if (typeof params.year === "number") query.set("year", String(params.year))
  if (params.status) query.set("status", params.status)
  if (params.sort) query.set("sort", params.sort)
  if (typeof params.skip === "number") query.set("skip", String(params.skip))
  if (typeof params.limit === "number") query.set("limit", String(params.limit))
  if (typeof params.catalog === "boolean") query.set("catalog", String(params.catalog))

  const response = await fetch(`${apiBase}/papers${query.toString() ? `?${query.toString()}` : ""}`)
  return handleResponse<ApiPaper[]>(response)
}

export async function apiGetPaper(paperId: number): Promise<ApiPaper> {
  const response = await fetch(`${apiBase}/papers/${paperId}`)
  return handleResponse<ApiPaper>(response)
}

export async function apiCreatePaper(payload: ApiCreatePaperPayload, accessToken: string): Promise<ApiPaper> {
  const response = await fetch(`${apiBase}/papers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<ApiPaper>(response)
}

export async function apiUploadPaper(payload: ApiUploadPaperPayload, accessToken: string): Promise<ApiPaper> {
  const form = new FormData()
  form.set("title", payload.title)
  if (payload.abstract) form.set("abstract", payload.abstract)
  if (payload.discipline) form.set("discipline", payload.discipline)
  if (payload.university) form.set("university", payload.university)
  if (typeof payload.year === "number") form.set("year", String(payload.year))
  if (payload.document_type) form.set("document_type", payload.document_type)
  if (payload.license) form.set("license", payload.license)
  if (typeof payload.supervisor_id === "number") form.set("supervisor_id", String(payload.supervisor_id))
  form.set("tags", JSON.stringify(payload.tags || []))
  form.set("authors", JSON.stringify(payload.authors || []))
  form.set("file", payload.file)

  const response = await fetch(`${apiBase}/papers/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  return handleResponse<ApiPaper>(response)
}

export async function apiGetPendingPapers(accessToken: string): Promise<ApiPaper[]> {
  const response = await fetch(`${apiBase}/papers/pending`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiPaper[]>(response)
}

export async function apiGetReviewedPapers(accessToken: string): Promise<ApiPaper[]> {
  const response = await fetch(`${apiBase}/papers/reviewed`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiPaper[]>(response)
}

export async function apiReviewPaper(
  paperId: number,
  decision: "approve" | "revision" | "reject",
  comments: string,
  accessToken: string,
): Promise<ApiPaper> {
  const response = await fetch(`${apiBase}/papers/${paperId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ decision, comments }),
  })
  return handleResponse<ApiPaper>(response)
}

export async function apiTrackPaperView(paperId: number): Promise<ApiPaper> {
  const response = await fetch(`${apiBase}/papers/${paperId}/view`, {
    method: "POST",
  })
  return handleResponse<ApiPaper>(response)
}

export async function apiTrackPaperDownload(paperId: number, accessToken: string): Promise<ApiPaper> {
  const response = await fetch(`${apiBase}/papers/${paperId}/download`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiPaper>(response)
}

export async function apiDownloadPaperFile(
  paperId: number,
  accessToken: string,
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${apiBase}/papers/${paperId}/file`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
  const disposition = response.headers.get("Content-Disposition") || ""
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i)
  const filename = match?.[1] || `paper-${paperId}`
  const blob = await response.blob()
  return { blob, filename }
}

export async function apiGetPaperStats(): Promise<ApiPaperStats> {
  const response = await fetch(`${apiBase}/papers/stats`)
  return handleResponse<ApiPaperStats>(response)
}

export async function apiGetMyPapers(accessToken: string): Promise<ApiPaper[]> {
  const response = await fetch(`${apiBase}/papers/mine`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiPaper[]>(response)
}

export async function apiListSupervisors(accessToken: string): Promise<ApiUser[]> {
  const response = await fetch(`${apiBase}/supervisors`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiUser[]>(response)
}

export async function apiGetNotifications(accessToken: string): Promise<ApiNotification[]> {
  const response = await fetch(`${apiBase}/notifications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiNotification[]>(response)
}

export async function apiMarkNotificationRead(notificationId: number, accessToken: string): Promise<ApiNotification> {
  const response = await fetch(`${apiBase}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<ApiNotification>(response)
}
