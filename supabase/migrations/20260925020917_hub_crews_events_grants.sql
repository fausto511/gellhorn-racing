-- RS-0022: explizite Tabellenrechte (dieses Projekt vergibt sie nicht
-- automatisch; gleiches Muster wie tracks/vehicles/runs). Wer was sieht
-- bzw. schreiben darf, entscheidet weiterhin RLS (nur is_published
-- oeffentlich; Schreiben nur is_moderator()).
grant select on public.crews, public.hub_events to anon, authenticated;
grant insert, update, delete on public.crews, public.hub_events to authenticated;
