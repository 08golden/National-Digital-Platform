-- ============================================================
-- NLDR  |  MIGRATION 006  —  Indigenous Seeds
-- Seeds controlled vocabulary options and Namibian communities.
-- Depends on: 20260425000005_indigenous_tables.sql
-- Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
-- ============================================================

-- ── license ──────────────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('CC-BY-4.0',           'CC BY 4.0 — Attribution',                    0),
    ('CC-BY-SA-4.0',        'CC BY-SA 4.0 — Attribution ShareAlike',       1),
    ('CC-BY-NC-4.0',        'CC BY-NC 4.0 — Non-Commercial',               2),
    ('CC-BY-NC-SA-4.0',     'CC BY-NC-SA 4.0 — Non-Commercial ShareAlike', 3),
    ('CC-BY-ND-4.0',        'CC BY-ND 4.0 — No Derivatives',               4),
    ('CC0-1.0',             'CC0 1.0 — Public Domain',                     5),
    ('TK-Community-Only',   'TK Community Only',                           6),
    ('TK-Seasonal',         'TK Seasonal',                                 7),
    ('TK-Secret-Sacred',    'TK Secret / Sacred (no external access)',      8),
    ('All-Rights-Reserved', 'All Rights Reserved',                         9),
    ('custom',              'Custom — see access notes',                   10)
) AS opts(value, label, ord)
WHERE mf.field_key = 'license'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── visibility ───────────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('public',     'Public — visible to everyone',                0),
    ('restricted', 'Restricted — authenticated users only',       1),
    ('private',    'Private — contributor and admins only',       2),
    ('embargoed',  'Embargoed — hidden until a set date',         3)
) AS opts(value, label, ord)
WHERE mf.field_key = 'visibility'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── cultural_sensitivity ─────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('open',          'Open — no cultural restrictions',                    0),
    ('low',           'Low — minor sensitivity',                            1),
    ('medium',        'Medium — researcher access only',                    2),
    ('high',          'High — community members only',                      3),
    ('secret_sacred', 'Secret / Sacred — community authority controls access', 4)
) AS opts(value, label, ord)
WHERE mf.field_key = 'cultural_sensitivity'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── community_consent ────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('consented',    'Consented — community approved deposit',    0),
    ('pending',      'Pending — awaiting community approval',     1),
    ('restricted',   'Restricted — community has applied restrictions', 2),
    ('not_required', 'Not Required — no affiliated community',   3)
) AS opts(value, label, ord)
WHERE mf.field_key = 'community_consent'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── tk_label_codes ───────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('TK-Attribution',        'TK Attribution',         0),
    ('TK-Clan',               'TK Clan',                1),
    ('TK-Family',             'TK Family',              2),
    ('TK-Community-Voice',    'TK Community Voice',     3),
    ('TK-Creative',           'TK Creative',            4),
    ('TK-Verified',           'TK Verified',            5),
    ('TK-Non-Verified',       'TK Non-Verified',        6),
    ('TK-Seasonal',           'TK Seasonal',            7),
    ('TK-Women-General',      'TK Women General',       8),
    ('TK-Men-General',        'TK Men General',         9),
    ('TK-Secret-Sacred',      'TK Secret / Sacred',    10),
    ('TK-Open',               'TK Open',               11),
    ('BC-Provenance',         'BC Provenance',         12),
    ('BC-Multiple-Community', 'BC Multiple Community', 13),
    ('BC-Research',           'BC Research',           14),
    ('BC-Commercialization',  'BC Commercialization',  15),
    ('BC-Consent-Verified',   'BC Consent Verified',   16),
    ('BC-Open',               'BC Open',               17)
) AS opts(value, label, ord)
WHERE mf.field_key = 'tk_label_codes'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── recording_context ────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('field',      'Field Recording',                0),
    ('studio',     'Studio Recording',               1),
    ('home',       'Home / Informal Setting',        2),
    ('community',  'Community Event / Gathering',    3),
    ('ceremonial', 'Ceremonial Context',             4),
    ('online',     'Online / Remote Recording',      5),
    ('elicited',   'Elicited / Structured Session',  6)
) AS opts(value, label, ord)
WHERE mf.field_key = 'recording_context'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── discourse_type ───────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('narrative',         'Narrative / Story',                  0),
    ('personal_history',  'Personal History / Oral Biography',  1),
    ('oral_tradition',    'Oral Tradition / Folklore',          2),
    ('procedural',        'Procedural Text (how-to)',           3),
    ('conversation',      'Spontaneous Conversation',           4),
    ('interview',         'Interview',                         5),
    ('song',              'Song',                               6),
    ('ceremonial_speech', 'Ceremonial Speech / Prayer',         7),
    ('wordlist',          'Word List / Elicitation',            8),
    ('language_lesson',   'Language Teaching / Lesson',         9),
    ('proverb',           'Proverbs / Idioms',                 10),
    ('description',       'Description / Monologue',           11),
    ('other',             'Other',                             12)
) AS opts(value, label, ord)
WHERE mf.field_key = 'discourse_type'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── linguistic_type ──────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('primary_text',           'Primary Text',                  0),
    ('lexicon',                'Lexicon / Dictionary',          1),
    ('language_description',   'Language Description / Grammar',2),
    ('language_documentation', 'Language Documentation',        3),
    ('annotation',             'Annotation / Transcription',    4)
) AS opts(value, label, ord)
WHERE mf.field_key = 'linguistic_type'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── speaker_proficiency ──────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('fluent_elder',    'Fluent Elder (first-language, high competence)', 0),
    ('fluent_adult',    'Fluent Adult (first-language)',                  1),
    ('semi_speaker',    'Semi-speaker (partial competence)',              2),
    ('heritage',        'Heritage / Home Speaker',                       3),
    ('learner',         'Language Learner',                              4),
    ('second_language', 'Second-Language Speaker',                       5),
    ('unknown',         'Unknown',                                       6)
) AS opts(value, label, ord)
WHERE mf.field_key = 'speaker_proficiency'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── speaker_generation ───────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('elder', 'Elder (60+)',      0),
    ('adult', 'Adult (30-59)',    1),
    ('youth', 'Youth (15-29)',    2),
    ('child', 'Child (under 15)', 3)
) AS opts(value, label, ord)
WHERE mf.field_key = 'speaker_generation'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── speaker_gender ───────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('female',     'Female',           0),
    ('male',       'Male',             1),
    ('non_binary', 'Non-binary',       2),
    ('prefer_not', 'Prefer not to say',3),
    ('unknown',    'Unknown',          4)
) AS opts(value, label, ord)
WHERE mf.field_key = 'speaker_gender'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── speaker_age_range ────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('0-14',   '0-14',   0),
    ('15-29',  '15-29',  1),
    ('30-44',  '30-44',  2),
    ('45-59',  '45-59',  3),
    ('60-74',  '60-74',  4),
    ('75+',    '75+',    5),
    ('unknown','Unknown', 6)
) AS opts(value, label, ord)
WHERE mf.field_key = 'speaker_age_range'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── recording_quality ────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('excellent', 'Excellent — broadcast quality',       0),
    ('good',      'Good — clear speech throughout',      1),
    ('fair',      'Fair — some audio issues',            2),
    ('poor',      'Poor — significant degradation',      3)
) AS opts(value, label, ord)
WHERE mf.field_key = 'recording_quality'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── background_noise ─────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('none',        'None',         0),
    ('minimal',     'Minimal',      1),
    ('moderate',    'Moderate',     2),
    ('significant', 'Significant',  3)
) AS opts(value, label, ord)
WHERE mf.field_key = 'background_noise'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── file_format ──────────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('wav',  'WAV',          0),
    ('mp3',  'MP3',          1),
    ('flac', 'FLAC',         2),
    ('aac',  'AAC',          3),
    ('ogg',  'OGG',          4),
    ('mp4',  'MP4 (video)',  5),
    ('mov',  'MOV (video)',  6),
    ('webm', 'WebM (video)', 7)
) AS opts(value, label, ord)
WHERE mf.field_key = 'file_format'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── original_format ──────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('cassette',     'Cassette Tape',                  0),
    ('reel',         'Reel-to-Reel Tape',              1),
    ('dat',          'DAT (Digital Audio Tape)',        2),
    ('minidisc',     'MiniDisc',                       3),
    ('vinyl',        'Vinyl Record',                   4),
    ('vhs',          'VHS Tape',                       5),
    ('cd',           'CD / CD-ROM',                    6),
    ('born_digital', 'Born Digital (no analogue original)', 7)
) AS opts(value, label, ord)
WHERE mf.field_key = 'original_format'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── topics ───────────────────────────────────────────────────
INSERT INTO public.metadata_field_options (field_id, value, label, display_order)
SELECT mf.id, opts.value, opts.label, opts.ord
FROM   public.metadata_fields mf
CROSS JOIN (VALUES
    ('greetings',      'Greetings & Farewells',    0),
    ('kinship',        'Kinship & Family',          1),
    ('food',           'Food & Cooking',            2),
    ('nature',         'Nature & Environment',      3),
    ('animals',        'Animals',                   4),
    ('plants',         'Plants & Gathering',        5),
    ('body',           'Body & Health',             6),
    ('spirituality',   'Spirituality & Ceremony',   7),
    ('history',        'History & Memory',          8),
    ('land',           'Land & Territory',          9),
    ('law_governance', 'Law & Governance',         10),
    ('arts_crafts',    'Arts & Crafts',            11),
    ('music_dance',    'Music & Dance',            12),
    ('games',          'Games & Recreation',       13),
    ('trade',          'Trade & Economy',          14),
    ('education',      'Education & Knowledge',    15),
    ('migration',      'Migration & Movement',     16),
    ('numbers',        'Numbers & Counting',       17),
    ('time',           'Time & Calendar',          18),
    ('weather',        'Weather & Seasons',        19),
    ('proverbs',       'Proverbs & Idioms',        20),
    ('other',          'Other',                    21)
) AS opts(value, label, ord)
WHERE mf.field_key = 'topics'
ON CONFLICT (field_id, value) DO NOTHING;

