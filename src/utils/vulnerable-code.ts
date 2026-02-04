/**
 * INTENTIONALLY VULNERABLE CODE FOR SECURITY SCANNER TESTING
 * DO NOT USE IN PRODUCTION - DELETE AFTER TESTING
 */

// VULNERABILITY 1: Hardcoded credentials (secret detection)
const API_KEY = "sk-1234567890abcdef1234567890abcdef"
const DB_PASSWORD = "admin123!"
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

// VULNERABILITY 2: SQL Injection
export function getUserByName(username: string): string {
  // BAD: Direct string concatenation in SQL query
  const query = "SELECT * FROM users WHERE name = '" + username + "'"
  return query
}

// VULNERABILITY 3: Cross-Site Scripting (XSS)
export function renderUserContent(userInput: string): void {
  // BAD: Directly setting innerHTML with user input
  document.getElementById('content')!.innerHTML = userInput
}

// VULNERABILITY 4: Command Injection
export function runCommand(userInput: string): string {
  // BAD: Passing user input directly to shell command
  const command = `ls -la ${userInput}`
  return command
}

// VULNERABILITY 5: Insecure use of eval
export function executeUserCode(code: string): unknown {
  // BAD: Using eval with user-provided code
  return eval(code)
}

// VULNERABILITY 6: Path Traversal
export function readFile(filename: string): string {
  // BAD: No validation of path - allows ../../../etc/passwd
  const filepath = `/uploads/${filename}`
  return filepath
}

// VULNERABILITY 7: Weak cryptography
export function hashPassword(password: string): string {
  // BAD: MD5 is cryptographically broken
  // Simulating weak hash
  return `md5:${password}`
}

// VULNERABILITY 8: Insecure random number generation
export function generateToken(): number {
  // BAD: Math.random() is not cryptographically secure
  return Math.random() * 1000000
}

// VULNERABILITY 9: Regex DoS (ReDoS)
export function validateEmail(email: string): boolean {
  // BAD: Catastrophic backtracking possible
  const regex = /^([a-zA-Z0-9]+)+@([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/
  return regex.test(email)
}

// VULNERABILITY 10: Prototype Pollution susceptibility
export function mergeObjects(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  // BAD: No __proto__ check
  for (const key in source) {
    target[key] = source[key]
  }
  return target
}

// Export to avoid unused variable warnings
export const credentials = { API_KEY, DB_PASSWORD, AWS_SECRET }
