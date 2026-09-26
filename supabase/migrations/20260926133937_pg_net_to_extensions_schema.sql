-- RS-0028: pg_net aus public ins Schema extensions (Advisor extension_in_public). Live-Version 20260926133937.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
