-- Sample content, so an empty project has something to argue about.
--   psql "$DATABASE_URL" -f supabase/seed.sql
-- Inserts three writers straight into auth.users; the on_auth_user_created
-- trigger builds their profiles. Safe to run once on a fresh database.

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated',
   'authenticated', 'ines@kovac.st', '', now(), now(), now(), '{"provider":"email"}',
   '{"full_name":"Ines Kovač"}'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated',
   'authenticated', 'tomas@iriarte.ar', '', now(), now(), now(), '{"provider":"email"}',
   '{"full_name":"Tomás Iriarte"}'),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated',
   'authenticated', 'wren@adeyemi.ng', '', now(), now(), now(), '{"provider":"email"}',
   '{"full_name":"Wren Adeyemi"}')
on conflict (id) do nothing;

update profiles set
  bio = 'Writes mostly on serialised manga and on the problem of judging characters whose stories are unfinished. Reads Nietzsche as a novelist and says so.',
  lenses = '{nietzschean,narratological}'
where id = '11111111-1111-4111-8111-111111111111';

update profiles set bio = 'Psychoanalytic readings, mostly of people who would refuse the diagnosis.'
where id = '22222222-2222-4222-8222-222222222222';

update profiles set bio = 'Structure first. If the telling is doing something the told is not, that is the essay.'
where id = '33333333-3333-4333-8333-333333333333';

-- ─── works ────────────────────────────────────────────────────────────────
insert into works (id, slug, title, creator, medium, year, unit_label, unit_count) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'berserk', 'Berserk', 'Kentaro Miura', 'manga', 1989, 'chapters', 551),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'moby-dick', 'Moby-Dick', 'Herman Melville', 'novel', 1851, 'chapters', 135),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'neon-genesis-evangelion', 'Neon Genesis Evangelion', 'Hideaki Anno', 'anime', 1995, 'episodes', 26)
on conflict (id) do nothing;

-- ─── characters ───────────────────────────────────────────────────────────
insert into characters (id, slug, name, work_id, description, created_by) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'griffith-berserk', 'Griffith',
   'aaaaaaaa-0000-4000-8000-000000000001',
   'The founder and commander of the Band of the Hawk. The Golden Age arc follows his rise from mercenary captain toward a title.',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'casca-berserk', 'Casca',
   'aaaaaaaa-0000-4000-8000-000000000001',
   'A commander in the Band of the Hawk, and the only member of it whose service predates the band itself.',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'ahab-moby-dick', 'Ahab',
   'aaaaaaaa-0000-4000-8000-000000000002',
   'Captain of the Pequod. He states his purpose to the crew in the first hundred pages and does not restate it.',
   '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'shinji-ikari-evangelion', 'Shinji Ikari',
   'aaaaaaaa-0000-4000-8000-000000000003',
   'The third child, conscripted to pilot Unit 01. Most of the series turns on what he agrees to and what he refuses.',
   '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

-- ─── the founding essay ───────────────────────────────────────────────────
insert into essays (id, slug, author_id, character_id, title, thesis, lenses, spoiler_level,
                    status, reading_minutes, published_at) values
  ('cccccccc-0000-4000-8000-000000000001', 'the-hawk-was-always-a-ladder',
   '11111111-1111-4111-8111-111111111111', 'bbbbbbbb-0000-4000-8000-000000000001',
   'The Hawk Was Always a Ladder',
   'Griffith''s ascent is not a betrayal of the Band of the Hawk but the fulfilment of the logic that founded it.',
   '{nietzschean,narratological}', 'arc', 'published', 14, now() - interval '12 days')
on conflict (id) do nothing;

