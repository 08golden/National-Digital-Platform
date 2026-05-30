-- ============================================================
-- NLDR  |  MIGRATION 006  —  Indigenous Seeds
-- Seeds controlled vocabulary options and Namibian communities.
-- Depends on: 20260425000005_indigenous_tables.sql
-- Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
-- ============================================================

DO $$
DECLARE
    fid UUID;

    -- Inserts options for the field identified by p_key
    PROCEDURE seed_options(p_key TEXT, p_options JSONB) AS $$
    DECLARE
        opt JSONB;
        i   INTEGER := 0;
    BEGIN
        SELECT id INTO fid FROM public.metadata_fields WHERE field_key = p_key;
        IF fid IS NULL THEN
            RAISE NOTICE 'metadata_field not found for key: %', p_key;
            RETURN;
        END IF;
        FOR opt IN SELECT * FROM jsonb_array_elements(p_options) LOOP
            INSERT INTO public.metadata_field_options
                (field_id, value, label, display_order)
            VALUES (fid, opt->>'value', opt->>'label', i)
            ON CONFLICT (field_id, value) DO NOTHING;
            i := i + 1;
        END LOOP;
    END;

BEGIN

    -- ── license ──────────────────────────────────────────────
    CALL seed_options('license', '[
        {"value":"CC-BY-4.0",           "label":"CC BY 4.0 — Attribution"},
        {"value":"CC-BY-SA-4.0",        "label":"CC BY-SA 4.0 — Attribution ShareAlike"},
        {"value":"CC-BY-NC-4.0",        "label":"CC BY-NC 4.0 — Non-Commercial"},
        {"value":"CC-BY-NC-SA-4.0",     "label":"CC BY-NC-SA 4.0 — Non-Commercial ShareAlike"},
        {"value":"CC-BY-ND-4.0",        "label":"CC BY-ND 4.0 — No Derivatives"},
        {"value":"CC0-1.0",             "label":"CC0 1.0 — Public Domain"},
        {"value":"TK-Community-Only",   "label":"TK Community Only"},
        {"value":"TK-Seasonal",         "label":"TK Seasonal"},
        {"value":"TK-Secret-Sacred",    "label":"TK Secret / Sacred (no external access)"},
        {"value":"All-Rights-Reserved", "label":"All Rights Reserved"},
        {"value":"custom",              "label":"Custom — see access notes"}
    ]');

    -- ── visibility ───────────────────────────────────────────
    CALL seed_options('visibility', '[
        {"value":"public",      "label":"Public — visible to everyone"},
        {"value":"restricted",  "label":"Restricted — authenticated users only"},
        {"value":"private",     "label":"Private — contributor and admins only"},
        {"value":"embargoed",   "label":"Embargoed — hidden until a set date"}
    ]');

    -- ── cultural_sensitivity ─────────────────────────────────
    CALL seed_options('cultural_sensitivity', '[
        {"value":"open",          "label":"Open — no cultural restrictions"},
        {"value":"low",           "label":"Low — minor sensitivity"},
        {"value":"medium",        "label":"Medium — researcher access only"},
        {"value":"high",          "label":"High — community members only"},
        {"value":"secret_sacred", "label":"Secret / Sacred — community authority controls access"}
    ]');

    -- ── community_consent ────────────────────────────────────
    CALL seed_options('community_consent', '[
        {"value":"consented",    "label":"Consented — community approved deposit"},
        {"value":"pending",      "label":"Pending — awaiting community approval"},
        {"value":"restricted",   "label":"Restricted — community has applied restrictions"},
        {"value":"not_required", "label":"Not Required — no affiliated community"}
    ]');

    -- ── tk_label_codes ───────────────────────────────────────
    CALL seed_options('tk_label_codes', '[
        {"value":"TK-Attribution",        "label":"TK Attribution"},
        {"value":"TK-Clan",               "label":"TK Clan"},
        {"value":"TK-Family",             "label":"TK Family"},
        {"value":"TK-Community-Voice",    "label":"TK Community Voice"},
        {"value":"TK-Creative",           "label":"TK Creative"},
        {"value":"TK-Verified",           "label":"TK Verified"},
        {"value":"TK-Non-Verified",       "label":"TK Non-Verified"},
        {"value":"TK-Seasonal",           "label":"TK Seasonal"},
        {"value":"TK-Women-General",      "label":"TK Women General"},
        {"value":"TK-Men-General",        "label":"TK Men General"},
        {"value":"TK-Secret-Sacred",      "label":"TK Secret / Sacred"},
        {"value":"TK-Open",               "label":"TK Open"},
        {"value":"BC-Provenance",         "label":"BC Provenance"},
        {"value":"BC-Multiple-Community", "label":"BC Multiple Community"},
        {"value":"BC-Research",           "label":"BC Research"},
        {"value":"BC-Commercialization",  "label":"BC Commercialization"},
        {"value":"BC-Consent-Verified",   "label":"BC Consent Verified"},
        {"value":"BC-Open",               "label":"BC Open"}
    ]');

    -- ── recording_context ────────────────────────────────────
    CALL seed_options('recording_context', '[
        {"value":"field",      "label":"Field Recording"},
        {"value":"studio",     "label":"Studio Recording"},
        {"value":"home",       "label":"Home / Informal Setting"},
        {"value":"community",  "label":"Community Event / Gathering"},
        {"value":"ceremonial", "label":"Ceremonial Context"},
        {"value":"online",     "label":"Online / Remote Recording"},
        {"value":"elicited",   "label":"Elicited / Structured Session"}
    ]');

    -- ── discourse_type ───────────────────────────────────────
    CALL seed_options('discourse_type', '[
        {"value":"narrative",         "label":"Narrative / Story"},
        {"value":"personal_history",  "label":"Personal History / Oral Biography"},
        {"value":"oral_tradition",    "label":"Oral Tradition / Folklore"},
        {"value":"procedural",        "label":"Procedural Text (how-to)"},
        {"value":"conversation",      "label":"Spontaneous Conversation"},
        {"value":"interview",         "label":"Interview"},
        {"value":"song",              "label":"Song"},
        {"value":"ceremonial_speech", "label":"Ceremonial Speech / Prayer"},
        {"value":"wordlist",          "label":"Word List / Elicitation"},
        {"value":"language_lesson",   "label":"Language Teaching / Lesson"},
        {"value":"proverb",           "label":"Proverbs / Idioms"},
        {"value":"description",       "label":"Description / Monologue"},
        {"value":"other",             "label":"Other"}
    ]');

    -- ── linguistic_type ──────────────────────────────────────
    CALL seed_options('linguistic_type', '[
        {"value":"primary_text",           "label":"Primary Text"},
        {"value":"lexicon",                "label":"Lexicon / Dictionary"},
        {"value":"language_description",   "label":"Language Description / Grammar"},
        {"value":"language_documentation", "label":"Language Documentation"},
        {"value":"annotation",             "label":"Annotation / Transcription"}
    ]');

    -- ── speaker_proficiency ──────────────────────────────────
    CALL seed_options('speaker_proficiency', '[
        {"value":"fluent_elder",    "label":"Fluent Elder (first-language, high competence)"},
        {"value":"fluent_adult",    "label":"Fluent Adult (first-language)"},
        {"value":"semi_speaker",    "label":"Semi-speaker (partial competence)"},
        {"value":"heritage",        "label":"Heritage / Home Speaker"},
        {"value":"learner",         "label":"Language Learner"},
        {"value":"second_language", "label":"Second-Language Speaker"},
        {"value":"unknown",         "label":"Unknown"}
    ]');

    -- ── speaker_generation ───────────────────────────────────
    CALL seed_options('speaker_generation', '[
        {"value":"elder",  "label":"Elder (60+)"},
        {"value":"adult",  "label":"Adult (30–59)"},
        {"value":"youth",  "label":"Youth (15–29)"},
        {"value":"child",  "label":"Child (under 15)"}
    ]');

    -- ── speaker_gender ───────────────────────────────────────
    CALL seed_options('speaker_gender', '[
        {"value":"female",     "label":"Female"},
        {"value":"male",       "label":"Male"},
        {"value":"non_binary", "label":"Non-binary"},
        {"value":"prefer_not", "label":"Prefer not to say"},
        {"value":"unknown",    "label":"Unknown"}
    ]');

    -- ── speaker_age_range ────────────────────────────────────
    CALL seed_options('speaker_age_range', '[
        {"value":"0-14",   "label":"0–14"},
        {"value":"15-29",  "label":"15–29"},
        {"value":"30-44",  "label":"30–44"},
        {"value":"45-59",  "label":"45–59"},
        {"value":"60-74",  "label":"60–74"},
        {"value":"75+",    "label":"75+"},
        {"value":"unknown","label":"Unknown"}
    ]');

    -- ── recording_quality ────────────────────────────────────
    CALL seed_options('recording_quality', '[
        {"value":"excellent", "label":"Excellent — broadcast quality"},
        {"value":"good",      "label":"Good — clear speech throughout"},
        {"value":"fair",      "label":"Fair — some audio issues"},
        {"value":"poor",      "label":"Poor — significant degradation"}
    ]');

    -- ── background_noise ─────────────────────────────────────
    CALL seed_options('background_noise', '[
        {"value":"none",        "label":"None"},
        {"value":"minimal",     "label":"Minimal"},
        {"value":"moderate",    "label":"Moderate"},
        {"value":"significant", "label":"Significant"}
    ]');

    -- ── file_format ──────────────────────────────────────────
    CALL seed_options('file_format', '[
        {"value":"wav",  "label":"WAV"},
        {"value":"mp3",  "label":"MP3"},
        {"value":"flac", "label":"FLAC"},
        {"value":"aac",  "label":"AAC"},
        {"value":"ogg",  "label":"OGG"},
        {"value":"mp4",  "label":"MP4 (video)"},
        {"value":"mov",  "label":"MOV (video)"},
        {"value":"webm", "label":"WebM (video)"}
    ]');

    -- ── original_format ──────────────────────────────────────
    CALL seed_options('original_format', '[
        {"value":"cassette",     "label":"Cassette Tape"},
        {"value":"reel",         "label":"Reel-to-Reel Tape"},
        {"value":"dat",          "label":"DAT (Digital Audio Tape)"},
        {"value":"minidisc",     "label":"MiniDisc"},
        {"value":"vinyl",        "label":"Vinyl Record"},
        {"value":"vhs",          "label":"VHS Tape"},
        {"value":"cd",           "label":"CD / CD-ROM"},
        {"value":"born_digital", "label":"Born Digital (no analogue original)"}
    ]');

    -- ── topics ───────────────────────────────────────────────
    CALL seed_options('topics', '[
        {"value":"greetings",      "label":"Greetings & Farewells"},
        {"value":"kinship",        "label":"Kinship & Family"},
        {"value":"food",           "label":"Food & Cooking"},
        {"value":"nature",         "label":"Nature & Environment"},
        {"value":"animals",        "label":"Animals"},
        {"value":"plants",         "label":"Plants & Gathering"},
        {"value":"body",           "label":"Body & Health"},
        {"value":"spirituality",   "label":"Spirituality & Ceremony"},
        {"value":"history",        "label":"History & Memory"},
        {"value":"land",           "label":"Land & Territory"},
        {"value":"law_governance", "label":"Law & Governance"},
        {"value":"arts_crafts",    "label":"Arts & Crafts"},
        {"value":"music_dance",    "label":"Music & Dance"},
        {"value":"games",          "label":"Games & Recreation"},
        {"value":"trade",          "label":"Trade & Economy"},
        {"value":"education",      "label":"Education & Knowledge"},
        {"value":"migration",      "label":"Migration & Movement"},
        {"value":"numbers",        "label":"Numbers & Counting"},
        {"value":"time",           "label":"Time & Calendar"},
        {"value":"weather",        "label":"Weather & Seasons"},
        {"value":"proverbs",       "label":"Proverbs & Idioms"},
        {"value":"other",          "label":"Other"}
    ]');

END;
$$;

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

  ('Damara',          'ǂNūkhoen',    'NA', 'Kunene / Erongo',        'Damaraland',
   '{"alternate_names":["ǂNūkhoen"]}'::JSONB),

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
