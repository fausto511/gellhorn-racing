-- 2026-09-30: crew language becomes a fixed, multi-select list (Fausto).
-- Free text ("German" / "Deutsch" / "DE") made a reliable filter impossible.
-- New column crews.languages: ISO 639-1 codes, same list as
-- site/src/data/languages.ts (add a language in BOTH places).
-- The old free-text column crews.language stays until the new site is live
-- (the currently deployed editor still writes it), then gets dropped.
alter table public.crews
  add column languages text[] not null default '{}'
    check (languages <@ array['en','es','pt','fr','de','it','ar','bg','zh','hr','cs','da','nl','et','tl','fi','el','he','hi','hu','id','ja','ko','lv','lt','ms','no','fa','pl','ro','ru','sr','sk','sl','sv','th','tr','uk','vi']::text[]);

-- carry over existing free-text values where the meaning is unambiguous
update public.crews c set languages = m.codes
  from (
    select crew_id, array_agg(distinct code order by code) codes
      from public.crews,
           lateral regexp_split_to_table(lower(coalesce(language, '')), '\s*(,|/|&|\+|\band\b|\bund\b)\s*') part,
           lateral (select case trim(part)
             when 'english' then 'en' when 'englisch' then 'en' when 'en' then 'en' when 'eng' then 'en'
             when 'german' then 'de' when 'deutsch' then 'de' when 'de' then 'de' when 'ger' then 'de'
             when 'spanish' then 'es' when 'español' then 'es' when 'espanol' then 'es' when 'spanisch' then 'es' when 'es' then 'es'
             when 'portuguese' then 'pt' when 'português' then 'pt' when 'portugues' then 'pt' when 'pt' then 'pt' when 'pt-br' then 'pt'
             when 'french' then 'fr' when 'français' then 'fr' when 'francais' then 'fr' when 'französisch' then 'fr' when 'fr' then 'fr'
             when 'italian' then 'it' when 'italiano' then 'it' when 'italienisch' then 'it' when 'it' then 'it'
             when 'dutch' then 'nl' when 'nederlands' then 'nl' when 'polish' then 'pl' when 'polski' then 'pl'
             when 'turkish' then 'tr' when 'türkçe' then 'tr' when 'russian' then 'ru'
           end code) x
     where x.code is not null
     group by crew_id
  ) m
 where m.crew_id = c.crew_id;

comment on column public.crews.languages is 'Languages the crew speaks, ISO 639-1 codes from a fixed list (site/src/data/languages.ts).';
comment on column public.crews.language is 'DEPRECATED 2026-09-30, replaced by languages. Drop once the new site is deployed.';
