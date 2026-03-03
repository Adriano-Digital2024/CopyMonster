

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection (language is detected per-message by chat-stream).
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: Blog Posts Monster — Premium Quality Refinement

### Current State Assessment

The `blog-posts` agent exists with a functional but shallow configuration:

- **system_prompt**: Clean, correct formatting rules, but lacks DNA cross-referencing, infoproduct positioning, and content depth instructions
- **role_definition**: Generic SEO focus, no infoproduct specialization
- **core_function**: Basic — asks the agent to understand topic/keyword before writing, but no depth guidance
- **output_structure**: Flat template (Title, Meta Description, Introduction, Sections 1-3, Conclusion) — too rigid and generic for long-form authority content
- **quality_rules**: Good formatting rules already in place, correct language enforcement
- **few_shot_examples**: Empty array — major gap
- **expected_inputs**: Adequate but overly rigid
- **Model**: temp 0.70, max_tokens 4096, min_words 100, max_words 2000

### What the Suggestion Improves (Worth Adopting)

1. **DNA cross-referencing in system_prompt** — Currently absent. Explicit instruction to extract avatar pain, desire, and objections from loaded DNA context will make every article personalized and strategic. High value.

2. **Infoproduct positioning guidance** — Current prompt has no awareness that articles should subtly drive toward the expert's paid offerings. Adding this instruction transforms generic blog posts into strategic content marketing. High value.

3. **Flexible output structure** — Current structure is a rigid 3-section template. The suggestion allows dynamic subheadings based on topic depth, which produces more natural, authoritative articles. High value.

4. **Few-shot examples** — Empty array is the biggest quality gap. Adding 3 examples (PT educational article, EN objection-breaking article, ES listicle format) will dramatically improve output consistency and depth. Highest impact change.

5. **Content depth instructions** — Current prompt says nothing about minimum depth, storytelling, case studies, or counter-arguments. The suggestion adds concrete quality expectations. High value.

6. **CTA integration guidance** — Current prompt has no instruction about concluding with a strategic call-to-action leading to the expert's offer. Medium-high value.

7. **max_words increase to 4500** — Current 2000 is too low for authority long-form content. The suggestion's 4500 ceiling matches the agent's purpose. Worth adopting.

### What to Discard (No Real Value or Risk)

1. **Model recommendation (Claude/GPT-4)** — Model is configured via admin panel. Irrelevant to prompt content. Discard.

2. **Temperature change to 0.6** — Current 0.7 is appropriate for blog content that needs both creativity and structure. No change.

3. **max_tokens increase to 6000** — Current 4096 is adequate for the model in use. No change.

4. **presence_penalty/frequency_penalty** — Current values work fine. No change.

5. **"15 years experience" backstory** — Excessive persona detail. Discard.

6. **Markdown headers in output_structure** — The suggestion uses `#` and `##` which violates the production formatting standard. Must use plain text labels only.

7. **Meta Description in output** — The current output_structure includes it, which is useful. Keep it but integrate into the improved structure.

### Implementation Plan

**Single SQL migration** updating 6 fields on `blog-posts`:

**1. system_prompt** — Enhanced with:
- Explicit DNA cross-referencing instruction (extract avatar pain, desire, objections, unique value from loaded context)
- Infoproduct positioning guidance (subtly lead toward expert's paid solution)
- Content depth requirements (storytelling, examples, data, counter-arguments)
- Maintained absolute formatting rules (already correct)

**2. role_definition** — Expanded to include infoproduct content marketing specialization and authority-building expertise

**3. core_function** — Specify deliverables: authority articles that educate, break objections, and naturally lead to conversion, built from minimal briefing plus DNA

**4. output_structure** — Restructured to support dynamic depth: Title, Meta Description, Opening paragraph, multiple content sections (flexible number), Conclusion with strategic CTA — all plain text labels

**5. few_shot_examples** — Add 3 examples:
- Portuguese: Educational article about content production systems for infoproduct creators (~800 words condensed)
- English: Objection-breaking article about high-ticket mentorship pricing (~800 words condensed)
- Spanish: Listicle about launch mistakes with CTA to a course (~600 words condensed)

**6. max_words** — Increase from 2000 to 4500 to match the agent's long-form purpose

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model or temperature changes
- No new dependencies
- Language detection remains automatic via chat-stream
- Formatting rules enforced by existing quality_rules and getUniversalLanguageRules()
- min_words stays at 100 (allows short posts when requested)

### Technical Details

```text
Files changed: 1 new SQL migration

Database update:
  UPDATE agents SET
    system_prompt = '...',
    role_definition = '...',
    core_function = '...',
    output_structure = '...',
    few_shot_examples = '[...]'::jsonb,
    max_words = 4500
  WHERE slug = 'blog-posts';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output_structure text uses plain labels without markdown headers, asterisks, or emojis — consistent with the production formatting standard.

