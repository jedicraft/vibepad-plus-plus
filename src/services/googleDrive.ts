import type { WorkspaceExport, GoogleDriveFile } from '@/types'

// Google API configuration
// Replace these with your own credentials from Google Cloud Console
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

const WORKSPACE_FILENAME = 'vibepad-workspace.json'
const WORKSPACE_FOLDER = 'Vibepad'

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let gapiInitialized = false
let gisInitialized = false

interface GoogleDriveUser {
  name: string
  email: string
  picture?: string
}

export async function initializeGoogleDrive(): Promise<boolean> {
  if (!CLIENT_ID || !API_KEY) {
    console.warn('Google Drive API credentials not configured')
    return false
  }

  try {
    await loadGapiScript()
    await loadGisScript()
    return true
  } catch (error) {
    console.error('Failed to initialize Google Drive:', error)
    return false
  }
}

function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiInitialized) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = async () => {
      try {
        await new Promise<void>((res) => gapi.load('client', res))
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        })
        gapiInitialized = true
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gisInitialized) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {},
      })
      gisInitialized = true
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function signIn(): Promise<GoogleDriveUser> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Identity Services not initialized'))
      return
    }

    tokenClient.callback = async (response) => {
      if (response.error) {
        reject(new Error(response.error))
        return
      }

      try {
        const user = await getUserInfo()
        resolve(user)
      } catch (err) {
        reject(err)
      }
    }

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      tokenClient.requestAccessToken({ prompt: '' })
    }
  })
}

export function signOut(): void {
  const token = gapi.client.getToken()
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {})
    gapi.client.setToken(null)
  }
}

export function isSignedIn(): boolean {
  return gapi.client?.getToken() !== null
}

async function getUserInfo(): Promise<GoogleDriveUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${gapi.client.getToken().access_token}`,
    },
  })
  const data = await response.json()
  return {
    name: data.name,
    email: data.email,
    picture: data.picture,
  }
}

async function getOrCreateFolder(): Promise<string> {
  // Check if folder exists
  const response = await gapi.client.drive.files.list({
    q: `name='${WORKSPACE_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  const folders = response.result.files
  if (folders && folders.length > 0) {
    return folders[0].id!
  }

  // Create folder
  const createResponse = await gapi.client.drive.files.create({
    resource: {
      name: WORKSPACE_FOLDER,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  return createResponse.result.id!
}

async function findWorkspaceFile(folderId: string): Promise<string | null> {
  const response = await gapi.client.drive.files.list({
    q: `name='${WORKSPACE_FILENAME}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    spaces: 'drive',
  })

  const files = response.result.files
  if (files && files.length > 0) {
    return files[0].id!
  }
  return null
}

export async function saveToGoogleDrive(workspace: WorkspaceExport): Promise<void> {
  const folderId = await getOrCreateFolder()
  const existingFileId = await findWorkspaceFile(folderId)

  const content = JSON.stringify(workspace, null, 2)
  const blob = new Blob([content], { type: 'application/json' })

  const metadata = {
    name: WORKSPACE_FILENAME,
    mimeType: 'application/json',
    parents: existingFileId ? undefined : [folderId],
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)

  const token = gapi.client.getToken().access_token
  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

  const response = await fetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  if (!response.ok) {
    throw new Error(`Failed to save to Google Drive: ${response.statusText}`)
  }
}

export async function loadFromGoogleDrive(): Promise<WorkspaceExport | null> {
  const folderId = await getOrCreateFolder()
  const fileId = await findWorkspaceFile(folderId)

  if (!fileId) {
    return null
  }

  const response = await gapi.client.drive.files.get({
    fileId,
    alt: 'media',
  })

  return response.result as unknown as WorkspaceExport
}

export async function listGoogleDriveFiles(): Promise<GoogleDriveFile[]> {
  const folderId = await getOrCreateFolder()

  const response = await gapi.client.drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, modifiedTime)',
    spaces: 'drive',
  })

  return (response.result.files || []) as GoogleDriveFile[]
}

export class GoogleDriveSyncManager {
  private intervalId: number | null = null
  private syncCallback: (() => Promise<void>) | null = null

  start(callback: () => Promise<void>, interval: number): void {
    this.syncCallback = callback
    this.stop()
    this.intervalId = window.setInterval(() => {
      this.syncCallback?.()
    }, interval)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async syncNow(): Promise<void> {
    await this.syncCallback?.()
  }
}

export const googleDriveSyncManager = new GoogleDriveSyncManager()

// Type declarations for Google APIs
declare global {
  interface Window {
    gapi: typeof gapi
    google: typeof google
  }

  namespace google.accounts.oauth2 {
    interface TokenClient {
      callback: (response: { error?: string; access_token?: string }) => void
      requestAccessToken: (options: { prompt: string }) => void
    }

    function initTokenClient(config: {
      client_id: string
      scope: string
      callback: () => void
    }): TokenClient

    function revoke(token: string, callback: () => void): void
  }

  namespace gapi {
    function load(api: string, callback: () => void): void

    namespace client {
      function init(config: {
        apiKey: string
        discoveryDocs: string[]
      }): Promise<void>

      function getToken(): { access_token: string } | null
      function setToken(token: null): void

      namespace drive.files {
        function list(params: {
          q: string
          fields: string
          spaces: string
        }): Promise<{
          result: {
            files?: Array<{ id?: string; name?: string; modifiedTime?: string }>
          }
        }>

        function create(params: {
          resource: { name: string; mimeType: string }
          fields: string
        }): Promise<{ result: { id?: string } }>

        function get(params: {
          fileId: string
          alt: string
        }): Promise<{ result: unknown }>
      }
    }
  }
}
