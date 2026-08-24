-- Lensa schema. Run against a fresh Supabase project:
--   psql "$DATABASE_URL" -f supabase/schema.sql
-- Auth is magic link only; auth.users is Supabase's.

create extension if not exists pgcrypto;

-- ─── enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type claim_kind as enum ('textual', 'interpretive', 'speculative');
exception when duplicate_object then null; end $$;

do $$ begin
  create type spoiler_level as enum ('none', 'arc', 'full', 'adaptations');
exception when duplicate_object then null; end $$;

do $$ begin
  create type medium as enum ('novel', 'manga', 'anime', 'film', 'series', 'game');
exception when duplicate_object then null; end $$;

do $$ begin
  create type essay_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type steelman_mark as enum ('fair', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stance as enum ('supporting', 'contesting');
exception when duplicate_object then null; end $$;

-- The taxonomy is closed. Adding a lens is a migration, deliberately.
do $$ begin
  create type lens as enum (
    'nietzschean', 'jungian', 'psychoanalytic',
    'metafictional', 'sociopolitical', 'narratological'
  );
exception when duplicate_object then null; end $$;

-- ─── people ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  handle        text unique not null,
  display_name  text not null,
  bio           text,
  lenses        lens[] not null default '{}',
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ─── works and characters ────────────────────────────────────────────────
create table if not exists works (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  creator     text,
  medium      medium not null,
  year        int,
  unit_label  text not null default 'chapters',   -- chapters | episodes | parts
  unit_count  int,
  created_by  uuid references profiles on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists characters (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  work_id      uuid not null references works on delete cascade,
  -- A container for arguments, not a wiki entry: two neutral sentences.
  description  text check (description is null or char_length(description) <= 220),
  portrait_url text,
  created_by   uuid references profiles on delete set null,
  created_at   timestamptz not null default now(),
  unique (name, work_id)
);

create index if not exists characters_work_idx on characters (work_id);

-- ─── essays ───────────────────────────────────────────────────────────────
create table if not exists essays (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique,
  author_id        uuid not null references profiles on delete cascade,
  character_id     uuid not null references characters on delete cascade,
  title            text,
  -- One sentence. The application refuses a second rather than truncating.
  thesis           text check (thesis is null or char_length(thesis) <= 180),
  lenses           lens[] not null default '{}' check (array_length(lenses, 1) is null or array_length(lenses, 1) <= 2),
  spoiler_level    spoiler_level not null default 'none',
  status           essay_status not null default 'draft',
  reading_minutes  int,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- counterpoint
  answers_essay_id uuid references essays on delete set null,
  contests         text,               -- 'thesis' | 'paragraph 4'
  steelman         text check (steelman is null or char_length(steelman) <= 320),
  steelman_mark    steelman_mark,

  -- The steelman gate: a counterpoint may not publish without one.
  constraint counterpoint_needs_steelman check (
    answers_essay_id is null
    or status = 'draft'
    or (steelman is not null and char_length(btrim(steelman)) > 0)
  ),
  constraint published_needs_thesis check (
    status = 'draft' or (thesis is not null and title is not null and slug is not null)
  )
);

create index if not exists essays_feed_idx on essays (status, published_at desc);
create index if not exists essays_character_idx on essays (character_id);
create index if not exists essays_author_idx on essays (author_id);
create index if not exists essays_answers_idx on essays (answers_essay_id);

create table if not exists blocks (
  id                     uuid primary key default gen_random_uuid(),
  essay_id               uuid not null references essays on delete cascade,
  position               int not null,
  kind                   text not null default 'paragraph' check (kind in ('paragraph', 'heading')),
  claim_kind             claim_kind not null default 'interpretive',
  body                   text not null default '',
  margin_note            text,
  -- The chapter range this block gives away, stated before you decide to see it.
  covers_from            int,
  covers_to              int,
  revised_after_essay_id uuid references essays on delete set null,
  unique (essay_id, position)
);

create index if not exists blocks_essay_idx on blocks (essay_id, position);

-- A citation attaches to a paragraph, not to an essay, so the cost of an
-- unsupported paragraph falls on that paragraph alone.
create table if not exists citations (
  id         uuid primary key default gen_random_uuid(),
  block_id   uuid not null unique references blocks on delete cascade,
  work_id    uuid references works on delete set null,
  work_title text not null,
  locator    text not null,                -- 'ch. 093', 'ep. 19'. Never a page number.
  quote      text not null check (char_length(quote) <= 200),
  created_at timestamptz not null default now()
);

-- ─── the claim ledger ─────────────────────────────────────────────────────
-- Textual claims only. A ledger is useful only if its entries can be checked.
create table if not exists claims (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters on delete cascade,
  text         text not null,
  work_title   text not null,
  locator      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists claims_character_idx on claims (character_id);

create table if not exists claim_links (
  claim_id uuid not null references claims on delete cascade,
  essay_id uuid not null references essays on delete cascade,
  stance   stance not null,
  primary key (claim_id, essay_id)
);

create or replace view claim_tallies as
select
  c.id,
  c.character_id,
  c.text,
  c.work_title,
  c.locator,
  count(*) filter (where l.stance = 'supporting')::int as supporting,
  count(*) filter (where l.stance = 'contesting')::int as contesting
from claims c
left join claim_links l on l.claim_id = c.id
group by c.id;

-- ─── reading position and revisions ──────────────────────────────────────
create table if not exists reading_progress (
  user_id  uuid not null references profiles on delete cascade,
  work_id  uuid not null references works on delete cascade,
  position int not null default 0 check (position >= 0),
  primary key (user_id, work_id)
);

create table if not exists revisions (
  id                     uuid primary key default gen_random_uuid(),
  essay_id               uuid not null references essays on delete cascade,
  prompted_by_essay_id   uuid references essays on delete set null,
  note                   text not null,
  created_at             timestamptz not null default now()
);

create index if not exists revisions_essay_idx on revisions (essay_id, created_at desc);

-- ─── profile bootstrap ───────────────────────────────────────────────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base text := regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]+', '-', 'gi');
  candidate text := lower(base);
  n int := 0;
begin
  while exists (select 1 from profiles where handle = candidate) loop
    n := n + 1;
    candidate := lower(base) || '-' || n::text;
  end loop;

  insert into profiles (id, handle, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'full_name', candidate));

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── row level security ──────────────────────────────────────────────────
alter table profiles         enable row level security;
alter table works            enable row level security;
alter table characters       enable row level security;
alter table essays           enable row level security;
alter table blocks           enable row level security;
alter table citations        enable row level security;
alter table claims           enable row level security;
alter table claim_links      enable row level security;
alter table reading_progress enable row level security;
alter table revisions        enable row level security;

-- Reading needs no account.
create policy "profiles are public"   on profiles   for select using (true);
create policy "works are public"      on works      for select using (true);
create policy "characters are public" on characters for select using (true);
create policy "claims are public"     on claims     for select using (true);
create policy "claim links public"    on claim_links for select using (true);
create policy "revisions are public"  on revisions  for select using (true);

-- Drafts stay private.
create policy "published essays are public" on essays for select
  using (status = 'published' or author_id = (select auth.uid()));

create policy "blocks follow their essay" on blocks for select
  using (exists (
    select 1 from essays e
    where e.id = blocks.essay_id
      and (e.status = 'published' or e.author_id = (select auth.uid()))
  ));

create policy "citations follow their block" on citations for select
  using (exists (
    select 1 from blocks b join essays e on e.id = b.essay_id
    where b.id = citations.block_id
      and (e.status = 'published' or e.author_id = (select auth.uid()))
  ));

-- Writing does.
create policy "own profile" on profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "signed in may add works" on works for insert
  to authenticated with check (created_by = (select auth.uid()));

create policy "signed in may add characters" on characters for insert
  to authenticated with check (created_by = (select auth.uid()));

create policy "own essays" on essays for all
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

create policy "own blocks" on blocks for all
  using (exists (select 1 from essays e where e.id = blocks.essay_id and e.author_id = (select auth.uid())))
  with check (exists (select 1 from essays e where e.id = blocks.essay_id and e.author_id = (select auth.uid())));

create policy "own citations" on citations for all
  using (exists (
    select 1 from blocks b join essays e on e.id = b.essay_id
    where b.id = citations.block_id and e.author_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from blocks b join essays e on e.id = b.essay_id
    where b.id = citations.block_id and e.author_id = (select auth.uid())
  ));

create policy "own reading position" on reading_progress for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- The author of the answered essay marks the steelman fair or disputed.
create policy "answered author marks steelman" on essays for update
  using (exists (
    select 1 from essays original
    where original.id = essays.answers_essay_id
      and original.author_id = (select auth.uid())
  ));
