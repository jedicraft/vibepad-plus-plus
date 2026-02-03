import { create } from 'zustand'
import type { FileNode, Tab, EditorPane, SplitConfig } from '@/types'
import { getLanguageFromExtension } from '@/utils/languageDetection'

interface FileStore {
  files: FileNode[]
  tabs: Tab[]
  splitConfig: SplitConfig
  activePaneId: string

  // File operations
  addFile: (parentId: string | null, name: string, type: 'file' | 'folder') => FileNode
  updateFile: (id: string, updates: Partial<FileNode>) => void
  deleteFile: (id: string) => void
  renameFile: (id: string, newName: string) => void
  toggleFolder: (id: string) => void
  getFileById: (id: string) => FileNode | undefined
  getFileByPath: (path: string) => FileNode | undefined
  moveFile: (fileId: string, newParentId: string | null) => void

  // Tab operations
  openFile: (fileId: string, paneId?: string) => void
  closeTab: (tabId: string) => void
  closeOtherTabs: (tabId: string, paneId: string) => void
  closeAllTabs: (paneId: string) => void
  setActiveTab: (tabId: string, paneId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  saveTab: (tabId: string) => void
  duplicateTab: (tabId: string) => void
  reorderTabs: (paneId: string, fromIndex: number, toIndex: number) => void
  getTabById: (id: string) => Tab | undefined

  // Split operations
  splitPane: (direction: 'horizontal' | 'vertical') => void
  closeSplit: (paneId: string) => void
  setActivePane: (paneId: string) => void

  // Bulk operations
  setFiles: (files: FileNode[]) => void
  setTabs: (tabs: Tab[]) => void
  setSplitConfig: (config: SplitConfig) => void
}

const generateId = () => Math.random().toString(36).substring(2, 11)

const initialPaneId = generateId()

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  tabs: [],
  splitConfig: {
    direction: 'horizontal',
    panes: [{ id: initialPaneId, tabIds: [], activeTabId: null }],
  },
  activePaneId: initialPaneId,

  addFile: (parentId, name, type) => {
    const newFile: FileNode = {
      id: generateId(),
      name,
      type,
      parentId,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? getLanguageFromExtension(name) : undefined,
      children: type === 'folder' ? [] : undefined,
      isExpanded: type === 'folder' ? false : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    set((state) => {
      if (parentId === null) {
        return { files: [...state.files, newFile] }
      }

      const updateChildren = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === parentId && node.type === 'folder') {
            return {
              ...node,
              children: [...(node.children || []), newFile],
              updatedAt: Date.now(),
            }
          }
          if (node.children) {
            return { ...node, children: updateChildren(node.children) }
          }
          return node
        })
      }

