import { openDB, type IDBPDatabase } from 'idb'
import type { FileNode, Tab, EditorSettings, SplitConfig, WorkspaceExport } from '@/types'

const DB_NAME = 'vibepad-db'
const DB_VERSION = 1

interface VibepadDB {
  files: {
    key: string
    value: FileNode[]
  }
  tabs: {
    key: string
    value: Tab[]
  }
  settings: {
    key: string
    value: EditorSettings
  }
  splitConfig: {
    key: string
    value: SplitConfig
  }
}

let dbInstance: IDBPDatabase<VibepadDB> | null = null

async function getDB(): Promise<IDBPDatabase<VibepadDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<VibepadDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files')
      }
      if (!db.objectStoreNames.contains('tabs')) {
        db.createObjectStore('tabs')
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings')
      }
      if (!db.objectStoreNames.contains('splitConfig')) {
        db.createObjectStore('splitConfig')
      }
    },
  })

  return dbInstance
}

export async function saveFiles(files: FileNode[]): Promise<void> {
  const db = await getDB()
  await db.put('files', files, 'workspace')
}

export async function loadFiles(): Promise<FileNode[]> {
  const db = await getDB()
  const files = await db.get('files', 'workspace')
  return files || []
}

export async function saveTabs(tabs: Tab[]): Promise<void> {
  const db = await getDB()
  await db.put('tabs', tabs, 'workspace')
}

export async function loadTabs(): Promise<Tab[]> {
  const db = await getDB()
  const tabs = await db.get('tabs', 'workspace')
  return tabs || []
}

export async function saveSettings(settings: EditorSettings): Promise<void> {
  const db = await getDB()
  await db.put('settings', settings, 'user')
}

export async function loadSettings(): Promise<EditorSettings | null> {
  const db = await getDB()
  const settings = await db.get('settings', 'user')
  return settings || null
}

export async function saveSplitConfig(config: SplitConfig): Promise<void> {
  const db = await getDB()
  await db.put('splitConfig', config, 'workspace')
}

export async function loadSplitConfig(): Promise<SplitConfig | null> {
  const db = await getDB()
  const config = await db.get('splitConfig', 'workspace')
  return config || null
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('files')
  await db.clear('tabs')
  await db.clear('splitConfig')
}

export function exportWorkspace(
  files: FileNode[],
  tabs: Tab[],
  settings: EditorSettings
): WorkspaceExport {
  return {
    version: 1,
    files,
    tabs,
    settings,
    exportedAt: Date.now(),
  }
}

export function downloadWorkspaceAsJson(workspace: WorkspaceExport): void {
  const json = JSON.stringify(workspace, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vibepad-workspace-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importWorkspaceFromJson(
  file: File
): Promise<WorkspaceExport | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const workspace = JSON.parse(json) as WorkspaceExport
        if (workspace.version && workspace.files && workspace.tabs) {
          resolve(workspace)
        } else {
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file)
  })
}

export class AutoSaveManager {
  private intervalId: number | null = null
  private saveCallback: (() => Promise<void>) | null = null

  start(callback: () => Promise<void>, interval: number): void {
    this.saveCallback = callback
    this.stop()
    this.intervalId = window.setInterval(() => {
      this.saveCallback?.()
    }, interval)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async saveNow(): Promise<void> {
    await this.saveCallback?.()
  }
}

export const autoSaveManager = new AutoSaveManager()
