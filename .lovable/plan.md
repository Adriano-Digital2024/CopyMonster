

## Diagnosis

Two issues in the OAuth URL:

1. **Invalid scopes**: `instagram_basic` and `instagram_manage_insights` are not valid Facebook Login scopes. For Facebook Business Login with `config_id`, scopes are configured in the Meta Business Login configuration itself — they should NOT be passed in the URL. The Facebook docs say these Instagram permissions must be configured in the Business Login config, not as URL params.

2. **Wrong `config_id`**: The URL shows `config_id=1438284927847393` but the secret `META_BUSINESS_CONFIG_ID` should be `1920808931973572` per the project memory. Either the secret was changed or there's a mismatch.

## Fix

### 1. `supabase/functions/meta-oauth/index.ts` (line 65-67)

Remove `instagram_basic` and `instagram_manage_insights` from the `scopes` string. When using Facebook Business Login with `config_id`, the scopes are managed in the Meta Business Login configuration panel — passing invalid scopes in the URL causes the error.

Updated scopes:
```
ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,public_profile
```

Also remove these two from the `p_scopes` array stored in the database (around line 140).

### 2. Verify `META_BUSINESS_CONFIG_ID` secret

The URL shows `config_id=1438284927847393` but project memory says it should be `1920808931973572`. Need to check which is correct — if the user updated it intentionally, that's fine; otherwise the secret may need updating.

### 3. Instagram scopes — external action required

To get Instagram data, the user needs to:
- Go to Meta for Developers → their App → Business Login configuration
- Add `instagram_basic` and `instagram_manage_insights` as approved scopes in the Business Login config
- These will then be granted automatically during the OAuth flow without needing to be in the URL

### 4. Redeploy `meta-oauth` edge function

