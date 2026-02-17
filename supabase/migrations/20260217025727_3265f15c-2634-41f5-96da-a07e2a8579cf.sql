
CREATE TABLE public.webhook_events (
  id serial PRIMARY KEY,
  event_id varchar NOT NULL UNIQUE,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
