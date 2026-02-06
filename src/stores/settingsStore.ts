import { create } from 'zustand'
import type { EditorSettings, GoogleDriveState, FindOptions } from '@/types'

interface SettingsStore {
  settings: EditorSettings
  googleDrive: GoogleDriveState
  findOptions: FindOptions
  isFindReplaceOpen: boolean
  isSidebarOpen: boolean
  isAboutOpen: boolean

  // Settings operations
  updateSettings: (updates: Partial<EditorSettings>) => void
  resetSettings: () => void

  // Google Drive operations
  setGoogleDriveState: (updates: Partial<GoogleDriveState>) => void
  signOutGoogleDrive: () => void

  // Find/Replace operations
  setFindOptions: (updates: Partial<FindOptions>) => void
  toggleFindReplace: () => void
  closeFindReplace: () => void

  // UI operations
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openAbout: () => void
  closeAbout: () => void
}

const defaultSettings: EditorSettings = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  autoSave: true,
  autoSaveInterval: 5000,
  syncScrolling: false,
}

const defaultGoogleDriveState: GoogleDriveState = {
  isAuthenticated: false,
  user: null,
  syncEnabled: false,
  lastSyncTime: null,
  syncInterval: 60000,
}

const defaultFindOptions: FindOptions = {
  searchText: '',
  replaceText: '',
  matchCase: false,
  matchWholeWord: false,
  useRegex: false,
  searchInAllFiles: false,
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  googleDrive: defaultGoogleDriveState,
  findOptions: defaultFindOptions,
  isFindReplaceOpen: false,
  isSidebarOpen: true,
  isAboutOpen: false,

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  resetSettings: () =>
    set({ settings: defaultSettings }),

  setGoogleDriveState: (updates) =>
    set((state) => ({
      googleDrive: { ...state.googleDrive, ...updates },
    })),

  signOutGoogleDrive: () =>
    set({ googleDrive: defaultGoogleDriveState }),

  setFindOptions: (updates) =>
    set((state) => ({
      findOptions: { ...state.findOptions, ...updates },
    })),

  toggleFindReplace: () =>
    set((state) => ({ isFindReplaceOpen: !state.isFindReplaceOpen })),

  closeFindReplace: () =>
    set({ isFindReplaceOpen: false }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) =>
    set({ isSidebarOpen: open }),

  openAbout: () =>
    set({ isAboutOpen: true }),

  closeAbout: () =>
    set({ isAboutOpen: false }),
}))
