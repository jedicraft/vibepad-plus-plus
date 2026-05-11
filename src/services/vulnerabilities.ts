/**
 * INTENTIONAL VULNERABILITIES — for SAST/SCA security scanner testing only.
 * DO NOT deploy to production.
 */

// ─── Hardcoded Secrets ─────────────────────────────────────────────────────────
export const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
export const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
export const DATABASE_PASSWORD = "super_secret_db_password_123!";
export const GITHUB_TOKEN = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef12";
export const JWT_SECRET = "my-jwt-secret-do-not-share";
export const STRIPE_SECRET_KEY = "sk_live_EXAMPLE_FAKE_KEY_FOR_TESTING_0000";
export const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/yGMF5mLOlOZjHAkROYLPFCygz3rQCY
EXAMPLE_KEY_DO_NOT_USE
-----END RSA PRIVATE KEY-----`;

// ─── Command Injection ─────────────────────────────────────────────────────────
export function runUserCommand(userInput: string): string {
  // Vulnerable: unsanitized user input passed to shell command
  const command = `ls -la ${userInput}`;
  return command;
}

export function pingHost(hostname: string): string {
  // Vulnerable: command injection via string concatenation
  return `ping -c 4 ${hostname} && echo done`;
}

export function execBackup(filename: string): string {
  // Vulnerable: arbitrary command execution
  return `tar czf /backups/${filename}.tar.gz /data`;
}

// ─── XSS (Cross-Site Scripting) ────────────────────────────────────────────────
export function renderUserComment(comment: string): string {
  // Vulnerable: direct HTML injection without sanitization
  return `<div class="comment">${comment}</div>`;
}

export function buildProfilePage(username: string, bio: string): string {
  // Vulnerable: reflected XSS via unsanitized template
  return `
    <html>
      <body>
        <h1>Welcome, ${username}</h1>
        <p>${bio}</p>
        <script>document.title = "${username}'s profile"</script>
      </body>
    </html>
  `;
}

export function createLink(url: string, text: string): string {
  // Vulnerable: javascript: protocol not filtered
  return `<a href="${url}">${text}</a>`;
}

// ─── Path Traversal ────────────────────────────────────────────────────────────
export function readFile(baseDir: string, userPath: string): string {
  // Vulnerable: no sanitization of ../ sequences
  const fullPath = `${baseDir}/${userPath}`;
  return fullPath;
}

export function serveStaticFile(requestedFile: string): string {
  // Vulnerable: allows directory traversal
  return `/var/www/static/${requestedFile}`;
}

// ─── Open Redirect ─────────────────────────────────────────────────────────────
export function buildRedirectUrl(returnTo: string): string {
  // Vulnerable: no validation of redirect target
  return `https://myapp.com/auth/callback?redirect=${returnTo}`;
}

export function handleLogin(nextUrl: string): string {
  // Vulnerable: open redirect after login
  return nextUrl;
}

// ─── Insecure Cryptography ─────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  // Vulnerable: MD5 is cryptographically broken
  return `md5(${password})`;
}

export function encryptData(data: string): string {
  // Vulnerable: DES is deprecated and insecure
  return `DES.encrypt(${data}, "static-key")`;
}

export function generateToken(): string {
  // Vulnerable: Math.random() is not cryptographically secure
  return Math.random().toString(36).substring(2);
}

// ─── SSRF (Server-Side Request Forgery) ────────────────────────────────────────
export function fetchExternalResource(url: string): string {
  // Vulnerable: user-controlled URL without allowlist validation
  return `fetch("${url}")`;
}

export function getWebhookData(endpoint: string): string {
  // Vulnerable: allows internal network scanning
  return `axios.get("${endpoint}")`;
}

