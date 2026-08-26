-- 0002 · the claim structure.
--   psql "$DATABASE_URL" -f supabase/migrations/20260824091500_claims.sql
--
-- Four changes, all of them about where a claim lives:
--   · a citation points at a chapter, and a block may carry more than one
--   · a counterpoint answers a block, not an essay, and carries two steelmen
--   · a contest is one reader marking one block disputed
--   · the lens taxonomy becomes a table you can read, still closed by its enum
--
-- Wrapped in a transaction: it rewrites citations in place, and a half-applied
-- rewrite is worse than none.

set client_encoding = 'UTF8';

begin;

-- ─── lenses ───────────────────────────────────────────────────────────────
-- The enum stays: it is what makes essays.lenses[] and profiles.lenses[] a
-- closed set. The table is the readable half — name and gloss, in reading order.
create table if not exists lenses (
  id       lens primary key,
  name     text not null,
  summary  text not null,
  position int not null unique
);

insert into lenses (id, name, summary, position) values
  ('nietzschean', 'Nietzschean',
   'Value made by an act of will, and what the act costs the one who makes it.', 1),
  ('jungian', 'Jungian',
   'Characters read as parts of one psyche: the shadow, the mask, the figure who refuses the call.', 2),
  ('psychoanalytic', 'Psychoanalytic',
   'Desire and repression, and what a character cannot say about themselves.', 3),
  ('metafictional', 'Metafictional',
   'The work knows it is a work, and behaves differently because of it.', 4),
  ('sociopolitical', 'Sociopolitical',
   'Power, labour, and class as the machinery running under the personal story.', 5),
  ('narratological', 'Narratological',
   'Who is telling it, in what order, and what the telling holds back.', 6)
on conflict (id) do nothing;

-- ─── citations ────────────────────────────────────────────────────────────
-- Was: one citation per block, its place written as free text ('ch. 093').
-- Now: many per block, the place an integer, the quote optional.
--
-- An integer is what makes the three chapter facts comparable — a citation's
-- chapter, a block's covers_from/covers_to, and a reader's position. The
-- display form ('ch. 93', 'ep. 19') is the work's unit_label plus the number,
-- built where it is shown rather than stored twice.
alter table citations drop constraint if exists citations_block_id_key;

alter table citations add column if not exists chapter int;

update citations
   set chapter = coalesce(nullif(regexp_replace(locator, '\D', '', 'g'), '')::int, 1)
 where chapter is null;

alter table citations alter column chapter set not null;
alter table citations drop constraint if exists citations_chapter_positive;
alter table citations add  constraint citations_chapter_positive check (chapter > 0);

-- work_id was optional and denormalised alongside work_title. Backfill by
-- title, then require it. A row that cannot be matched fails the migration
-- loudly rather than being deleted quietly.
update citations c set work_id = w.id
  from works w
 where c.work_id is null and lower(w.title) = lower(c.work_title);

alter table citations alter column work_id set not null;
alter table citations drop constraint if exists citations_work_id_fkey;
alter table citations add  constraint citations_work_id_fkey
  foreign key (work_id) references works on delete cascade;

-- A citation may point at a chapter without quoting it.
alter table citations alter column quote drop not null;
alter table citations drop column if exists work_title;
alter table citations drop column if exists locator;

create index if not exists citations_block_idx on citations (block_id);

-- ─── blocks ───────────────────────────────────────────────────────────────
-- A range needs a start, and it cannot run backwards.
alter table blocks drop constraint if exists blocks_covers_range;
alter table blocks add  constraint blocks_covers_range check (
  covers_to is null or (covers_from is not null and covers_to >= covers_from)
);

