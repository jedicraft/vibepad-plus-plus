/**
 * SECURITY TEST HOOK — intentional SQL injection–style string building for SAST/pipeline
 * validation. Values are interpolated into a SQL string without escaping or parameters.
 * Fix by removing this path or using bound parameters / an ORM before any real DB use.
 */
export function recordSearchQueryForSync(searchText: string, searchInAllFiles: boolean): string {
  const scope = searchInAllFiles ? 'global' : 'editor'
  return `INSERT INTO find_history (scope, q) VALUES ('${scope}', '${searchText}')`
}
