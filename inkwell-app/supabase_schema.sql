-- INKWELL — book creation app database schema
-- Paste this whole file into the Supabase SQL Editor (SQL Editor > New Query) and click Run.

create extension if not exists "uuid-ossp";

-- BOOKS: the library shelf. Every book you're working on lives here.
create table books (
  id uuid primary key default uuid_generate_v4(),
  title text not null default 'Untitled Book',
  series_name text,
  book_number int,
  genre text default 'Dark Romance',
  tropes text,
  pov_structure text,        -- e.g. "Dual POV, 1st person"
  heat_level text,           -- e.g. "Explicit / Open door"
  status text default 'Idea',-- Idea, Drafting, Revising, Complete
  blurb text,
  cover_note text,           -- vibe/mood notes for a future cover
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CHARACTERS
create table characters (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade,
  name text not null,
  alias text,
  age text,
  role text,                 -- Protagonist, Love Interest, Antagonist, Side
  appearance text,
  personality text,
  attributes text,           -- traits, comma separated
  origin text,
  occupation text,
  backstory text,
  motivations text,
  fears_secrets text,
  arc text,                  -- how they change
  notes text,                -- catch-all, also where brain-dump suggestions land
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FAMILY MEMBERS (per character)
create table family_members (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  name text,
  relation text,
  notes text
);

-- RELATIONSHIPS between characters
create table character_relationships (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  related_character_id uuid references characters(id) on delete set null,
  related_name_freeform text, -- fallback if not linking to a stored character
  dynamic text,                -- e.g. "captor/captive", "childhood friends"
  notes text
);

-- PLOT ARC points, plotted as a tension curve
create table plot_points (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade,
  title text not null,
  beat_type text,      -- Setup, Inciting Incident, Rising Action, Midpoint, Crisis, Climax, Resolution, Twist
  chapter_ref text,    -- e.g. "Ch. 12" free text so it can predate chapters existing
  tension int default 5, -- 0-10 for the graph
  order_index int default 0,
  notes text
);

-- CHAPTERS
create table chapters (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade,
  number int not null,
  title text,
  status text default 'Draft', -- Outline, Draft, Revising, Final
  pov_character text,
  outline text,     -- beat-by-beat plan
  content text,     -- actual prose
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BRAIN DUMPS — chaotic freewriting, archived one session at a time
create table brain_dumps (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade,
  content text,
  archived boolean default false,
  created_at timestamptz default now()
);

-- WORLD NOTES — setting, rules, factions, whatever the world needs
create table world_notes (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade,
  category text default 'General', -- Setting, Rules/Magic, Factions, Research, Themes
  title text,
  content text,
  created_at timestamptz default now()
);

-- TIMELINE — continuity tracker
create table timeline_events (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books(id) on delete cascade,
  order_index int default 0,
  date_label text,   -- "Day 1", "Six years ago", etc.
  title text,
  description text
);

-- Row Level Security: enabled with permissive policies since this is a
-- single-user personal app accessed with the public anon key.
-- Keep your deployed URL private — anyone with the link and key can read/write.
alter table books enable row level security;
alter table characters enable row level security;
alter table family_members enable row level security;
alter table character_relationships enable row level security;
alter table plot_points enable row level security;
alter table chapters enable row level security;
alter table brain_dumps enable row level security;
alter table world_notes enable row level security;
alter table timeline_events enable row level security;

create policy "allow all books" on books for all using (true) with check (true);
create policy "allow all characters" on characters for all using (true) with check (true);
create policy "allow all family_members" on family_members for all using (true) with check (true);
create policy "allow all character_relationships" on character_relationships for all using (true) with check (true);
create policy "allow all plot_points" on plot_points for all using (true) with check (true);
create policy "allow all chapters" on chapters for all using (true) with check (true);
create policy "allow all brain_dumps" on brain_dumps for all using (true) with check (true);
create policy "allow all world_notes" on world_notes for all using (true) with check (true);
create policy "allow all timeline_events" on timeline_events for all using (true) with check (true);