-- ─── counterpoints ────────────────────────────────────────────────────────
-- Was: four nullable columns on essays, pointing at a whole essay, with the
-- paragraph named in free text ('paragraph 4') that nothing kept true.
--
-- Now its own row, pointing at the block it answers. The steelman gate is
-- enforced by construction: there is no way to have a counterpoint without
-- both answers, because the row cannot exist without them.
create table if not exists counterpoints (
  id              uuid primary key default gen_random_uuid(),
  -- The essay that IS the rebuttal. One counterpoint per essay.
  essay_id        uuid not null unique references essays on delete cascade,
  -- The paragraph being answered.
  target_block_id uuid not null references blocks on delete cascade,
  -- Steelman one: what the paragraph claims, in the answerer's own words.
  claim           text not null check (char_length(btrim(claim)) between 20 and 320),
  -- Steelman two: the strongest case for that claim, not the weakest.
  strongest       text not null check (char_length(btrim(strongest)) between 20 and 320),
  -- The answered author's verdict, published alongside the counterpoint.
  mark            steelman_mark,
  created_at      timestamptz not null default now()
);

create index if not exists counterpoints_target_idx on counterpoints (target_block_id);

-- Carry across anything the old shape holds. The paragraph is read out of the
-- free text where it names one, and the single summary becomes the first
-- answer; the second cannot be invented, so it starts as the first and the
-- author is shown it to rewrite. Summaries below the gate's floor are left
-- behind rather than admitted at a length the gate would refuse.
insert into counterpoints (essay_id, target_block_id, claim, strongest, mark)
select e.id,
       coalesce(named.id, first_block.id),
       btrim(e.steelman),
       btrim(e.steelman),
       e.steelman_mark
  from essays e
  join lateral (
    select b.id from blocks b
     where b.essay_id = e.answers_essay_id
     order by b.position limit 1
  ) first_block on true
  left join lateral (
    select b.id from blocks b
     where b.essay_id = e.answers_essay_id
       and b.kind = 'paragraph'
       and b.position = nullif(regexp_replace(e.contests, '\D', '', 'g'), '')::int - 1
     limit 1
  ) named on true
 where e.answers_essay_id is not null
   and char_length(btrim(coalesce(e.steelman, ''))) between 20 and 320
on conflict (essay_id) do nothing;

-- The policy reads the column, so it goes before the column does.
drop policy if exists "answered author marks steelman" on essays;
alter table essays drop constraint if exists counterpoint_needs_steelman;
drop index if exists essays_answers_idx;

alter table essays drop column if exists answers_essay_id;
alter table essays drop column if exists contests;
alter table essays drop column if exists steelman;
alter table essays drop column if exists steelman_mark;

-- ─── contests ─────────────────────────────────────────────────────────────
-- One reader, one block, once. The tally is the count of rows; the accent
-- marking in the reader is that count being greater than zero.
create table if not exists contests (
  block_id   uuid not null references blocks on delete cascade,
  user_id    uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (block_id, user_id)
);

create index if not exists contests_user_idx on contests (user_id);

-- ─── row level security ───────────────────────────────────────────────────
alter table lenses       enable row level security;
alter table counterpoints enable row level security;
alter table contests     enable row level security;

drop policy if exists "lenses are public" on lenses;
create policy "lenses are public" on lenses for select using (true);
-- No write policy. The taxonomy grows by migration, deliberately.

drop policy if exists "counterpoints follow their essay" on counterpoints;
create policy "counterpoints follow their essay" on counterpoints for select
  using (exists (
    select 1 from essays e
    where e.id = counterpoints.essay_id
      and (e.status = 'published' or e.author_id = (select auth.uid()))
  ));

drop policy if exists "own counterpoints" on counterpoints;
create policy "own counterpoints" on counterpoints for all
  using (exists (
    select 1 from essays e where e.id = counterpoints.essay_id and e.author_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from essays e where e.id = counterpoints.essay_id and e.author_id = (select auth.uid())
  ));

-- The author of the answered paragraph marks the steelman fair or disputed.
drop policy if exists "answered author marks steelman" on counterpoints;
create policy "answered author marks steelman" on counterpoints for update
  using (exists (
    select 1 from blocks b join essays e on e.id = b.essay_id
    where b.id = counterpoints.target_block_id and e.author_id = (select auth.uid())
  ));

drop policy if exists "contests are public" on contests;
create policy "contests are public" on contests for select using (true);

drop policy if exists "own contest" on contests;
create policy "own contest" on contests for insert
  to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "withdraw own contest" on contests;
create policy "withdraw own contest" on contests for delete
  to authenticated using (user_id = (select auth.uid()));

commit;
