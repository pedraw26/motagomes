import type { Context } from "@netlify/functions";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

/* =============================================================
   Passkey / WebAuthn backend — single endpoint, ?action= switch

   Actions:
     register-options  → GET  — returns registration challenge
     register-verify   → POST — verifies + stores new credential
     auth-options      → GET  — returns authentication challenge
     auth-verify       → POST — verifies assertion, returns session

   Storage: Supabase
     passkeys           (credential_id, public_key, counter, transports, ...)
     passkey_challenges (challenge, kind, expires_at)

   Env:
     SUPABASE_URL
     SUPABASE_SERVICE_KEY
     PASSKEY_RP_ID        default 'motagomes.com'
     PASSKEY_ORIGIN       default 'https://motagomes.com'
     DASHBOARD_SESSION_SECRET (used to sign the session token)
   ============================================================= */

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SERVICE_KEY") || "";
const RP_ID = Netlify.env.get("PASSKEY_RP_ID") || "motagomes.com";
const RP_NAME = "Mota Gomes Dashboard";
const ORIGIN = Netlify.env.get("PASSKEY_ORIGIN") || "https://motagomes.com";
const SESSION_SECRET = Netlify.env.get("DASHBOARD_SESSION_SECRET") || "change-me-in-prod";

// Single-user dashboard → one stable user handle
const USER_HANDLE = new TextEncoder().encode("pedro-mota-gomes");
const USER_NAME = "pedro@motagomes.com";
const USER_DISPLAY = "Pedro Mota Gomes";

// ─── Supabase helpers ─────────────────────────────────────────
async function sbFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  return res.json();
}

async function saveChallenge(challenge: string, kind: "register" | "auth") {
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await sbFetch("passkey_challenges", {
    method: "POST",
    body: JSON.stringify({ challenge, kind, expires_at: expires }),
  });
}

async function consumeChallenge(challenge: string, kind: string) {
  const rows = await sbFetch(
    `passkey_challenges?challenge=eq.${encodeURIComponent(challenge)}&kind=eq.${kind}&select=*`,
  );
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const row = rows[0];
  if (new Date(row.expires_at).getTime() < Date.now()) return false;
  // one-time use
  await sbFetch(`passkey_challenges?id=eq.${row.id}`, { method: "DELETE" });
  return true;
}

async function listPasskeys() {
  return sbFetch("passkeys?select=*");
}

async function getPasskey(credentialId: string) {
  const rows = await sbFetch(
    `passkeys?credential_id=eq.${encodeURIComponent(credentialId)}&select=*`,
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function savePasskey(row: any) {
  return sbFetch("passkeys", { method: "POST", body: JSON.stringify(row) });
}

async function updatePasskeyCounter(credentialId: string, counter: number) {
  return sbFetch(
    `passkeys?credential_id=eq.${encodeURIComponent(credentialId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ counter, last_used_at: new Date().toISOString() }),
    },
  );
}

// ─── Session token (HMAC-SHA256 signed) ───────────────────────
async function signSession(): Promise<string> {
  const payload = {
    sub: "pedro",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30d
  };
  const body = btoa(JSON.stringify(payload)).replace(/=+$/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, "");
  return `${body}.${sigB64}`;
}

// ─── Utility: base64url helpers ───────────────────────────────
function bufFromB64url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlFromBuf(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Handler ──────────────────────────────────────────────────
export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  try {
    // ── REGISTER OPTIONS ────────────────────────────────────
    if (action === "register-options" && req.method === "GET") {
      const existing = await listPasskeys();
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: USER_HANDLE,
        userName: USER_NAME,
        userDisplayName: USER_DISPLAY,
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform", // prefer Touch ID / Face ID
        },
        excludeCredentials: existing.map((p: any) => ({
          id: p.credential_id,
          transports: p.transports || ["internal"],
        })),
      });
      await saveChallenge(options.challenge, "register");
      return Response.json(options);
    }

    // ── REGISTER VERIFY ─────────────────────────────────────
    if (action === "register-verify" && req.method === "POST") {
      const body = await req.json();
      const { response, expectedChallenge, label } = body as any;
      if (!(await consumeChallenge(expectedChallenge, "register"))) {
        return Response.json({ verified: false, error: "challenge-expired" }, { status: 400 });
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return Response.json({ verified: false }, { status: 400 });
      }

      const info: any = verification.registrationInfo;
      const credentialID = info.credential?.id ?? info.credentialID;
      const publicKey = info.credential?.publicKey ?? info.credentialPublicKey;
      const counter = info.credential?.counter ?? info.counter ?? 0;

      await savePasskey({
        credential_id: typeof credentialID === "string" ? credentialID : b64urlFromBuf(credentialID),
        public_key: b64urlFromBuf(publicKey),
        counter,
        transports: response?.response?.transports || ["internal"],
        label: label || "Device",
      });

      const token = await signSession();
      return Response.json({ verified: true, session: token });
    }

    // ── AUTH OPTIONS ────────────────────────────────────────
    if (action === "auth-options" && req.method === "GET") {
      const existing = await listPasskeys();
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
        allowCredentials: existing.map((p: any) => ({
          id: p.credential_id,
          transports: p.transports || ["internal"],
        })),
      });
      await saveChallenge(options.challenge, "auth");
      return Response.json({ ...options, anyRegistered: existing.length > 0 });
    }

    // ── AUTH VERIFY ─────────────────────────────────────────
    if (action === "auth-verify" && req.method === "POST") {
      const body = await req.json();
      const { response, expectedChallenge } = body as any;
      if (!(await consumeChallenge(expectedChallenge, "auth"))) {
        return Response.json({ verified: false, error: "challenge-expired" }, { status: 400 });
      }

      const credentialId = response.id; // base64url
      const passkey = await getPasskey(credentialId);
      if (!passkey) {
        return Response.json({ verified: false, error: "unknown-credential" }, { status: 400 });
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: passkey.credential_id,
          publicKey: bufFromB64url(passkey.public_key),
          counter: passkey.counter,
          transports: passkey.transports,
        },
      });

      if (!verification.verified) {
        return Response.json({ verified: false }, { status: 400 });
      }

      await updatePasskeyCounter(passkey.credential_id, verification.authenticationInfo.newCounter);
      const token = await signSession();
      return Response.json({ verified: true, session: token });
    }

    // ── STATUS (any passkeys registered?) ───────────────────
    if (action === "status" && req.method === "GET") {
      const existing = await listPasskeys();
      return Response.json({ count: existing.length, hasAny: existing.length > 0 });
    }

    return Response.json({ error: "unknown-action", action }, { status: 400 });
  } catch (err: any) {
    return Response.json({ error: err?.message || "unknown" }, { status: 500 });
  }
};

export const config = { path: "/api/passkey" };
