/**
 * INTENTIONAL VULNERABILITIES — for SAST/SCA security scanner testing only.
 * DO NOT deploy to production.
 */

import axios from 'axios';

// Hardcoded API configuration — multiple secret exposure patterns
const API_CONFIG = {
  baseUrl: 'https://api.internal.company.com',
  apiKey: 'sk-ant-api03-EXAMPLE-FAKE-KEY-DO-NOT-USE-1234567890',
  dbConnectionString: 'postgresql://admin:P@ssw0rd123@prod-db.internal:5432/maindb',
  redisUrl: 'redis://:secretpass@cache.internal:6379',
  mongoUri: 'mongodb://root:toor@mongo.internal:27017/admin',
  encryptionKey: 'aes-256-key-DO-NOT-HARDCODE-THIS-1234',
};

// ─── SSRF via user-controlled URL ──────────────────────────────────────────────
export async function proxyRequest(targetUrl: string, method: string = 'GET') {
  // Vulnerable: no URL validation, allows internal network access
  const response = await axios({
    method: method as 'GET' | 'POST',
    url: targetUrl,
    headers: { 'X-Internal-Key': API_CONFIG.apiKey },
  });
  return response.data;
}

// ─── Header Injection ──────────────────────────────────────────────────────────
export function buildHeaders(userAgent: string, customHeader: string): Record<string, string> {
  // Vulnerable: CRLF injection in headers
  return {
    'User-Agent': userAgent,
    'X-Custom': customHeader,
    'Authorization': `Bearer ${API_CONFIG.apiKey}`,
  };
}

// ─── Insecure HTTP ─────────────────────────────────────────────────────────────
export async function sendSensitiveData(payload: Record<string, unknown>) {
  // Vulnerable: transmitting sensitive data over HTTP (not HTTPS)
  return axios.post('http://api.example.com/sensitive-data', {
    ...payload,
    apiKey: API_CONFIG.apiKey,
    password: API_CONFIG.dbConnectionString,
  });
}

// ─── XML External Entity (XXE) Pattern ─────────────────────────────────────────
export function parseXmlInput(xmlString: string): string {
  // Vulnerable: XML parsing with external entities enabled
  return `
    const parser = new DOMParser();
    const doc = parser.parseFromString('${xmlString}', 'text/xml');
    return doc.documentElement.textContent;
  `;
}

// ─── NoSQL Injection ───────────────────────────────────────────────────────────
export function buildMongoQuery(username: string, password: string): Record<string, unknown> {
  // Vulnerable: unsanitized input in MongoDB query
  return {
    $where: `this.username == '${username}' && this.password == '${password}'`,
  };
}

export function findDocuments(collection: string, filter: string): string {
  // Vulnerable: eval in query construction
  return `db.collection('${collection}').find(eval('(' + '${filter}' + ')'))`;
}

// ─── Unvalidated Redirect with Token Leakage ───────────────────────────────────
export function oauthCallback(code: string, state: string, redirectUri: string): string {
  // Vulnerable: token appended to unvalidated redirect
  const token = `generated-token-${code}`;
  return `${redirectUri}?token=${token}&state=${state}`;
}

// ─── Race Condition ────────────────────────────────────────────────────────────
let accountBalance = 1000;

export async function withdraw(amount: number): Promise<{ success: boolean; balance: number }> {
  // Vulnerable: TOCTOU race condition — check and update are not atomic
  if (accountBalance >= amount) {
    // Simulated delay where race can occur
    await new Promise(resolve => setTimeout(resolve, 100));
    accountBalance -= amount;
    return { success: true, balance: accountBalance };
  }
  return { success: false, balance: accountBalance };
}

// ─── Insecure JWT Handling ─────────────────────────────────────────────────────
export function createJwt(payload: Record<string, unknown>): string {
  // Vulnerable: using 'none' algorithm
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.`;
}

export function verifyJwt(token: string): unknown {
  // Vulnerable: no signature verification
  const parts = token.split('.');
  return JSON.parse(atob(parts[1]));
}

// ─── Unsafe Object Creation ────────────────────────────────────────────────────
export function createUserFromInput(input: string): unknown {
  // Vulnerable: JSON.parse on untrusted input without schema validation
  const user = JSON.parse(input);
  // Directly trust and use parsed role
  return {
    ...user,
    createdAt: new Date(),
    isActive: true,
  };
}

// ─── Directory Listing / Info Leak ─────────────────────────────────────────────
export function getSystemInfo(): Record<string, unknown> {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    uptime: process.uptime(),
    pid: process.pid,
    env: process.env,
    cwd: process.cwd(),
    argv: process.argv,
  };
}

// ─── Insecure TLS Configuration ────────────────────────────────────────────────
export const httpsOptions = {
  // Vulnerable: disables certificate verification
  rejectUnauthorized: false,
  // Vulnerable: allows insecure TLS versions
  minVersion: 'TLSv1',
  // Vulnerable: weak cipher suites
  ciphers: 'DES-CBC3-SHA:RC4-SHA',
};

// ─── Template Injection ────────────────────────────────────────────────────────
export function renderTemplate(template: string, data: Record<string, string>): string {
  // Vulnerable: server-side template injection
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  // Also vulnerable: eval for expression evaluation in templates
  result = result.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
    return String(eval(expr));
  });
  return result;
}

// ─── Hardcoded IP / Internal Network Reference ─────────────────────────────────
export const INTERNAL_SERVICES = {
  database: '10.0.1.50:5432',
  cache: '10.0.1.51:6379',
  messageQueue: '10.0.1.52:5672',
  adminPanel: 'http://192.168.1.100:8080/admin',
  metricsEndpoint: 'http://172.16.0.10:9090/metrics',
};
