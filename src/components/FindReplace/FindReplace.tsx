import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  CaseSensitive,
  WholeWord,
  Regex,
  FileText,
} from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFileStore } from '@/stores/fileStore'
import type { FindMatch } from '@/types'

export function FindReplace() {
  const [matches, setMatches] = useState<FindMatch[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [showReplace, setShowReplace] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { findOptions, setFindOptions, closeFindReplace, isFindReplaceOpen } =
    useSettingsStore()
  const { tabs, splitConfig, activePaneId, updateTabContent, getTabById } = useFileStore()

  const getActiveTab = useCallback(() => {
    const activePane = splitConfig.panes.find((p) => p.id === activePaneId)
    if (!activePane?.activeTabId) return null
    return tabs.find((t) => t.id === activePane.activeTabId)
  }, [splitConfig, activePaneId, tabs])

  const performSearch = useCallback(() => {
    if (!findOptions.searchText) {
      setMatches([])
      return
    }

    const searchTargets = findOptions.searchInAllFiles
      ? tabs
      : [getActiveTab()].filter(Boolean)

    const newMatches: FindMatch[] = []

    for (const tab of searchTargets) {
      if (!tab) continue

      const lines = tab.content.split('\n')
      let searchPattern: RegExp

      try {
        let pattern = findOptions.useRegex
          ? findOptions.searchText
          : findOptions.searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        if (findOptions.matchWholeWord) {
          pattern = `\\b${pattern}\\b`
        }

        searchPattern = new RegExp(
          pattern,
          findOptions.matchCase ? 'g' : 'gi'
        )
      } catch {
        // Invalid regex
        return
      }

      lines.forEach((line, lineIndex) => {
        let match
        while ((match = searchPattern.exec(line)) !== null) {
          newMatches.push({
            fileId: tab.fileId,
            fileName: tab.name,
            lineNumber: lineIndex + 1,
            column: match.index + 1,
            lineContent: line,
            matchLength: match[0].length,
          })
        }
      })
    }

    setMatches(newMatches)
    setCurrentMatchIndex(0)
  }, [findOptions, tabs, getActiveTab])

  useEffect(() => {
    performSearch()
  }, [
    findOptions.searchText,
    findOptions.matchCase,
    findOptions.matchWholeWord,
    findOptions.useRegex,
    findOptions.searchInAllFiles,
    performSearch,
  ])

  useEffect(() => {
    if (isFindReplaceOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }, [isFindReplaceOpen])

  const goToMatch = (index: number) => {
    if (matches.length === 0) return
    const newIndex = ((index % matches.length) + matches.length) % matches.length
    setCurrentMatchIndex(newIndex)
    // TODO: Navigate editor to match position
  }

  const replaceMatch = () => {
    if (matches.length === 0) return
    const match = matches[currentMatchIndex]
    const tab = getTabById(tabs.find((t) => t.fileId === match.fileId)?.id || '')
    if (!tab) return

    const lines = tab.content.split('\n')
    const line = lines[match.lineNumber - 1]
    const before = line.substring(0, match.column - 1)
    const after = line.substring(match.column - 1 + match.matchLength)
    lines[match.lineNumber - 1] = before + findOptions.replaceText + after

    updateTabContent(tab.id, lines.join('\n'))
    performSearch()
  }

  const replaceAll = () => {
    if (!findOptions.searchText) return

    const searchTargets = findOptions.searchInAllFiles
      ? tabs
      : [getActiveTab()].filter(Boolean)

    for (const tab of searchTargets) {
      if (!tab) continue

      let searchPattern: RegExp

      try {
        let pattern = findOptions.useRegex
          ? findOptions.searchText
          : findOptions.searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        if (findOptions.matchWholeWord) {
          pattern = `\\b${pattern}\\b`
        }

        searchPattern = new RegExp(
          pattern,
          findOptions.matchCase ? 'g' : 'gi'
        )
      } catch {
        return
      }

      const newContent = tab.content.replace(searchPattern, findOptions.replaceText)
      updateTabContent(tab.id, newContent)
    }

    performSearch()
  }

  if (!isFindReplaceOpen) return null

  return (
    <div className="absolute top-0 right-4 z-50 bg-editor-sidebar border border-editor-border rounded-b-lg shadow-lg w-96">
      <div className="p-3 space-y-2">
        {/* Search Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-editor-text-muted"
            />
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-editor-bg text-sm text-editor-text pl-8 pr-3 py-1.5 outline-none border border-editor-border rounded focus:border-editor-accent"
              placeholder="Find"
              value={findOptions.searchText}
              onChange={(e) => setFindOptions({ searchText: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.shiftKey ? goToMatch(currentMatchIndex - 1) : goToMatch(currentMatchIndex + 1)
                }
                if (e.key === 'Escape') closeFindReplace()
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              className={`p-1.5 rounded ${findOptions.matchCase ? 'bg-editor-accent' : 'hover:bg-editor-hover'}`}
              onClick={() => setFindOptions({ matchCase: !findOptions.matchCase })}
              title="Match Case"
            >
              <CaseSensitive size={14} className="text-editor-text" />
            </button>
            <button
              className={`p-1.5 rounded ${findOptions.matchWholeWord ? 'bg-editor-accent' : 'hover:bg-editor-hover'}`}
              onClick={() => setFindOptions({ matchWholeWord: !findOptions.matchWholeWord })}
              title="Whole Word"
            >
              <WholeWord size={14} className="text-editor-text" />
            </button>
            <button
              className={`p-1.5 rounded ${findOptions.useRegex ? 'bg-editor-accent' : 'hover:bg-editor-hover'}`}
              onClick={() => setFindOptions({ useRegex: !findOptions.useRegex })}
              title="Use Regex"
            >
              <Regex size={14} className="text-editor-text" />
            </button>
          </div>

          <button
            className="p-1 hover:bg-editor-hover rounded"
            onClick={closeFindReplace}
          >
            <X size={16} className="text-editor-text-muted" />
          </button>
        </div>

        {/* Replace Row */}
        {showReplace && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Replace
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-editor-text-muted"
              />
              <input
                type="text"
                className="w-full bg-editor-bg text-sm text-editor-text pl-8 pr-3 py-1.5 outline-none border border-editor-border rounded focus:border-editor-accent"
                placeholder="Replace"
                value={findOptions.replaceText}
                onChange={(e) => setFindOptions({ replaceText: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') replaceMatch()
                  if (e.key === 'Escape') closeFindReplace()
                }}
              />
            </div>

            <button
              className="px-2 py-1.5 text-xs text-editor-text bg-editor-hover hover:bg-editor-border rounded"
              onClick={replaceMatch}
            >
              Replace
            </button>
            <button
              className="px-2 py-1.5 text-xs text-editor-text bg-editor-hover hover:bg-editor-border rounded"
              onClick={replaceAll}
            >
              All
            </button>
          </div>
        )}

        {/* Options Row */}
        <div className="flex items-center justify-between text-xs text-editor-text-muted">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1 hover:text-editor-text"
              onClick={() => setShowReplace(!showReplace)}
            >
              {showReplace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Replace
            </button>
            <button
              className={`flex items-center gap-1 hover:text-editor-text ${findOptions.searchInAllFiles ? 'text-editor-accent' : ''}`}
              onClick={() =>
                setFindOptions({ searchInAllFiles: !findOptions.searchInAllFiles })
              }
            >
              <FileText size={12} />
              All Files
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>
              {matches.length > 0
                ? `${currentMatchIndex + 1} of ${matches.length}`
                : 'No results'}
            </span>
            <button
              className="p-1 hover:bg-editor-hover rounded"
              onClick={() => goToMatch(currentMatchIndex - 1)}
              disabled={matches.length === 0}
            >
              <ChevronUp size={14} />
            </button>
            <button
              className="p-1 hover:bg-editor-hover rounded"
              onClick={() => goToMatch(currentMatchIndex + 1)}
              disabled={matches.length === 0}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
