CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_diff_idx ON public.events_pair_view USING btree (diff, uuid) INCLUDE (favorite);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_system_meta_before_exclude ON public.events_pair_view USING btree (uuid) WHERE (a_system_meta IS DISTINCT FROM 'before'::enum_events_system_meta);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_system_meta_after_exclude ON public.events_pair_view USING btree (uuid) WHERE (b_system_meta IS DISTINCT FROM 'after'::enum_events_system_meta);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_tags_trgm ON public.events_pair_view USING gin (a_tags gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_tags_trgm ON public.events_pair_view USING gin (b_tags gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_events_entry_uuid_idx ON public.events_pair_view USING btree (a_events_entry_uuid, b_events_entry_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_hebrew_events_uuid_idx ON public.events_pair_view USING btree (a_hebrew_events_uuid, b_hebrew_events_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_created_by_uuid_idx ON public.events_pair_view USING btree (a_created_by_uuid, b_created_by_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_enoch_idx ON public.events_pair_view USING btree (enoch_years, diff DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_rev_idx ON public.events_pair_view USING btree (rev_years, diff DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_weeks_idx ON public.events_pair_view USING btree (weeks, diff DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_src_gdate_idx ON public.events_pair_view USING btree (a_source, a_gdate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_src_gdate_idx ON public.events_pair_view USING btree (b_source, b_gdate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_events_entry_idx ON public.events_pair_view USING btree (a_events_entry_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_events_entry_idx ON public.events_pair_view USING btree (b_events_entry_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_hebrew_events_idx ON public.events_pair_view USING btree (a_hebrew_events_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_hebrew_events_idx ON public.events_pair_view USING btree (b_hebrew_events_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_created_by_idx ON public.events_pair_view USING btree (a_created_by_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_created_by_idx ON public.events_pair_view USING btree (b_created_by_uuid);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS evp_uuid_idx ON public.events_pair_view USING btree (uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_exact_rev_years_true ON public.events_pair_view USING btree (rev_years, diff DESC) WHERE exact_rev_years;

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_exact_enoch_years_true ON public.events_pair_view USING btree (enoch_years, diff DESC) WHERE exact_enoch_years;

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_exact_weeks_true ON public.events_pair_view USING btree (weeks, diff DESC) WHERE exact_weeks;

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_user_weeks_gdate_diff_idx ON public.events_pair_view USING btree (exact_weeks, a_source, a_gdate, diff DESC) WHERE exact_weeks;

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_src_gdate_diff_idx ON public.events_pair_view USING btree (a_source, a_gdate, diff DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_src_gdate_diff_idx ON public.events_pair_view USING btree (b_source, b_gdate, diff DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_hebrew_event_dates_idx ON public.events_pair_view USING btree (a_hebrew_event_dates_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_b_hebrew_event_dates_idx ON public.events_pair_view USING btree (b_hebrew_event_dates_uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_gdate_idx ON public.events_pair_view USING btree (a_gdate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_gdate_desc_idx ON public.events_pair_view USING btree (a_gdate DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_b_source_idx ON public.events_pair_view USING btree (a_source, b_source);

CREATE INDEX CONCURRENTLY IF NOT EXISTS evp_a_b_source_gdate_diff_idx ON public.events_pair_view USING btree (a_source, b_source, a_gdate DESC, diff DESC);

