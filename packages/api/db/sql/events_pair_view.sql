-- Canonical definition of the events_pair_view materialized view and its
-- indexes. Used by EventSync when the view does not exist yet (fresh
-- database, or after it was dropped); subsequent syncs rebuild it from the
-- live definition via a staging swap.
--
-- Keep this in sync with packages/api/db/backup.sql.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE MATERIALIZED VIEW public.events_pair_view AS
WITH details AS (
 SELECT e.uuid AS event_uuid,
    e.day_index,
    e.source,
    ee.uuid AS events_entry_uuid,
    e.system_meta,
        CASE
            WHEN e.source = 'user'::enum_events_source THEN ee.name
            ELSE
            CASE
                WHEN e.system_meta IS NOT NULL THEN (((he.name::text || ' ('::text) || e.system_meta) || ')'::text)::character varying
                ELSE he.name
            END
        END AS name,
    COALESCE(ee.description, ''::character varying) AS description,
    COALESCE(ee.tags, ''::character varying) AS tags,
    u.uuid AS created_by_uuid,
    u.first_name,
    u.last_name,
    hed.uuid AS hebrew_event_dates_uuid,
    hed.event_day,
    he.uuid AS hebrew_events_uuid,
    he.short_name,
    hd2.uuid AS hebrew_dates_uuid,
    COALESCE(hd1.gregorian, hd2.gregorian) AS gdate,
    COALESCE((((hd1.yy::text || '-'::text) || lpad(hd1.mm::text, 2, '0'::text)) || '-'::text) || lpad(hd1.dd::text, 2, '0'::text), (((hd2.yy::text || '-'::text) || lpad(hd2.mm::text, 2, '0'::text)) || '-'::text) || lpad(hd2.dd::text, 2, '0'::text)) AS hdate,
    COALESCE(hd1.day_of_week, hd2.day_of_week) AS day_of_week
   FROM events e
     LEFT JOIN events_entry ee ON e.source = 'user'::enum_events_source AND e.source_row = ee.uuid
     LEFT JOIN users u ON ee.created_by = u.uuid
     LEFT JOIN hebrew_dates hd1 ON ee.hebrew_date = hd1.uuid
     LEFT JOIN hebrew_event_dates hed ON e.source <> 'user'::enum_events_source AND e.source_row = hed.uuid
     LEFT JOIN hebrew_events he ON hed.hebrew_event = he.uuid
     LEFT JOIN hebrew_dates hd2 ON hed.hebrew_date = hd2.uuid
)
 SELECT p.uuid,
    p.favorite,
    p.diff,
    p.diff * 2 AS half_days,
    p.diff::numeric / 7.0 AS weeks,
    p.diff::numeric / 360.0 AS rev_years,
    p.diff::numeric / 364.0 AS enoch_years,
    (p.diff % 7) = 0 AS exact_weeks,
    (p.diff % 360) = 0 AS exact_rev_years,
    (p.diff % 364) = 0 AS exact_enoch_years,
    da.day_index AS a_day_index,
    da.source AS a_source,
    da.day_of_week AS a_day_of_week,
    da.name AS a_name,
    da.description AS a_description,
    da.tags AS a_tags,
    da.gdate AS a_gdate,
    da.hdate AS a_hdate,
    da.events_entry_uuid AS a_events_entry_uuid,
    da.created_by_uuid AS a_created_by_uuid,
    da.first_name AS a_first_name,
    da.last_name AS a_last_name,
    da.hebrew_event_dates_uuid AS a_hebrew_event_dates_uuid,
    da.hebrew_dates_uuid AS a_hebrew_dates_uuid,
    da.hebrew_events_uuid AS a_hebrew_events_uuid,
    da.event_day AS a_event_day,
    da.short_name AS a_short_name,
    da.system_meta AS a_system_meta,
    db.day_index AS b_day_index,
    db.source AS b_source,
    db.day_of_week AS b_day_of_week,
    db.name AS b_name,
    db.description AS b_description,
    db.tags AS b_tags,
    db.gdate AS b_gdate,
    db.hdate AS b_hdate,
    db.events_entry_uuid AS b_events_entry_uuid,
    db.created_by_uuid AS b_created_by_uuid,
    db.first_name AS b_first_name,
    db.last_name AS b_last_name,
    db.hebrew_event_dates_uuid AS b_hebrew_event_dates_uuid,
    db.hebrew_dates_uuid AS b_hebrew_dates_uuid,
    db.hebrew_events_uuid AS b_hebrew_events_uuid,
    db.event_day AS b_event_day,
    db.short_name AS b_short_name,
    db.system_meta AS b_system_meta
   FROM events_pairs p
     JOIN details da ON da.event_uuid = p.a
     JOIN details db ON db.event_uuid = p.b;

