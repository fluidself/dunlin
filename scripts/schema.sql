-- extensions

DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" with SCHEMA public;


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
  author_only_notes boolean NOT NULL,
  author_control_notes boolean NOT NULL,
  CONSTRAINT decks_pkey PRIMARY KEY (id)
);


-- public.contributors definition

DROP TABLE IF EXISTS public.contributors;
CREATE TABLE public.contributors (
  deck_id uuid NOT NULL,
  user_id text NOT NULL,
  CONSTRAINT contributors_pkey PRIMARY KEY (deck_id, user_id)
);


-- public.notes definition

DROP TABLE IF EXISTS public.notes;
CREATE TABLE public.notes (
  "content" text NOT NULL,
  title text NOT NULL,
  deck_id uuid NOT NULL,
  user_id text NOT NULL,
  author_only boolean NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_pkey PRIMARY KEY (id)
);


-- public.decks foreign keys

ALTER TABLE public.decks ADD CONSTRAINT deck_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- public.contributors foreign keys

ALTER TABLE public.contributors ADD CONSTRAINT contributor_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id);
ALTER TABLE public.contributors ADD CONSTRAINT contributor_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- public.notes foreign keys

ALTER TABLE public.notes ADD CONSTRAINT note_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id);
ALTER TABLE public.notes ADD CONSTRAINT note_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- row level security

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert workspace"
  ON public.decks FOR INSERT
  WITH CHECK (auth.jwt() ->> 'id' IS NOT NULL);

CREATE POLICY "Authenticated users can select workspace"
  ON public.decks FOR SELECT
  USING (auth.jwt() ->> 'id' IS NOT NULL);

CREATE POLICY "Workspace contributors can update workspace"
  ON public.decks FOR UPDATE
  USING (auth.jwt() ->> 'id' IN (SELECT user_id FROM public.contributors WHERE deck_id = id));

CREATE POLICY "Workspace owner can delete workspace"
  ON public.decks FOR DELETE
  USING (auth.jwt() ->> 'id' = user_id);

CREATE POLICY "Authenticated users can access contributors"
  ON public.contributors FOR ALL
  USING (auth.jwt() ->> 'id' IS NOT NULL);

CREATE POLICY "Workspace contributors can access notes"
  ON public.notes FOR ALL
  USING (auth.jwt() ->> 'id' IN (SELECT user_id FROM public.contributors WHERE deck_id = deck_id));


-- handle new deck trigger

CREATE OR REPLACE FUNCTION public.handle_new_deck()
  RETURNS trigger 
  language plpgsql 
  security definer 
  set search_path = public
  as $$
    begin
      insert into public.contributors (deck_id, user_id)
      values (new.id, new.user_id);
      return new;
    end;
  $$;

drop trigger if exists on_public_deck_created on public.decks;
create trigger on_public_deck_created
  after insert on public.decks
  for each row execute procedure public.handle_new_deck();


-- handle deleted deck trigger

CREATE OR REPLACE FUNCTION public.handle_deleted_deck()
  RETURNS trigger 
  language plpgsql 
  security definer 
  set search_path = public
  as $$
    begin
      delete from public.notes 
      where deck_id=old.id;
      delete from public.contributors 
      where deck_id=old.id;
      return old;
    end;
  $$;

drop trigger if exists on_public_deck_deleted on public.decks;
create trigger on_public_deck_deleted
  before delete on public.decks
  for each row execute procedure public.handle_deleted_deck();
