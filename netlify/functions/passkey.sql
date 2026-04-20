-- ==============================================================
-- Passkey / WebAuthn backing tables
-- Run once in Supabase SQL editor.
-- ==============================================================

-- Stored credentials. Single-user dashboard, so no user column.
create table if not exists passkeys (
    id              bigserial primary key,
    credential_id   text unique not null,            -- base64url
    public_key      text not null,                   -- base64url (COSE key bytes)
    counter         bigint not null default 0,
    transports      text[] default array['internal'],
    label           text default 'Device',
    created_at      timestamptz not null default now(),
    last_used_at    timestamptz
);

-- One-time challenges (register + auth). Rows expire after 5 minutes.
create table if not exists passkey_challenges (
    id           bigserial primary key,
    challenge    text unique not null,               -- base64url
    kind         text not null check (kind in ('register', 'auth')),
    expires_at   timestamptz not null,
    created_at   timestamptz not null default now()
);

create index if not exists passkey_challenges_challenge_idx
    on passkey_challenges (challenge);

-- Optional cleanup job (or call periodically from a function):
-- delete from passkey_challenges where expires_at < now();
