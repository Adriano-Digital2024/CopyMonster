

## Analysis: Anúncios de Alta Conversão Monster — Premium Quality Refinement

### Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection (language is detected per-message by chat-stream, not by prompt content).
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

### Current State Assessment

The agent `high-conversion-ads-monster` exists with a functional but generic configuration:

- **system_prompt**: Covers PAS/AIDA basics but lacks platform-specific character limits and DNA cross-referencing depth
- **role_definition**: One line — "World-class ads specialist who applies PAS and AIDA frameworks automatically"
- **core_function**: One line — generic
- **output_structure**: Flat numbered list with no platform segmentation — delivers a generic mix regardless of requested platform
- **quality_rules**: Standard formatting rules, correct
- **few_shot_examples**: Empty array — major gap
- **Model**: temp 0.8, max_tokens 3000, min_words 150, max_words 600

### What the Suggestion Improves (Worth Adopting)

1. **Platform-aware output structure** — Current output dumps all formats together. The suggestion segments by variation with clear labels per platform (Meta Feed, Google RSA, TikTok caption). This makes output directly usable. High value.

2. **DNA cross-referencing instruction** — Explicitly telling the agent to extract pain, desire, objections, and unique angle from the loaded DNA context. Currently absent. High value.

3. **Framework labeling in output** — Showing which framework (PAS/AIDA) was applied per variation helps users understand the strategy. Currently missing. Medium-high value.

4. **Few-shot examples** — Empty array is the single biggest quality gap. Adding 3 examples (PT with PAS, EN with AIDA for Google, ES with AIDA short for TikTok) will dramatically improve consistency. Highest impact change.

5. **Headline value formulas in system prompt** — Explicitly listing proven patterns ("How to [Result] without [Pain]", etc.) gives the model concrete templates to follow. Currently absent. High value.

6. **Role definition depth** — Adding infoproduct specialization and framework mastery specifics. Medium value.

### What to Discard (No Real Value or Risk)

1. **LinkedIn Ads and YouTube Ads in the suggestion's platform list** — The current agent already covers Meta/Google/TikTok. Adding LinkedIn creates scope creep for this specific agent. YouTube is already mentioned in the existing prompt. Discard LinkedIn addition.

2. **Model recommendation (Claude/GPT-4)** — Model is configured via admin panel. Irrelevant to prompt content. Discard.

3. **presence_penalty/frequency_penalty changes** — Current 0.0/0.0 values are fine. Marginal improvement. No change.

4. **Temperature change to 0.7** — Current 0.8 is appropriate for creative ad copy. No change.

5. **max_tokens reduction to 1500** — Current 3000 provides sufficient headroom for multi-variation outputs. No change.

6. **Markdown headers in output_structure** — The suggestion uses `#` and `##` which violates the production formatting standard. Must use plain text labels only.

7. **"12 years experience" backstory** — Excessive persona detail does not improve output quality. Discard.

### Implementation Plan

**Single SQL migration** updating 5 fields on `high-conversion-ads-monster`:

**1. system_prompt** — Enhanced with:
- Platform-specific character limits (Meta headline 40 chars, Google headline 30 chars, Google description 90 chars, TikTok caption 150 chars)
- Explicit DNA cross-referencing instruction (extract pain, desire, objections, unique value)
- Headline value formulas (concrete patterns the model should follow)
- Framework selection logic (PAS for problem-focused, AIDA for benefit/sequence)
- Infoproduct market focus
- Instruction to provide multiple variations with different angles

**2. role_definition** — Expanded to include framework mastery (PAS, AIDA), platform expertise (Meta, Google, TikTok), and infoproduct specialization

**3. core_function** — Specify deliverables: headlines with value formulas, framework-structured body copy, irresistible bullets, platform-adapted variations with character limit compliance

**4. output_structure** — Restructured into variation-based blocks showing: framework used, headline, primary text structured per framework, bullet points, description, CTA — all plain text labels (no markdown headers, no emojis)

**5. few_shot_examples** — Add 3 examples:
- Portuguese: Meta Ads for a mentorship launch using PAS (3 variations with different angles: pain, solution, social proof)
- English: Google Ads Search RSA for a copywriting course using AIDA (2 variations)
- Spanish: TikTok Ads for a productivity workshop using short AIDA (2 variations)

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model, temperature, or parameter changes
- No new dependencies
- Language detection remains automatic via chat-stream
- Formatting rules enforced by existing quality_rules and getUniversalLanguageRules()
- min_words/max_words remain 150/600

### Technical Details

```text
Files changed: 1 new SQL migration

Database update:
  UPDATE agents SET
    system_prompt = '...',
    role_definition = '...',
    core_function = '...',
    output_structure = '...',
    few_shot_examples = '[...]'::jsonb
  WHERE slug = 'high-conversion-ads-monster';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output_structure text uses plain labels without markdown headers, asterisks, or emojis.