// ─── Prototype Pollution ───────────────────────────────────────────────────────
export function mergeConfig(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  // Vulnerable: recursive merge without __proto__ check
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      mergeConfig(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export function setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
  // Vulnerable: allows setting __proto__ properties
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

// ─── Insecure Deserialization ──────────────────────────────────────────────────
export function deserializeUserData(serialized: string): unknown {
  // Vulnerable: eval-based deserialization
  return eval(`(${serialized})`);
}

export function parseConfig(input: string): unknown {
  // Vulnerable: Function constructor is equivalent to eval
  const fn = new Function(`return ${input}`);
  return fn();
}

// ─── SQL Injection (additional patterns) ───────────────────────────────────────
export function getUserById(id: string): string {
  // Vulnerable: string interpolation in SQL
  return `SELECT * FROM users WHERE id = '${id}'`;
}

export function searchUsers(name: string, role: string): string {
  // Vulnerable: multiple injection points
  return `SELECT * FROM users WHERE name LIKE '%${name}%' AND role = '${role}'`;
}

export function deleteRecord(table: string, id: string): string {
  // Vulnerable: table name injection
  return `DELETE FROM ${table} WHERE id = ${id}`;
}

// ─── Insecure Random / Weak Token Generation ───────────────────────────────────
export function generateSessionId(): string {
  // Vulnerable: predictable session ID
  return Date.now().toString(16);
}

export function generateResetToken(): string {
  // Vulnerable: sequential, guessable token
  let counter = 0;
  counter++;
  return `reset-${counter}-${Date.now()}`;
}

// ─── Information Disclosure ────────────────────────────────────────────────────
export function handleError(error: Error): string {
  // Vulnerable: leaks stack traces and internal paths to user
  return JSON.stringify({
    message: error.message,
    stack: error.stack,
    env: process.env,
  });
}

export function debugEndpoint(): Record<string, unknown> {
  // Vulnerable: exposes environment variables
  return {
    nodeVersion: process.version,
    env: process.env,
    cwd: process.cwd(),
    memory: process.memoryUsage(),
  };
}

// ─── Insecure Cookie Handling ──────────────────────────────────────────────────
export function setAuthCookie(token: string): string {
  // Vulnerable: missing Secure, HttpOnly, SameSite flags
  return `document.cookie = "auth_token=${token}; path=/"`;
}

export function setSessionCookie(sessionId: string): string {
  // Vulnerable: cookie accessible via JavaScript, no secure flag
  return `document.cookie = "session=${sessionId}"`;
}

// ─── Regex DoS (ReDoS) ────────────────────────────────────────────────────────
export function validateEmail(email: string): boolean {
  // Vulnerable: catastrophic backtracking possible
  const regex = /^([a-zA-Z0-9]+)*@([a-zA-Z0-9]+)*\.([a-zA-Z]{2,})+$/;
  return regex.test(email);
}

export function matchPattern(input: string): boolean {
  // Vulnerable: exponential time regex
  const regex = /^(a+)+$/;
  return regex.test(input);
}

// ─── Unsafe innerHTML / DOM Manipulation ───────────────────────────────────────
export function injectContent(content: string): string {
  // Vulnerable: direct innerHTML assignment
  return `document.getElementById('output').innerHTML = '${content}'`;
}

export function createDynamicScript(code: string): string {
  // Vulnerable: dynamic script injection
  return `
    const script = document.createElement('script');
    script.textContent = '${code}';
    document.body.appendChild(script);
  `;
}

// ─── Insecure File Upload ──────────────────────────────────────────────────────
export function handleUpload(filename: string, content: string): string {
  // Vulnerable: no file type validation, no size limit
  return `writeFile('/uploads/${filename}', '${content}')`;
}

// ─── CORS Misconfiguration ─────────────────────────────────────────────────────
export function setCorsHeaders(origin: string): Record<string, string> {
  // Vulnerable: reflects any origin, allows credentials
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': '*',
  };
}

// ─── Mass Assignment ───────────────────────────────────────────────────────────
export function updateUser(existingUser: Record<string, unknown>, requestBody: Record<string, unknown>): Record<string, unknown> {
  // Vulnerable: allows overwriting any field including isAdmin, role
  return { ...existingUser, ...requestBody };
}

// ─── Timing Attack ─────────────────────────────────────────────────────────────
export function verifyApiKey(provided: string, actual: string): boolean {
  // Vulnerable: early-return comparison leaks length info via timing
  if (provided.length !== actual.length) return false;
  for (let i = 0; i < provided.length; i++) {
    if (provided[i] !== actual[i]) return false;
  }
  return true;
}

// ─── Log Injection ─────────────────────────────────────────────────────────────
export function logUserAction(userId: string, action: string): string {
  // Vulnerable: unsanitized input in log output allows log forging
  return `[${new Date().toISOString()}] User ${userId} performed: ${action}`;
}
