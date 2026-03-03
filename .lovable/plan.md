

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection (language is detected per-message by chat-stream).
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: Cart Recovery Monster — Premium Quality Refinement

### Current State

- **system_prompt** (571 chars): Functional but generic — no DNA cross-referencing, no infoproduct focus, no escalation psychology guidance
- **role_definition**: Good foundation with urgency escalation and objection neutralization mentions
- **core_function**: Adequate but lacks specificity about deliverables and DNA dependency
- **output_structure**: Solid 4-email + optional WhatsApp structure with plain text labels — well formatted
- **quality_rules**: Good formatting and language rules already in place
- **few_shot_examples**: Empty array — major gap
- **Model**: temp 0.70, max_tokens 4000, min_words 800, max_words 2500

### Worth Adopting

1. **DNA cross-referencing in system_prompt** — Currently absent. Explicit instruction to extract avatar pain, desire, objections, and proof from loaded DNA context will make every recovery email personalized and strategically aligned. High value.

2. **Infoproduct-specific recovery psychology** — Current prompt is generic e-commerce. The suggestion focuses on digital education products (courses, mentorships, e-books), which require different recovery angles (transformation vs. physical product). Adding this specialization improves relevance. High value.

3. **Escalating urgency model** — Current output_structure implies escalation but the system_prompt doesn't instruct it explicitly. The suggestion's flow (Friendly Reminder → Value Reinforcement → Incentive/Urgency → Last Chance → Final Attempt) with clear psychological purpose per email is more precise. Medium-high value.

4. **Incentive timing strategy** — The suggestion adds a smart rule: offer discounts only from email 3 onward, to avoid conditioning customers to always wait for deals. Currently absent. Medium-high value.

5. **Few-shot examples** — Empty array is the biggest quality gap. Adding 3 examples (PT 4-email sequence without incentive, EN 5-email sequence with 10% off on email 3, ES 3-email sequence with bonus) will dramatically improve consistency. Highest impact.

6. **Non-invasive tone instruction** — The suggestion emphasizes gentle, non-aggressive tone that avoids blaming the customer. Current prompt says "reassuring" but the suggestion makes this more explicit. Medium value.

### Discard

1. **Model recommendation (Claude/GPT-4)** — Admin panel concern. Discard.
2. **Temperature change** — Current 0.7 matches the suggestion. No change needed.
3. **max_tokens reduction to 2000** — Current 4000 is adequate for 5-email sequences. No change.
4. **presence_penalty/frequency_penalty** — No change.
5. **"8 years experience" backstory** — Excessive persona detail. Discard.
6. **Markdown headers in output_structure** — The suggestion uses `#` and `##` which violates production formatting standard. Must keep plain text labels.
7. **Emoji in subject lines** — The suggestion's few-shot examples include emojis in subject lines (⏳, 🎁). These must be removed to comply with the clean formatting standard.
8. **WhatsApp removal** — Current output_structure includes optional WhatsApp recovery messages. Keep them — they add value for the infoproduct market.
9. **min_words/max_words changes** — Suggestion proposes 500/2000. Current 800/2500 is better for complete sequences with WhatsApp. No change.

### Implementation Plan

**Single SQL migration** updating 5 fields on `cart-recovery-monster`:

**1. system_prompt** — Enhanced with:
- Explicit DNA cross-referencing instruction (extract avatar pain, desire, objections, proof from loaded context)
- Infoproduct-specific recovery psychology (digital education products require transformation-based appeals, not just product reminders)
- Escalating urgency model with clear purpose per email position
- Incentive timing rule (discounts/bonuses only from email 3 onward)
- Non-invasive tone instruction (gentle persistence, never blame the customer)
- Maintained formatting and language rules

**2. role_definition** — Refined to emphasize infoproduct recovery specialization and transformation-based persuasion

**3. core_function** — Specify deliverables: complete email sequence with optional WhatsApp messages, each with subject line, body, and CTA — built from minimal briefing plus DNA, with escalating urgency and strategic incentive placement

**4. output_structure** — Keep current plain text structure (already clean), add timing annotations per email and explicit CTA labels

**5. few_shot_examples** — Add 3 examples:
- Portuguese: 4-email sequence for "Mentoria Lançamentos 360" without incentive (value + scarcity focus)
- English: 5-email sequence for "High-Converting Copy Course" with 10% off on email 3
- Spanish: 3-email sequence for "Curso de Embudos de Venta" with bonus on email 3

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model, temperature, or parameter changes
- No new dependencies
- min_words/max_words remain 800/2500
- Language detection remains automatic via chat-stream
- WhatsApp recovery messages preserved in output
- Formatting rules enforced by existing quality_rules

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
  WHERE slug = 'cart-recovery-monster';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output uses plain labels without markdown headers, asterisks, or emojis — consistent with the production formatting standard.

