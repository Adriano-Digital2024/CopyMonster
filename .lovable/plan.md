## Before proceeding, please confirm:

• All system prompts will remain in English.

• Few-shot examples in multiple languages will not interfere with automatic language detection.

• Final outputs will always match the detected user language (EN/PT/ES).

• No changes will be made to language detection logic.

Please confirm this before applying the SQL migration. Analysis: Ads Monster — Premium Quality Refinement

### Current State Assessment

The existing Ads Monster configuration is functional and follows the established architecture. The current database fields are:

- **system_prompt**: Generic, covers basics but lacks platform-specific depth
- **role_definition**: Solid but brief
- **core_function**: Adequate but vague on deliverables
- **output_structure**: Simple sequential format, no platform segmentation
- **quality_rules**: Clean and correct
- **expected_inputs**: Good, asks the right questions
- **few_shot_examples**: Empty array — major gap
- **Model**: mistralai/mistral-large-latest, temp 0.8, max_tokens 3000
- **Word limits**: 100-400 (current max_words is 800 in DB)

### What the Suggestion Improves (Worth Adopting)

1. **Platform-specific character limits in the system prompt** — The current prompt has no awareness of Meta headline limits (40 chars), Google headline limits (30 chars), etc. This causes the model to generate headlines that are too long for actual use. High-value improvement.
2. **Structured output by platform** — The current output_structure is a generic sequential list. The suggestion organizes output by platform (Meta Feed, Meta Stories, Google Search, TikTok), which directly improves usability. Users can copy-paste per platform.
3. **Few-shot examples** — Currently empty. Adding 2-3 examples (one per language) will dramatically improve output consistency and quality. This is the single highest-impact change.
4. **Infoproduct focus in role_definition** — Adding explicit specialization in digital education/infoproducts aligns with the actual user base and improves relevance.
5. **DNA cross-referencing instruction** — Explicitly telling the agent to extract pain, desire, and unique angle from the loaded DNA context makes responses more personalized.

### What to Discard (No Real Value or Risk)

1. **LinkedIn Ads and YouTube Ads support** — Not part of the current product scope. Adding unused platforms creates noise. Discard.
2. **Model recommendation change to Claude/GPT-4** — The model is configured via admin panel per agent. The suggestion's model recommendation is irrelevant since it cannot be applied via prompt. The current Mistral Large is adequate. No change.
3. **presence_penalty/frequency_penalty changes** — Current values (0.0/0.0) work fine. The suggested 0.3/0.2 are minor and unlikely to produce noticeable improvement. No change.
4. **Markdown headers in output_structure** — The suggestion uses `#` and `##` which directly violates the formatting rules. The output_structure must use plain text labels only.
5. **"10+ years experience" backstory** — Already covered adequately in role_definition. Excessive persona backstory doesn't improve model output.

### Implementation Plan

**Single SQL migration** to update 5 fields on the `ads-monster` agent row:

**1. system_prompt** — Enhanced with:

- Platform-specific character limits (Meta, Google Search, Google Display, TikTok)
- Explicit instruction to cross-reference DNA for pain/desire/angle
- Infoproduct market focus
- Instruction to provide test variations

**2. role_definition** — Add infoproduct specialization and platform expertise depth

**3. core_function** — Specify deliverables by platform type with character limit awareness

**4. output_structure** — Restructure into platform-segmented blocks (Meta Feed, Meta Stories/Reels, Google Search RSA, TikTok, test variations), all using plain text labels (no markdown headers)

**5. few_shot_examples** — Add 3 examples:

- Portuguese: Meta Ads for a mentorship launch
- English: Google Ads Search for a copywriting course
- Spanish: TikTok Ads for a productivity workshop

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model or parameter changes
- No new dependencies
- Language detection remains automatic via chat-stream
- Formatting rules enforced by existing getUniversalLanguageRules()

### Technical Details

```text
Files changed: 1 new SQL migration

Database update:
  UPDATE agents SET
    system_prompt = '...',
    role_definition = '...',
    core_function = '...',
    output_structure = '...',
    few_shot_examples = '[...]'
  WHERE slug = 'ads-monster';
```

The few-shot examples will be stored as a JSON array matching the existing `{input, output}` structure used by the chat-stream prompt builder.

All output_structure text will use plain labels (e.g., "Meta Ads - Feed", "Headline:", "Primary Text:") without markdown headers, asterisks, or emojis — consistent with the production formatting standard.