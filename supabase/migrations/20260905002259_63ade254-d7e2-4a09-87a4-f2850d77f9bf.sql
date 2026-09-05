UPDATE public.allowed_prices SET active = false, updated_at = now()
WHERE price_id IN ('price_1SDH0CRiKNxooUH0m2yK3ttC','price_1SDH2kRiKNxooUH0kbJsDy7T','price_1SDHAJRiKNxooUH0nUcBIFaG');

INSERT INTO public.allowed_prices (price_id, plan_id, credits, active, billing_interval) VALUES
  ('price_1SqRcbRiKNxooUH09cijDYsq', 'starter', 1000, true, 'month'),
  ('price_1SqRe4RiKNxooUH0tYyprM4P', 'pro', 5000, true, 'month'),
  ('price_1SqRgVRiKNxooUH0knqhTTF9', 'legend', 15000, true, 'month')
ON CONFLICT (price_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, credits = EXCLUDED.credits, active = true, billing_interval = EXCLUDED.billing_interval, updated_at = now();