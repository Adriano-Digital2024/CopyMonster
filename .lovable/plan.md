

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection (language is detected per-message by chat-stream).
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: Carousel Monster — Premium Quality Refinement

### Current State

- **system_prompt**: Functional but lacks DNA cross-referencing, per-slide word discipline, and platform awareness
- **role_definition**: One line — "World-class carousel post specialist"
- **core_function**: One line — generic
- **output_structure**: Includes hashtag suggestions and alternative titles (useful), but flat format with no per-slide visual guidance
- **quality_rules**: Standard formatting rules, correct
- **few_shot_examples**: Empty array — major gap
- **Model**: temp 0.80, max_tokens 3000, min_words 200, max_words 800

### Worth Adopting

1. **DNA cross-referencing** — Explicit instruction to extract avatar pain, desire, and unique angle from loaded DNA context. Currently absent. High value.

2. **Persuasive slide flow model** — The suggestion defines a clear narrative arc (Hook → Problem → Value slides → Authority → CTA) with explicit purpose per slide position. Current prompt mentions this loosely but the suggestion makes it structural. High value.

3. **Per-slide conciseness instruction** — Carousel slides must be scannable. Adding explicit guidance (max ~50 words per slide, one idea per slide) improves output quality. Currently absent. Medium-high value.

4. **Visual suggestion per slide** — Brief design notes alongside copy help users go straight to design. The suggestion includes this; current prompt does not. Medium-high value.

5. **Few-shot examples** — Empty array is the biggest gap. Adding 3 examples (PT 7-slide launch errors, EN 5-slide copy tips, ES 6-slide productivity habits) will dramatically improve consistency. Highest impact.

6. **Infoproduct positioning** — Instruction to subtly connect educational content to the expert's paid solution in a strategic slide. Currently absent. Medium value.

### Discard

1. **Model recommendation (Claude/GPT-4)** — Admin panel concern. Discard.
2. **Temperature change to 0.7** — Current 0.8 is fine for creative social content. No change.
3. **max_tokens reduction to 1500** — Current 3000 is adequate. No change.
4. **presence_penalty/frequency_penalty** — No change.
5. **"7 years experience" backstory** — Excessive persona detail. Discard.
6. **Markdown headers in output_structure** — The suggestion uses `#` and `##` which violates production formatting standard. Must use plain text labels.
7. **Hashtag removal** — Current output_structure includes hashtag suggestions which are useful for social posts. Keep them.

### Implementation Plan

**Single SQL migration** updating 5 fields on `carousel-monster`:

**1. system_prompt** — Enhanced with:
- DNA cross-referencing instruction (extract avatar pain, desire, objections, unique angle)
- Persuasive slide flow model (Hook → Problem → Value → Authority → CTA)
- Per-slide conciseness rule (one idea per slide, max ~50 words)
- Visual suggestion instruction (brief design note per slide)
- Infoproduct positioning guidance (connect content to expert's offer in strategic slide)
- Maintained formatting rules

**2. role_definition** — Expanded to include carousel storytelling mastery, platform expertise (Instagram/LinkedIn/Facebook), and infoproduct content specialization

**3. core_function** — Specify deliverables: slide-by-slide copy with visual suggestions, narrative arc, caption, hashtags, and title variations — built from minimal briefing plus DNA

**4. output_structure** — Restructured to show per-slide blocks (slide number, title/purpose, copy text, visual suggestion) followed by caption, hashtags, and title variations — all plain text labels

**5. few_shot_examples** — Add 3 examples:
- Portuguese: 7-slide carousel about launch mistakes (educational + authority)
- English: 5-slide carousel about copy tips (authority + engagement)
- Spanish: 6-slide carousel about morning productivity habits (inspiration + authority)

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model, temperature, or parameter changes
- No new dependencies
- min_words/max_words remain 200/800
- Language detection remains automatic via chat-stream
- Hashtag suggestions and title variations preserved in output

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
  WHERE slug = 'carousel-monster';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output uses plain labels without markdown headers, asterisks, or emojis.

