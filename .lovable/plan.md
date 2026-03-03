

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection (language is detected per-message by chat-stream).
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: Email Marketing Monster — Premium Quality Refinement

### Current State (slug: `email-marketing`)

- **system_prompt** (~570 chars): Functional but generic — no DNA cross-referencing, no infoproduct focus, no email-type strategy guidance
- **role_definition**: Good foundation mentioning open-rate psychology and curiosity triggers
- **core_function**: Adequate but generic — no DNA dependency, no email-type differentiation
- **output_structure**: Simple (Subject Line Options x3, Email Body, CTA) — lacks pre-header, P.S., and type-specific structure
- **quality_rules**: Clean formatting rules already in place, correct
- **few_shot_examples**: Empty array — major gap
- **Model**: temp 0.70, max_tokens 4096, min_words 100, max_words 2000

### Worth Adopting

1. **DNA cross-referencing** — Explicit instruction to extract avatar pain, desire, objections, and proof from loaded DNA context. Currently absent. High value.

2. **Email-type strategy matrix** — The suggestion defines 6 email types (Welcome/Nurture, Launch Warm-up, Sales/Promo, Cart Abandonment, Re-engagement, Educational Sequence) with distinct strategic purposes. Current prompt treats all emails the same. High value.

3. **Length-per-type guidance** — Smart rule: nurture emails can be longer (800-1500 words), sales emails concise (200-600), cart recovery shortest (100-300). Currently no type-specific length guidance. Medium-high value.

4. **"Value Before Sell" principle** — Explicit instruction to deliver useful content before any pitch, especially in nurture sequences. Currently absent. Medium-high value.

5. **Subject line quality rules** — Instruction to avoid spam triggers and make subjects testable. Current output gives 3 options but no quality criteria. Medium value.

6. **Few-shot examples** — Empty array is the biggest gap. Adding 3 examples (PT launch warm-up email, EN direct sales email, ES cart abandonment email) will dramatically improve consistency. Highest impact.

7. **Pre-header and P.S. support** — The suggestion includes optional pre-header text and strategic P.S. for urgency/benefit reinforcement. Current structure lacks both. Medium value.

### Discard

1. **Model recommendation (Claude/GPT-4)** — Admin panel concern. Discard.
2. **Temperature change** — Current 0.7 matches the suggestion. No change.
3. **max_tokens reduction to 2000** — Current 4096 is adequate for longer nurture emails. No change.
4. **presence_penalty/frequency_penalty** — No change.
5. **"12 years experience" backstory** — Excessive persona detail. Discard.
6. **Markdown headers in output_structure** — The suggestion uses `**Subject:**` bold markers. Must use plain text labels consistent with production standard.
7. **min_words/max_words changes** — Suggestion proposes 150/1500. Current 100/2000 provides wider range for flexibility. No change.

### Implementation Plan

**Single SQL migration** updating 5 fields on `email-marketing`:

**1. system_prompt** — Enhanced with:
- DNA cross-referencing instruction (extract avatar pain, desire, objections, proof from loaded context)
- Email-type strategy matrix (6 types with distinct strategic purposes)
- "Value Before Sell" principle for nurture sequences
- Subject line quality guidance (avoid spam triggers, testable)
- Infoproduct positioning (subtly connect content to expert's paid solution)
- Maintained formatting and language rules

**2. role_definition** — Refined to emphasize email funnel mastery across all stages (nurture, launch, sales, recovery, reactivation) and transformation-based persuasion for infoproducts

**3. core_function** — Specify deliverables: complete email with subject line, optional pre-header, body with strategic structure, CTA, and optional P.S. — adapted by email type, built from minimal briefing plus DNA

**4. output_structure** — Enhanced to include email type label, subject line, optional pre-header, body, CTA, and optional P.S. — all plain text labels, no markdown decoration

**5. few_shot_examples** — Add 3 examples:
- Portuguese: Launch warm-up email about "productivity cost of chaos" (storytelling + pain agitation)
- English: Direct sales email for "High-Converting Copy" course (benefits + proof + CTA)
- Spanish: Cart abandonment email for "Lanzamiento en 30 Dias" workshop (gentle reminder + value reinforcement)

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model, temperature, or parameter changes
- No new dependencies
- min_words/max_words remain 100/2000
- Language detection remains automatic via chat-stream
- Formatting rules enforced by existing quality_rules

### Note on Email Monster (slug: `email-monster`)

There is a separate agent `email-monster` focused on email sequences. This refinement targets only `email-marketing` (single email specialist). The `email-monster` agent is not modified by this plan.

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
  WHERE slug = 'email-marketing';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output uses plain labels without markdown headers, asterisks, or emojis — consistent with the production formatting standard.

