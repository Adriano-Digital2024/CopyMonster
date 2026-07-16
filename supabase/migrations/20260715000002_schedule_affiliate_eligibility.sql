SELECT cron.schedule(
  'affiliate-eligibility-check',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/affiliate-eligibility-check',
    headers:=jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  ) AS request_id;
  $$
);
