const extensionToLanguage: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',

  // Data formats
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'ini',

  // Programming languages
  py: 'python',
  rb: 'ruby',
  php: 'php',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  r: 'r',
  lua: 'lua',
  perl: 'perl',
  pl: 'perl',

  // Shell
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',
  ps1: 'powershell',
  bat: 'bat',
  cmd: 'bat',

  // Config files
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  cmake: 'cmake',

  // Documentation
  md: 'markdown',
  markdown: 'markdown',
  rst: 'restructuredtext',
  tex: 'latex',

  // Database
  sql: 'sql',
  mysql: 'sql',
  pgsql: 'pgsql',

  // Other
  graphql: 'graphql',
  gql: 'graphql',
  vue: 'vue',
  svelte: 'svelte',
  astro: 'astro',
  ini: 'ini',
  conf: 'ini',
  cfg: 'ini',
  env: 'ini',
  gitignore: 'ignore',
  dockerignore: 'ignore',
}

const filenameToLanguage: Record<string, string> = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  cmakelists: 'cmake',
  '.gitignore': 'ignore',
  '.dockerignore': 'ignore',
  '.env': 'ini',
  '.env.local': 'ini',
  '.env.development': 'ini',
  '.env.production': 'ini',
}

export function getLanguageFromExtension(filename: string): string {
  const lowerFilename = filename.toLowerCase()

  // Check exact filename matches first
  if (filenameToLanguage[lowerFilename]) {
    return filenameToLanguage[lowerFilename]
  }

  // Check for extension
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) {
    // No extension, check if filename matches a known type
    return filenameToLanguage[lowerFilename] || 'plaintext'
  }

  const extension = filename.slice(lastDot + 1).toLowerCase()
  return extensionToLanguage[extension] || 'plaintext'
}

export function getFileIcon(filename: string, isFolder: boolean): string {
  if (isFolder) return 'folder'

  const language = getLanguageFromExtension(filename)

  const languageIcons: Record<string, string> = {
    javascript: 'file-code',
    typescript: 'file-code',
    html: 'file-code',
    css: 'file-code',
    json: 'file-json',
    markdown: 'file-text',
    python: 'file-code',
    plaintext: 'file',
  }

  return languageIcons[language] || 'file-code'
}
