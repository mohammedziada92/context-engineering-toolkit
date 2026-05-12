-- 003-gotrue-migrations.sql
-- CET Database Init: Pre-seed GoTrue's schema_migrations tracking table
--
-- GoTrue applies its own migrations on first boot, but some migrations fail
-- because they reference objects already created by earlier migrations in the
-- same boot cycle (e.g., constraints that already exist). This script marks
-- all known GoTrue migrations as "already applied" so GoTrue skips them on
-- subsequent restarts, preventing crash-loops.
--
-- Run order: AFTER GoTrue has completed its first-boot migrations successfully.
-- On a clean `docker compose up`, GoTrue will run migrations before this script
-- can help. Instead, this script ensures that after the FIRST successful boot,
-- subsequent restarts don't re-run migrations that would fail.
--
-- Safety: INSERT ... ON CONFLICT DO NOTHING is idempotent.

-- Ensure the auth.schema_migrations table exists (GoTrue creates it on first boot,
-- but this script may run before GoTrue on a cold start with volume preserved).
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'schema_migrations') THEN
        INSERT INTO auth.schema_migrations (version) VALUES
            ('00'),
            ('20210710035447'),
            ('20210722035447'),
            ('20210730183235'),
            ('20210909172000'),
            ('20210927181326'),
            ('20211122151130'),
            ('20211124214934'),
            ('20211202183645'),
            ('20220114185221'),
            ('20220114185340'),
            ('20220224000811'),
            ('20220323170000'),
            ('20220429102000'),
            ('20220531120530'),
            ('20220614074223'),
            ('20220811173540'),
            ('20221003041349'),
            ('20221003041400'),
            ('20221011041400'),
            ('20221020193600'),
            ('20221021073300'),
            ('20221021082433'),
            ('20221027105023'),
            ('20221114143122'),
            ('20221114143410'),
            ('20221125140132'),
            ('20221208132122'),
            ('20221215195500'),
            ('20221215195800'),
            ('20221215195900'),
            ('20230116124310'),
            ('20230116124412'),
            ('20230131181311'),
            ('20230322519590'),
            ('20230402418590'),
            ('20230411005111'),
            ('20230508135423'),
            ('20230523124323'),
            ('20230818113222'),
            ('20230914180801'),
            ('20231027141322'),
            ('20231114161723'),
            ('20231117164230'),
            ('20240115144230'),
            ('20240214120130'),
            ('20240306115329'),
            ('20240314092811'),
            ('20240427152123'),
            ('20240612123726'),
            ('20240729123726'),
            ('20240802193726'),
            ('20240806073726'),
            ('20241009103726'),
            ('20250717082212'),
            ('20250731150234'),
            ('20250804100000'),
            ('20250901200500'),
            ('20250903112500'),
            ('20250904133000'),
            ('20250925093508'),
            ('20251007112900'),
            ('20251104100000'),
            ('20251111201300'),
            ('20251201000000'),
            ('20260115000000'),
            ('20260121000000'),
            ('20260219120000'),
            ('20260302000000')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
