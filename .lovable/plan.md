

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection.
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: Email Monster — Premium Quality Refinement

### Current State (slug: `email-monster`)

- **system_prompt** (~680 chars): Functional, clean formatting rules enforced, language detection present, but no DNA cross-referencing, no sequence-type strategy, no infoproduct focus
- **role_definition**: Good foundation covering sequence types but generic
- **core_function**: Adequate but no DNA dependency, no sequence-type differentiation, no structural elements like P.S.
- **output_structure**: Clean plain-text format with Subject/Body/CTA per email — functional but lacks sequence metadata (type, goal, language) and P.S. support
- **quality_rules**: Strong formatting prohibition rules already in place — well done
- **few_shot_examples**: Empty array — major gap, same issue as email-marketing before refinement
- **Parameters**: temp 0.75, max_tokens 4000, min_words 200, max_words 1000

### Worth Adopting

1. **DNA cross-referencing** — Explicit instruction to extract avatar pain, desire, objections, and proof from loaded DNA context. Currently absent. High value.

2. **Sequence-type strategy matrix** — 7 sequence types (Welcome/Onboarding, Nurture, Launch Warm-up, Sales, Cart Abandonment, Re-engagement, Post-Purchase/Upsell) with distinct strategic purposes and logical flow guidance. Current prompt lists types but provides no strategic differentiation. High value.

3. **Logical progression rule** — Explicit instruction to structure sequences following problem → education → solution → offer → urgency flow. Currently absent. High value.

4. **Length-per-type guidance** — Nurture emails longer (500-1000 words), sales emails concise (200-400), cart recovery shortest (100-200). Currently no type-specific length guidance. Medium-high value.

5. **Sequence metadata header** — Adding type, goal, number of emails, and detected language as a header block provides professional structure. Currently absent. Medium value.

6. **Few-shot examples** — Empty array is the biggest gap. Adding 3 examples (PT 5-email launch warm-up nurture sequence, EN 3-email direct sales sequence, ES 2-email cart abandonment sequence) will dramatically improve consistency and output quality. Highest impact.

7. **P.S. support** — Strategic P.S. for urgency/benefit reinforcement in closing emails. Currently absent from output structure. Medium value.

8. **Educational balance principle** — Explicit instruction to balance value delivery with strategic promotion, especially in nurture sequences. Currently absent. Medium-high value.

### Discard

1. **Model recommendation (Claude/GPT-4)** — Admin panel concern. Discard.
2. **Temperature change to 0.7** — Current 0.75 is fine for creative sequence writing. No change.
3. **max_tokens change to 3000** — Current 4000 is better for longer sequences (7-10 emails). No change.
4. **presence_penalty/frequency_penalty** — Not applicable to current architecture. Discard.
5. **"10 years experience" backstory** — Excessive persona detail. Discard.
6. **Markdown headers (##) in output structure** — The suggestion uses `## Email 1:` headers. Must use plain text labels consistent with production formatting standard (no hashtags). Discard format, adopt structure.
7. **min_words/max_words changes** — Suggestion proposes 80/1000. Current 200/1000 is appropriate for multi-email sequences. No change.
8. **"Observações finais" section** — Suggestion includes sending tips and interval suggestions at end. This contradicts existing quality_rules which prohibit delivery timing advice. Discard.
9. **Italic CTA markers** — Suggestion uses `*Call to Action:*` italic formatting. Must use plain text label `CTA:` consistent with current standard. Discard.

### Implementation Plan

**Single SQL migration** updating 5 fields on `email-monster`:

**1. system_prompt** — Enhanced with:
- DNA cross-referencing instruction (extract avatar pain, desire, objections, proof from loaded context)
- Sequence-type strategy matrix (7 types with distinct strategic purposes)
- Logical progression rule (problem → education → solution → offer → urgency)
- Educational balance principle for nurture sequences
- Infoproduct positioning (balance education with strategic promotion)
- All existing formatting prohibitions preserved

**2. role_definition** — Refined to emphasize sequence strategy mastery across all funnel stages and transformation-based persuasion for infoproducts, without the "10 years" backstory

**3. core_function** — Specify deliverables: complete email sequences with subject line per email, body with strategic structure, CTA, and optional P.S. on closing emails — adapted by sequence type, built from minimal briefing (type, goal, offer, number of emails) plus DNA

**4. output_structure** — Enhanced to include:
- Sequence metadata header (type, goal, number of emails)
- Per-email structure: purpose label, subject line, body, CTA, optional P.S.
- All plain text labels (no markdown headers, no italic markers)
- Consistent with existing production formatting standard

**5. few_shot_examples** — Add 3 examples:
- Portuguese: 5-email launch warm-up nurture sequence for "Mentoria Lançamentos 360" (progressive education + desire building)
- English: 3-email direct sales sequence for "High-Converting Copy Course" (benefits + proof + urgency close)
- Spanish: 2-email cart abandonment sequence for "Workshop Productividad 10x" (gentle reminder + bonus incentive)

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model, temperature, or parameter changes
- No new dependencies
- min_words/max_words remain 200/1000
- max_tokens remains 4000
- temperature remains 0.75
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
  WHERE slug = 'email-monster';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output uses plain labels without markdown headers, asterisks, emojis, or decorative elements — consistent with the production formatting standard and existing quality_rules.