insert into blocks (id, essay_id, position, kind, claim_kind, body, margin_note, covers_from, covers_to) values
  ('dddddddd-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 0, 'paragraph', 'textual',
   'Readers arriving at the Golden Age arc tend to describe the Band of the Hawk as a family, and Griffith''s rise as the thing that breaks it. The arc itself is more careful than that. In every scene where Griffith explains what he wants, he speaks of the castle, the kingdom, the position — and of the men around him as the means by which those are reached. He is generous, he is present, he grieves the dead by name. He never once describes the band as an end in itself.',
   null, null, null),
  ('dddddddd-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000001', 1, 'paragraph', 'interpretive',
   'That distinction is the engine of the whole arc. A story about a good man corrupted by ambition needs a moment of turning, a scene a reader can point to. Berserk declines to supply one, and the absence is not an oversight. What we are shown instead is a consistent instrument used consistently, at rising cost, by someone who announced at the outset what he intended to spend.',
   null, null, null),
  ('dddddddd-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000001', 2, 'paragraph', 'textual',
   'The band knows it, too. Judeau''s reading is the clearest in the text: he treats his own position as contingent, notices when it is threatened, and says so to Casca rather than to Griffith. Casca''s loyalty is framed as debt, not kinship. Rickert is kept from the front line by an accident of age, not a promise. Nobody in the Hawks behaves as though membership were permanent.',
   'Judeau says this to Casca, never to Griffith. The choice of listener is the point.', null, null),
  ('dddddddd-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000001', 3, 'paragraph', 'interpretive',
   'Griffith''s own definition of friendship — offered once, never revised — is the arc''s load-bearing line: a friend is someone who does not depend on him, who has a dream of their own and pursues it. By that definition the Band of the Hawk contains no friends at all. It contains followers, and it contains one man who is beginning to want something.',
   null, null, null),
  ('dddddddd-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000001', 4, 'heading', 'interpretive',
   'The night that changed nothing', null, null, null),
  ('dddddddd-0000-4000-8000-000000000006', 'cccccccc-0000-4000-8000-000000000001', 5, 'paragraph', 'textual',
   'The Eclipse is usually read as a reversal. Structurally it is a repetition: the same transaction the arc has staged a dozen times, at the only scale it had left to stage it. What changes is not Griffith''s relation to the band but the reader''s ability to describe that relation in ordinary language. He is asked for what he has always been willing to give, and he gives it.',
   null, 297, 301),
  ('dddddddd-0000-4000-8000-000000000007', 'cccccccc-0000-4000-8000-000000000001', 6, 'paragraph', 'interpretive',
   'Rickert''s refusal at the close of the arc is the only judgement the text passes in its own voice, and it is delivered by the character with the least standing to deliver it. The arc gives the verdict to the person who was kept safe.',
   null, 305, 305),
  ('dddddddd-0000-4000-8000-000000000008', 'cccccccc-0000-4000-8000-000000000001', 7, 'paragraph', 'speculative',
   'This is likely why the arc survives rereading better than almost anything else in the medium, and why arguments about it never resolve. A story of corruption is finished once you locate the fall. A story about a premise carried to its end has no such exit. Every early scene of warmth becomes evidence, and readers who felt that warmth first will not accept being told it was cover — which it wasn''t. It was warmth, sincerely offered, by someone who had already decided what it was for.',
   null, null, null)
on conflict (id) do nothing;

insert into citations (block_id, work_id, work_title, locator, quote) values
  ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Berserk', 'ch. 093',
   'A friend is not someone who follows me. It is someone who has a dream of his own.'),
  ('dddddddd-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'Berserk', 'ch. 106',
   'I know my place here is not permanent.'),
  ('dddddddd-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000001', 'Berserk', 'ch. 297–301',
   'Everything I have done, I have done for this.')
on conflict (block_id) do nothing;