-- ── Seed: Namibian indigenous communities ────────────────────
INSERT INTO public.communities
    (name, local_name, country, region, traditional_territory, metadata)
VALUES
  ('Ju|''hoansi San', 'Ju|''hoansi', 'NA', 'Otjozondjupa / Kavango', 'Nyae Nyae',
   '{"alternate_names":["!Kung","Bushmen"]}'::JSONB),

  ('Hai||om San',     'Hai||om',     'NA', 'Kunene / Oshikoto',      'Etosha region',
   '{}'::JSONB),

  ('Naro San',        'Naro',        'NA', 'Omaheke',                'Ghanzi region',
   '{"alternate_names":["Nharo"]}'::JSONB),

  ('Nama',            'Khoekhoegowab','NA','Hardap / ||Kharas',      'Namaland',
   '{"alternate_names":["Namaqua"]}'::JSONB),

  ('Damara',          'Nukhoen',     'NA', 'Kunene / Erongo',        'Damaraland',
   '{"alternate_names":["Nukhoen"]}'::JSONB),

  ('Himba',           'Himba',       'NA', 'Kunene',                 'Kaokoland',
   '{}'::JSONB),

  ('Herero',          'Otjiherero',  'NA', 'Otjozondjupa / Omaheke', 'Hereroland',
   '{}'::JSONB),

  ('Aawambo (Ovambo)','Aawambo',     'NA', 'Oshana / Oshikoto / Omusati', 'Owamboland',
   '{"alternate_names":["Ovambo"],"dialects":["Aandonga","Aakwanyama","Aangandjera"]}'::JSONB),

  ('Kavango peoples', NULL,          'NA', 'Kavango East / West',    'Kavangoland',
   '{"dialects":["Gciriku","Mbukushu","RuKwangali","Shambyu"]}'::JSONB),

  ('Zambezi peoples', NULL,          'NA', 'Zambezi',                'Caprivi Strip',
   '{"alternate_names":["Caprivi peoples"],"dialects":["Lozi","Fwe","Yeyi","Subiya","Mafwe"]}'::JSONB),

  ('Baster',          'Basters',     'NA', 'Hardap',                 'Rehoboth',
   '{"note":"Afrikaner-Nama heritage community"}'::JSONB),

  ('Tswana',          'Setswana',    'NA', 'Omaheke',                NULL,
   '{}'::JSONB)

ON CONFLICT DO NOTHING;