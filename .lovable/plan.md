

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection.
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: VSL Monster — Premium Quality Refinement

### Current State (slug: `vsl-monster`)

- **system_prompt** (~490 chars): Functional but generic — no DNA cross-referencing, no structured VSL flow, no infoproduct focus
- **role_definition** (~165 chars): "15+ years" backstory, brief
- **core_function** (~330 chars): Adequate deliverables but no DNA dependency, no duration-based scaling, no scene direction support
- **output_structure**: Clean numbered format (8 sections), compliant with formatting standard — but missing metadata header (type, offer, duration, language), missing P.S. section, missing scene direction cues, no timing brackets
- **quality_rules**: Strong formatting and language detection rules already in place — well done
- **few_shot_examples**: Empty array — major gap
- **Parameters**: temp 0.80, max_tokens 6000, min_words 1000, max_words 5000

### Worth Adopting

1. **DNA cross-referencing** — Explicit instruction to extract avatar pain, desire, objections, and proof from loaded DNA context. Currently absent. High value.

2. **11-section VSL structure** — Current 8-section structure misses Bridge/Credibility (separate from proof), Objection Handling (separate from offer), Urgency/Scarcity (separate from CTA), and P.S. The suggested 11-section flow (Hook → Problem & Agitation → Credibility → Solution → Benefits → Social Proof → Objections & Guarantee → Offer & Urgency → CTA → P.S.) is the standard high-converting VSL format. High value.

3. **Timing brackets and scene directions** — `[00:00 - 01:00]` timestamps and `(Scene: description)` cues make scripts production-ready. Currently absent from output structure. High value.

4. **Metadata header** — Type, Offer, Goal, Estimated Duration, Language as a header block. Currently absent. Medium value.

5. **Duration-based scaling** — Instruction to adjust section lengths proportionally based on desired VSL duration (15 min vs 30 min vs 60 min). Currently absent. Medium-high value.

6. **Few-shot examples** — Empty array is the biggest gap. Adding 2 examples (PT 15-min mentorship VSL, EN 25-min copywriting course VSL) with full timing, scene directions, and dialogue will dramatically improve output consistency. Highest impact.

7. **P.S. section** — Standard VSL closer that reinforces main benefit or urgency. Currently missing from output structure. Medium value.

8. **Infoproduct positioning** — Explicit instruction to position the expert's solution as the inevitable answer to the avatar's problem. Currently generic. Medium-high value.

### Discard

1. **Model recommendation (Claude/GPT-4)** — Admin panel concern. Discard.
2. **Temperature change to 0.6** — Current 0.80 is appropriate for creative storytelling in VSLs. No change.
3. **presence_penalty/frequency_penalty** — Not applicable to current architecture. Discard.
4. **"12 years experience" backstory** — Current "15+ years" is already present. Will refine without excessive persona detail. No dramatic change needed.
5. **Markdown bold in output structure** — Suggestion uses `**Abertura / Hook**` bold markers. Must use plain text labels consistent with production formatting standard. Discard format, adopt structure.
6. **min_words/max_words changes** — Suggestion proposes 2000/10000. Current 1000/5000 is adequate for the max_tokens 6000 context window. Changing to 10000 max_words would exceed token capacity. Keep current values.
7. **max_tokens change to 6000** — Already at 6000. No change.

### Implementation Plan

**Single SQL migration** updating 5 fields on `vsl-monster`:

**1. system_prompt** — Enhanced with:
- DNA cross-referencing instruction (extract avatar pain, desire, objections, proof from loaded context)
- 11-section VSL structure (Hook → Problem & Agitation → Credibility → Solution → Benefits → Social Proof → Objections & Guarantee → Offer & Urgency → CTA → P.S.)
- Duration-based scaling instruction (adjust section proportions to desired length)
- Timing brackets and scene direction requirement
- Infoproduct positioning (expert's solution as inevitable answer)
- All existing formatting prohibitions preserved

**2. role_definition** — Refined to emphasize VSL strategic mastery across all durations, direct response psychology, and production-ready scripting for infoproducts — without excessive backstory

**3. core_function** — Specify deliverables: complete VSL scripts with timing brackets, scene directions, dialogue, metadata header — adapted by duration, built from minimal briefing (offer name, goal, duration, angle) plus DNA

**4. output_structure** — Enhanced to include:
- Metadata header (Type, Offer, Goal, Duration, Language)
- 11 numbered sections with timing bracket format `[00:00 - 01:00]`
- Scene direction cues `(Scene: description)`
- P.S. closing section
- All plain text labels (no markdown bold, no hashtags)

**5. few_shot_examples** — Add 2 examples:
- Portuguese: 15-min VSL for "Mentoria Lançamentos 360" (full script with timing, scene directions, dialogue)
- English: 25-min VSL for "High-Converting Copy Course" (full script with expanded sections, US market pricing)

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model, temperature, or parameter changes
- No new dependencies
- min_words/max_words remain 1000/5000
- max_tokens remains 6000
- temperature remains 0.80
- Language detection remains automatic via chat-stream
- quality_rules field preserved as-is (already strong)
- Existing formatting prohibitions fully preserved

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
  WHERE slug = 'vsl-monster';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output uses plain labels with timing brackets and scene cues — without markdown bold, hashtags, emojis, or decorative elements — consistent with the production formatting standard and existing quality_rules.

