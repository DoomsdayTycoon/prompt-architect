-- Migration: add full config storage to prompt_history
-- Run this once in the Supabase SQL editor.
--
-- Adds a single jsonb column `config` that stores the complete set of form
-- selections (mode, task, industry, output, style, tone, length, format,
-- includes, techniques, audience, extra instructions, risk level, language,
-- file output, selected firm, selected role, sub-model). This lets the
-- "Prompt History" panel restore every option exactly as the user originally
-- set them when they click a historical row.

alter table public.prompt_history
  add column if not exists config jsonb;

-- Optional: speed up queries that filter by fields inside the jsonb blob.
create index if not exists idx_prompt_history_config
  on public.prompt_history using gin (config);
