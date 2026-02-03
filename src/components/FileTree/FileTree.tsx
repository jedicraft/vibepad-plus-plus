import { useState, useCallback } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  Edit2,
} from 'lucide-react'
import { useFileStore } from '@/stores/fileStore'
import type { FileNode } from '@/types'

interface FileTreeItemProps {
  node: FileNode
  depth: number
  onSelect: (node: FileNode) => void
  onRename: (node: FileNode) => void
  onDelete: (node: FileNode) => void
  onAddFile: (parentId: string | null) => void
  onAddFolder: (parentId: string | null) => void
}

function FileTreeItem({
  node,
  depth,
  onSelect,
  onRename,
  onDelete,
  onAddFile,
  onAddFolder,
}: FileTreeItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const toggleFolder = useFileStore((state) => state.toggleFolder)

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.id)
    } else {
      onSelect(node)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // Could add context menu here
  }

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 py-1 px-2 cursor-pointer
          hover:bg-editor-hover transition-colors group
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {node.type === 'folder' ? (
          <>
            {node.isExpanded ? (
              <ChevronDown size={14} className="text-editor-text-muted" />
            ) : (
              <ChevronRight size={14} className="text-editor-text-muted" />
            )}
            {node.isExpanded ? (
              <FolderOpen size={14} className="text-yellow-500" />
            ) : (
              <Folder size={14} className="text-yellow-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <File size={14} className="text-editor-text-muted" />
          </>
        )}
        <span className="text-sm text-editor-text flex-1 truncate">{node.name}</span>

        {isHovered && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            {node.type === 'folder' && (
              <>
                <button
                  className="p-0.5 hover:bg-editor-border rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddFile(node.id)
                  }}
                  title="New File"
                >
                  <Plus size={12} className="text-editor-text-muted" />
                </button>
                <button
                  className="p-0.5 hover:bg-editor-border rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddFolder(node.id)
                  }}
                  title="New Folder"
                >
                  <FolderPlus size={12} className="text-editor-text-muted" />
                </button>
              </>
            )}
            <button
              className="p-0.5 hover:bg-editor-border rounded"
              onClick={(e) => {
                e.stopPropagation()
                onRename(node)
              }}
              title="Rename"
            >
              <Edit2 size={12} className="text-editor-text-muted" />
            </button>
            <button
              className="p-0.5 hover:bg-editor-border rounded"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node)
              }}
              title="Delete"
            >
              <Trash2 size={12} className="text-editor-text-muted" />
            </button>
          </div>
        )}
      </div>

      {node.type === 'folder' && node.isExpanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <FileTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export function FileTree() {
  const [isCreating, setIsCreating] = useState<{
    type: 'file' | 'folder'
    parentId: string | null
  } | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [renamingNode, setRenamingNode] = useState<FileNode | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const files = useFileStore((state) => state.files)
  const addFile = useFileStore((state) => state.addFile)
  const deleteFile = useFileStore((state) => state.deleteFile)
  const renameFile = useFileStore((state) => state.renameFile)
  const openFile = useFileStore((state) => state.openFile)

  const handleSelect = (node: FileNode) => {
    if (node.type === 'file') {
      openFile(node.id)
    }
  }

  const handleAddFile = (parentId: string | null) => {
    setIsCreating({ type: 'file', parentId })
    setNewItemName('')
  }

  const handleAddFolder = (parentId: string | null) => {
    setIsCreating({ type: 'folder', parentId })
    setNewItemName('')
  }

  const handleCreateSubmit = () => {
    if (newItemName.trim() && isCreating) {
      const newNode = addFile(isCreating.parentId, newItemName.trim(), isCreating.type)
      if (isCreating.type === 'file') {
        openFile(newNode.id)
      }
    }
    setIsCreating(null)
    setNewItemName('')
  }

  const handleRename = (node: FileNode) => {
    setRenamingNode(node)
    setRenameValue(node.name)
  }

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renamingNode) {
      renameFile(renamingNode.id, renameValue.trim())
    }
    setRenamingNode(null)
    setRenameValue('')
  }

  const handleDelete = (node: FileNode) => {
    if (confirm(`Delete "${node.name}"?`)) {
      deleteFile(node.id)
    }
  }

  const sortedFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="h-full flex flex-col bg-editor-sidebar">
      <div className="flex items-center justify-between px-3 py-2 border-b border-editor-border">
        <span className="text-xs font-semibold text-editor-text-muted uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-editor-hover rounded"
            onClick={() => handleAddFile(null)}
            title="New File"
          >
            <Plus size={14} className="text-editor-text-muted" />
          </button>
          <button
            className="p-1 hover:bg-editor-hover rounded"
            onClick={() => handleAddFolder(null)}
            title="New Folder"
          >
            <FolderPlus size={14} className="text-editor-text-muted" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {sortedFiles.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            depth={0}
            onSelect={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
            onAddFile={handleAddFile}
            onAddFolder={handleAddFolder}
          />
        ))}

        {isCreating && isCreating.parentId === null && (
          <div className="flex items-center gap-1 py-1 px-2" style={{ paddingLeft: '8px' }}>
            <span className="w-3.5" />
            {isCreating.type === 'folder' ? (
              <Folder size={14} className="text-yellow-500" />
            ) : (
              <File size={14} className="text-editor-text-muted" />
            )}
            <input
              type="text"
              className="flex-1 bg-editor-bg text-sm text-editor-text px-1 outline-none border border-editor-accent rounded"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubmit()
                if (e.key === 'Escape') setIsCreating(null)
              }}
              onBlur={handleCreateSubmit}
              autoFocus
              placeholder={isCreating.type === 'file' ? 'filename.txt' : 'folder name'}
            />
          </div>
        )}

        {files.length === 0 && !isCreating && (
          <div className="px-3 py-4 text-sm text-editor-text-muted text-center">
            No files yet.
            <br />
            Create a new file to get started.
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      {renamingNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-editor-sidebar border border-editor-border rounded-lg p-4 w-80">
            <h3 className="text-sm font-medium text-editor-text mb-3">Rename</h3>
            <input
              type="text"
              className="w-full bg-editor-bg text-sm text-editor-text px-3 py-2 outline-none border border-editor-border rounded focus:border-editor-accent"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') setRenamingNode(null)
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1.5 text-sm text-editor-text hover:bg-editor-hover rounded"
                onClick={() => setRenamingNode(null)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 text-sm text-editor-text bg-editor-accent hover:bg-editor-accent/80 rounded"
                onClick={handleRenameSubmit}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
