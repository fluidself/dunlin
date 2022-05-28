-- extensions

DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" with SCHEMA public;


-- public.notes definition

DROP TABLE IF EXISTS public.notes;
CREATE TABLE public.notes (
  "content" text NOT NULL,
  title text NOT NULL,
  deck_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_deck_id_title_key UNIQUE (deck_id, title)
);


-- public.users definition

DROP TABLE IF EXISTS public.users;
CREATE TABLE public.users (
  id text NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);


-- public.decks definition

DROP TABLE IF EXISTS public.decks;
CREATE TABLE public.decks (
  user_id text NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  deck_name text NOT NULL,
  note_tree jsonb NULL,
  access_params jsonb NOT NULL,
  CONSTRAINT decks_pkey PRIMARY KEY (id)
);


-- public.notes foreign keys

ALTER TABLE public.notes ADD CONSTRAINT note_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id);


-- public.decks foreign keys

ALTER TABLE public.decks ADD CONSTRAINT deck_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- set timestamp trigger

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
  RETURNS trigger 
  language plpgsql 
  security definer 
  set search_path = public
  as $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
  $$;

drop trigger if exists set_timestamp on public.notes;
create trigger set_timestamp
  before update on public.notes
  for each row execute function trigger_set_timestamp();