      return { files: updateChildren(state.files) }
    })

    return newFile
  },

  updateFile: (id, updates) => {
    set((state) => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === id) {
            return { ...node, ...updates, updatedAt: Date.now() }
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) }
          }
          return node
        })
      }
      return { files: updateNode(state.files) }
    })
  },

  deleteFile: (id) => {
    set((state) => {
      const tabsToClose = state.tabs.filter((tab) => tab.fileId === id)

      const deleteNode = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter((node) => node.id !== id)
          .map((node) => {
            if (node.children) {
              return { ...node, children: deleteNode(node.children) }
            }
            return node
          })
      }

      const newTabs = state.tabs.filter((tab) => tab.fileId !== id)
      const newPanes = state.splitConfig.panes.map((pane) => {
        const newTabIds = pane.tabIds.filter(
          (tabId) => !tabsToClose.find((t) => t.id === tabId)
        )
        return {
          ...pane,
          tabIds: newTabIds,
          activeTabId: newTabIds.includes(pane.activeTabId || '')
            ? pane.activeTabId
            : newTabIds[0] || null,
        }
      })

      return {
        files: deleteNode(state.files),
        tabs: newTabs,
        splitConfig: { ...state.splitConfig, panes: newPanes },
      }
    })
  },

  renameFile: (id, newName) => {
    const file = get().getFileById(id)
    if (!file) return

    const newLanguage = file.type === 'file' ? getLanguageFromExtension(newName) : undefined

    set((state) => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              name: newName,
              language: newLanguage,
              updatedAt: Date.now(),
            }
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) }
          }
          return node
        })
      }

      const newTabs = state.tabs.map((tab) => {
        if (tab.fileId === id) {
          return { ...tab, name: newName, language: newLanguage || tab.language }
        }
        return tab
      })

      return { files: updateNode(state.files), tabs: newTabs }
    })
  },

  toggleFolder: (id) => {
    set((state) => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === id && node.type === 'folder') {
            return { ...node, isExpanded: !node.isExpanded }
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) }
          }
          return node
        })
      }
      return { files: updateNode(state.files) }
    })
  },

  getFileById: (id) => {
    const findNode = (nodes: FileNode[]): FileNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findNode(node.children)
          if (found) return found
        }
      }
      return undefined
    }
    return findNode(get().files)
  },

  getFileByPath: (path) => {
    const parts = path.split('/').filter(Boolean)
    let current: FileNode[] = get().files

    for (let i = 0; i < parts.length; i++) {
      const found = current.find((n) => n.name === parts[i])
      if (!found) return undefined
      if (i === parts.length - 1) return found
      if (found.type === 'folder' && found.children) {
        current = found.children
      } else {
        return undefined
      }
    }
    return undefined
  },

  moveFile: (fileId, newParentId) => {
    const file = get().getFileById(fileId)
    if (!file) return

    set((state) => {
      const removeNode = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter((n) => n.id !== fileId)
          .map((n) => {
            if (n.children) {
              return { ...n, children: removeNode(n.children) }
            }
            return n
          })
      }

      const movedFile = { ...file, parentId: newParentId }

      if (newParentId === null) {
        return { files: [...removeNode(state.files), movedFile] }
      }

      const addToParent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === newParentId && node.type === 'folder') {
            return {
              ...node,
              children: [...(node.children || []), movedFile],
            }
          }
          if (node.children) {
            return { ...node, children: addToParent(node.children) }
          }
          return node
        })
      }

      return { files: addToParent(removeNode(state.files)) }
    })
  },

  openFile: (fileId, paneId) => {
    const file = get().getFileById(fileId)
    if (!file || file.type !== 'file') return

    const targetPaneId = paneId || get().activePaneId

    set((state) => {
      const existingTab = state.tabs.find((t) => t.fileId === fileId)
      const pane = state.splitConfig.panes.find((p) => p.id === targetPaneId)

      if (!pane) return state

      if (existingTab) {
        if (!pane.tabIds.includes(existingTab.id)) {
          return {
            splitConfig: {
              ...state.splitConfig,
              panes: state.splitConfig.panes.map((p) =>
                p.id === targetPaneId
                  ? {
                      ...p,
                      tabIds: [...p.tabIds, existingTab.id],
                      activeTabId: existingTab.id,
                    }
                  : p
              ),
            },
            activePaneId: targetPaneId,
          }
        }
        return {
          splitConfig: {
            ...state.splitConfig,
            panes: state.splitConfig.panes.map((p) =>
              p.id === targetPaneId ? { ...p, activeTabId: existingTab.id } : p
            ),
          },
          activePaneId: targetPaneId,
        }
      }

      const newTab: Tab = {
        id: generateId(),
        fileId: file.id,
        name: file.name,
        language: file.language || 'plaintext',
        content: file.content || '',
        isDirty: false,
      }

      return {
        tabs: [...state.tabs, newTab],
        splitConfig: {
          ...state.splitConfig,
          panes: state.splitConfig.panes.map((p) =>
            p.id === targetPaneId
              ? {
                  ...p,
                  tabIds: [...p.tabIds, newTab.id],
                  activeTabId: newTab.id,
                }
              : p
          ),
        },
        activePaneId: targetPaneId,
      }
    })
  },

  closeTab: (tabId) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== tabId)
      const newPanes = state.splitConfig.panes.map((pane) => {
        const newTabIds = pane.tabIds.filter((id) => id !== tabId)
        const needsNewActive = pane.activeTabId === tabId
        return {
          ...pane,
          tabIds: newTabIds,
          activeTabId: needsNewActive ? newTabIds[newTabIds.length - 1] || null : pane.activeTabId,
        }
      })

      return {
        tabs: newTabs,
        splitConfig: { ...state.splitConfig, panes: newPanes },
      }
    })
  },

  closeOtherTabs: (tabId, paneId) => {
    set((state) => {
      const pane = state.splitConfig.panes.find((p) => p.id === paneId)
      if (!pane) return state

      const tabsToKeep = [tabId]

      const otherPaneTabIds = state.splitConfig.panes
        .filter((p) => p.id !== paneId)
        .flatMap((p) => p.tabIds)

      const newTabs = state.tabs.filter(
        (t) => tabsToKeep.includes(t.id) || otherPaneTabIds.includes(t.id)
      )

      const newPanes = state.splitConfig.panes.map((p) =>
        p.id === paneId
          ? { ...p, tabIds: tabsToKeep, activeTabId: tabId }
          : p
      )

      return {
        tabs: newTabs,
        splitConfig: { ...state.splitConfig, panes: newPanes },
      }
    })
  },

  closeAllTabs: (paneId) => {
    set((state) => {
      const pane = state.splitConfig.panes.find((p) => p.id === paneId)
      if (!pane) return state

      const otherPaneTabIds = state.splitConfig.panes
        .filter((p) => p.id !== paneId)
        .flatMap((p) => p.tabIds)

      const newTabs = state.tabs.filter((t) => otherPaneTabIds.includes(t.id))

      const newPanes = state.splitConfig.panes.map((p) =>
        p.id === paneId ? { ...p, tabIds: [], activeTabId: null } : p
      )

      return {
        tabs: newTabs,
        splitConfig: { ...state.splitConfig, panes: newPanes },
      }
    })
  },

  setActiveTab: (tabId, paneId) => {
    set((state) => ({
      splitConfig: {
        ...state.splitConfig,
        panes: state.splitConfig.panes.map((p) =>
          p.id === paneId ? { ...p, activeTabId: tabId } : p
        ),
      },
      activePaneId: paneId,
    }))
  },

  updateTabContent: (tabId, content) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, content, isDirty: true } : t
      ),
    }))
  },

  saveTab: (tabId) => {
    const tab = get().getTabById(tabId)
    if (!tab) return

    get().updateFile(tab.fileId, { content: tab.content })
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: false } : t
      ),
    }))
  },

  duplicateTab: (tabId) => {
    const tab = get().getTabById(tabId)
    if (!tab) return

    const file = get().getFileById(tab.fileId)
    if (!file) return

    const newFile = get().addFile(file.parentId, `${file.name} (copy)`, 'file')
    get().updateFile(newFile.id, { content: tab.content })
    get().openFile(newFile.id)
  },

  reorderTabs: (paneId, fromIndex, toIndex) => {
    set((state) => {
      const newPanes = state.splitConfig.panes.map((pane) => {
        if (pane.id !== paneId) return pane

        const newTabIds = [...pane.tabIds]
        const [removed] = newTabIds.splice(fromIndex, 1)
        newTabIds.splice(toIndex, 0, removed)

        return { ...pane, tabIds: newTabIds }
      })

      return { splitConfig: { ...state.splitConfig, panes: newPanes } }
    })
  },

  getTabById: (id) => get().tabs.find((t) => t.id === id),

  splitPane: (direction) => {
    set((state) => {
      if (state.splitConfig.panes.length >= 2) return state

      const newPane: EditorPane = {
        id: generateId(),
        tabIds: [],
        activeTabId: null,
      }

      return {
        splitConfig: {
          direction,
          panes: [...state.splitConfig.panes, newPane],
        },
      }
    })
  },

  closeSplit: (paneId) => {
    set((state) => {
      if (state.splitConfig.panes.length <= 1) return state

      const remainingPanes = state.splitConfig.panes.filter((p) => p.id !== paneId)

      const otherPaneTabIds = remainingPanes.flatMap((p) => p.tabIds)
      const newTabs = state.tabs.filter((t) => otherPaneTabIds.includes(t.id))

      return {
        tabs: newTabs,
        splitConfig: { ...state.splitConfig, panes: remainingPanes },
        activePaneId: remainingPanes[0]?.id || state.activePaneId,
      }
    })
  },

  setActivePane: (paneId) => {
    set({ activePaneId: paneId })
  },

  setFiles: (files) => set({ files }),
  setTabs: (tabs) => set({ tabs }),
  setSplitConfig: (config) => set({ splitConfig: config, activePaneId: config.panes[0]?.id }),
}))
