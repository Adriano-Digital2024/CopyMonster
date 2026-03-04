-- Performance indexes for ads_data
CREATE INDEX idx_ads_data_user_date ON public.ads_data (user_id, date_range_start);
CREATE INDEX idx_ads_data_user_ad ON public.ads_data (user_id, ad_id);

-- Performance indexes for instagram_data
CREATE INDEX idx_instagram_data_user_synced ON public.instagram_data (user_id, synced_at);
CREATE INDEX idx_instagram_data_user_post ON public.instagram_data (user_id, post_id);