CREATE INDEX epv_diff_idx ON public.events_pair_view USING btree (diff, uuid) INCLUDE (favorite);
CREATE INDEX epv_a_system_meta_before_exclude ON public.events_pair_view USING btree (uuid) WHERE (a_system_meta IS DISTINCT FROM 'before'::enum_events_system_meta);
CREATE INDEX epv_b_system_meta_after_exclude ON public.events_pair_view USING btree (uuid) WHERE (b_system_meta IS DISTINCT FROM 'after'::enum_events_system_meta);
CREATE INDEX epv_a_tags_trgm ON public.events_pair_view USING gin (a_tags gin_trgm_ops);
CREATE INDEX epv_b_tags_trgm ON public.events_pair_view USING gin (b_tags gin_trgm_ops);
CREATE INDEX epv_events_entry_uuid_idx ON public.events_pair_view USING btree (a_events_entry_uuid, b_events_entry_uuid);
CREATE INDEX epv_hebrew_events_uuid_idx ON public.events_pair_view USING btree (a_hebrew_events_uuid, b_hebrew_events_uuid);
CREATE INDEX epv_created_by_uuid_idx ON public.events_pair_view USING btree (a_created_by_uuid, b_created_by_uuid);
CREATE INDEX epv_enoch_idx ON public.events_pair_view USING btree (enoch_years, diff DESC);
CREATE INDEX epv_rev_idx ON public.events_pair_view USING btree (rev_years, diff DESC);
CREATE INDEX epv_weeks_idx ON public.events_pair_view USING btree (weeks, diff DESC);
CREATE INDEX epv_a_src_gdate_idx ON public.events_pair_view USING btree (a_source, a_gdate);
CREATE INDEX epv_b_src_gdate_idx ON public.events_pair_view USING btree (b_source, b_gdate);
CREATE INDEX epv_a_events_entry_idx ON public.events_pair_view USING btree (a_events_entry_uuid);
CREATE INDEX epv_b_events_entry_idx ON public.events_pair_view USING btree (b_events_entry_uuid);
CREATE INDEX epv_a_hebrew_events_idx ON public.events_pair_view USING btree (a_hebrew_events_uuid);
CREATE INDEX epv_b_hebrew_events_idx ON public.events_pair_view USING btree (b_hebrew_events_uuid);
CREATE INDEX epv_a_created_by_idx ON public.events_pair_view USING btree (a_created_by_uuid);
CREATE INDEX epv_b_created_by_idx ON public.events_pair_view USING btree (b_created_by_uuid);
CREATE UNIQUE INDEX epv_uuid_idx ON public.events_pair_view USING btree (uuid);
CREATE INDEX epv_exact_rev_years_true ON public.events_pair_view USING btree (rev_years, diff DESC) WHERE exact_rev_years;
CREATE INDEX epv_exact_enoch_years_true ON public.events_pair_view USING btree (enoch_years, diff DESC) WHERE exact_enoch_years;
CREATE INDEX epv_exact_weeks_true ON public.events_pair_view USING btree (weeks, diff DESC) WHERE exact_weeks;
CREATE INDEX epv_user_weeks_gdate_diff_idx ON public.events_pair_view USING btree (exact_weeks, a_source, a_gdate, diff DESC) WHERE exact_weeks;
CREATE INDEX epv_a_src_gdate_diff_idx ON public.events_pair_view USING btree (a_source, a_gdate, diff DESC);
CREATE INDEX epv_b_src_gdate_diff_idx ON public.events_pair_view USING btree (b_source, b_gdate, diff DESC);
CREATE INDEX epv_a_hebrew_event_dates_idx ON public.events_pair_view USING btree (a_hebrew_event_dates_uuid);
CREATE INDEX epv_b_hebrew_event_dates_idx ON public.events_pair_view USING btree (b_hebrew_event_dates_uuid);
CREATE INDEX epv_a_gdate_idx ON public.events_pair_view USING btree (a_gdate);
CREATE INDEX epv_a_gdate_desc_idx ON public.events_pair_view USING btree (a_gdate DESC);
CREATE INDEX epv_a_b_source_idx ON public.events_pair_view USING btree (a_source, b_source);
CREATE INDEX epv_a_b_source_gdate_diff_idx ON public.events_pair_view USING btree (a_source, b_source, a_gdate DESC, diff DESC);