-- ─── two counterpoints, each through the steelman gate ───────────────────
insert into essays (id, slug, author_id, character_id, title, thesis, lenses, spoiler_level, status,
                    reading_minutes, published_at, answers_essay_id, contests, steelman, steelman_mark) values
  ('cccccccc-0000-4000-8000-000000000002', 'warmth-is-not-evidence',
   '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Warmth Is Not Evidence',
   'Reading Griffith''s affection as instrumentation requires ignoring the scenes where he has nothing to gain.',
   '{psychoanalytic}', 'arc', 'published', 11, now() - interval '6 days',
   'cccccccc-0000-4000-8000-000000000001', 'paragraph 4',
   'Kovač argues that the band was never an end for Griffith, so the Eclipse introduces no new intention. The reading rests on his own definition of friendship, which excludes anyone who depends on him.',
   'fair'),
  ('cccccccc-0000-4000-8000-000000000003', 'late-evidence',
   '33333333-3333-4333-8333-333333333333', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Late Evidence',
   'Instrumental language in the Golden Age arc is retrospective: it clusters in scenes drawn after the Eclipse was already fixed.',
   '{narratological}', 'full', 'published', 9, now() - interval '2 days',
   'cccccccc-0000-4000-8000-000000000001', 'thesis',
   'Kovač reads the arc as one continuous intention, with the Eclipse as its largest instance rather than its turn. The evidence is the consistency of Griffith''s stated aims across the whole arc.',
   null)
on conflict (id) do nothing;

insert into blocks (essay_id, position, kind, claim_kind, body) values
  ('cccccccc-0000-4000-8000-000000000002', 0, 'paragraph', 'interpretive',
   'The scenes that carry Kovač''s reading are the ones where Griffith is being watched. The ones that undercut it are the ones where he is not: the night after Zodd, the hours in the tent with Casca, the long silence after Judeau''s death. In none of them is there an audience whose regard he could be buying.'),
  ('cccccccc-0000-4000-8000-000000000002', 1, 'paragraph', 'speculative',
   'A man who wanted only the ladder would have grieved more efficiently. Grief that serves nothing is the least instrumental thing a character can do, and Berserk gives him several pages of it.'),
  ('cccccccc-0000-4000-8000-000000000003', 0, 'paragraph', 'interpretive',
   'Kovač''s evidence is real but unevenly distributed. Sort the instrumental lines by publication order and they land almost entirely after the arc''s midpoint, which is consistent with a late reframing rather than a founding logic.'),
  ('cccccccc-0000-4000-8000-000000000003', 1, 'paragraph', 'interpretive',
   'That distinction matters because it changes what the reader is asked to have missed. Under her reading we were inattentive; under mine we were reading a character who had not yet been decided.')
on conflict do nothing;

insert into revisions (essay_id, prompted_by_essay_id, note) values
  ('cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000002',
   'Narrowed the friendship paragraph: the definition is Griffith''s, not the essay''s.'),
  ('cccccccc-0000-4000-8000-000000000001', null,
   'Added the Judeau margin note and corrected a chapter reference.');

update blocks set revised_after_essay_id = 'cccccccc-0000-4000-8000-000000000002'
where id = 'dddddddd-0000-4000-8000-000000000004';

-- ─── the claim ledger ─────────────────────────────────────────────────────
insert into claims (id, character_id, text, work_title, locator) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Griffith never describes the Band of the Hawk as an end in itself.', 'Berserk', 'vols. 3–13'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001',
   'The Eclipse is a repetition, not a reversal.', 'Berserk', 'ch. 297–301'),
  ('eeeeeeee-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Griffith defines a friend as someone who does not depend on him.', 'Berserk', 'ch. 093'),
  ('eeeeeeee-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Judeau states that his position is contingent to Casca, and never to Griffith.', 'Berserk', 'ch. 106'),
  ('eeeeeeee-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Casca''s loyalty is framed as debt rather than kinship.', 'Berserk', 'ch. 073'),
  ('eeeeeeee-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000001',
   'Rickert is kept from the front line by age, not by promise.', 'Berserk', 'ch. 118')
on conflict (id) do nothing;

insert into claim_links (claim_id, essay_id, stance) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'supporting'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000001', 'supporting'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000003', 'contesting'),
  ('eeeeeeee-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000001', 'supporting'),
  ('eeeeeeee-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000002', 'contesting'),
  ('eeeeeeee-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000001', 'supporting'),
  ('eeeeeeee-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000002', 'contesting'),
  ('eeeeeeee-0000-4000-8000-000000000006', 'cccccccc-0000-4000-8000-000000000001', 'supporting')
on conflict do nothing;

commit;
