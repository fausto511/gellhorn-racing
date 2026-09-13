-- Haertung nach Supabase-Database-Linter-Befund vom 2026-09-13 (siehe
-- DECISIONS.md DEC-0053). Deckt zwei der drei WARN-Kategorien ab, die
-- risikofrei behebbar sind, ohne bestehende RLS-Policies zu brechen.
--
-- Bewusst NICHT angefasst (siehe DEC-0053 fuer Begruendung):
--   - public.current_driver_id() / public.is_moderator(): SECURITY DEFINER
--     und ueber RPC aufrufbar, aber ausschliesslich lesen den/die
--     Aufrufende(n) selbst betreffende Daten. EXECUTE hier zu entziehen
--     wuerde die RLS-Policies auf drivers/runs/evidence/... brechen, die
--     genau diese Funktionen in ihrer USING-Klausel aufrufen.
--   - public.rls_auto_enable(): Event-Trigger-Funktion (type: event_trigger),
--     erscheint in keiner eigenen Migration -> Supabase-Plattform-Funktion,
--     nicht Teil des eigenen Schemas. Event-Trigger-Funktionen koennen laut
--     Postgres ohnehin nicht direkt per RPC ausgefuehrt werden (nur als
--     Event-Trigger selbst) - der Linter-Fund ist hier technisch nicht
--     ausnutzbar. Nicht anfassen: Plattform-verwaltet.
--   - public.public_leaderboard / public_drivers / public_vehicles_needed
--     (security_definer_view, ERROR): bewusstes Design, siehe DEC-0053.
--     `security_invoker = true` wuerde das Leaderboard leerlaufen lassen,
--     weil RLS auf runs/evidence anon/authenticated sonst komplett
--     aussperrt.

-- 1) function_search_path_mutable: einzige Funktion im Schema ohne
--    `set search_path`, obwohl alle anderen es haben. Praktisches Risiko
--    hier gering (keine unqualifizierten Verweise im Funktionskoerper),
--    aber kostenloser Konsistenz-Fix.
alter function public.runs_set_updated_at() set search_path = public;

-- 2) anon/authenticated_security_definer_function_executable: drei reine
--    Trigger-Funktionen (referenzieren new/old/tg_op, funktionieren nur im
--    Trigger-Kontext) sind trotzdem oeffentlich per RPC aufrufbar, weil
--    Postgres EXECUTE auf neue Funktionen standardmaessig an PUBLIC
--    vergibt. Ein direkter Aufruf wuerde ohnehin nur mit einem
--    Postgres-Fehler abbrechen (kein Trigger-Kontext vorhanden), aber
--    sauberer ist es, die Angriffsflaeche gar nicht erst offen zu lassen.
--    Trigger-Ausfuehrung selbst braucht kein EXECUTE-Recht und ist von
--    diesem Revoke nicht betroffen.
revoke execute on function public.enforce_verification_requires_video() from public;
revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.log_driver_name_change() from public;
