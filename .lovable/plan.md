

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection.
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: WhatsApp Sales Monster — Premium Quality Refinement

### Current State (slug: `whatsapp-sales-monster`)

- **system_prompt** (~620 chars): Functional with language detection and formatting rules, but no DNA cross-referencing, no infoproduct focus, no sequence-type differentiation
- **role_definition** (~310 chars): Good foundation — mentions rapport, qualification, objection handling
- **core_function** (~290 chars): Adequate conversation stages but no DNA dependency, no briefing-based adaptation
- **output_structure**: Clean plain-text format with 6 messages + 3 follow-ups — functional but lacks sequence metadata (audience, goal, language) and is rigidly fixed at 6+3 instead of flexible
- **quality_rules**: Strong formatting prohibition rules already in place — well done
- **few_shot_examples**: Empty array — major gap
- **Parameters**: temp 0.80, max_tokens 2000, min_words 300, max_words 800

### Worth Adopting

1. **DNA cross-referencing** — Explicit instruction to extract avatar pain, desire, objections, and proof from loaded DNA context. Currently absent. High value.

2. **Flexible sequence structure** — Current output is rigidly fixed at 6 messages + 3 follow-ups. The suggestion provides an 8-step framework (Introduction → Value → Problem ID → Solution → Proof → Objections → CTA → Follow-up) that adapts to user-requested length (5, 7, 10 messages). High value.

3. **Permission-based approach** — WhatsApp-specific best practice: ask permission before continuing ("Tudo bem se eu compartilhar?"). Currently absent. Medium-high value.

4. **Sequence metadata header** — Adding audience, goal, number of messages, and detected language as a header block. Currently absent. Medium value.

5. **Few-shot examples** — Empty array is the biggest gap. Adding 3 examples (PT 5-message direct sale, EN 4-message discovery call scheduling, ES 6-message workshop sale) will dramatically improve consistency. Highest impact.

6. **Value-before-sell principle** — Explicit instruction to deliver useful insight before presenting the offer, respecting the personal nature of WhatsApp. Currently implied but not explicit. Medium-high value.

7. **Infoproduct positioning** — Focus on courses, mentorships, workshops. Currently generic ("coaching, services, digital products, high-ticket"). Medium value.

### Discard

1. **Model recommendation (Claude/GPT-4)** — Admin panel concern. Discard.
2. **Temperature change to 0.7** — Current 0.80 is fine for conversational tone. No change.
3. **max_tokens change to 1500** — Current 2000 is better for longer sequences (10 messages). No change.
4. **presence_penalty/frequency_penalty** — Not applicable to current architecture. Discard.
5. **"8 years experience" backstory** — Excessive persona detail. Discard.
6. **Markdown headers (##) in output structure** — Must use plain text labels consistent with production standard. Discard format, adopt structure.
7. **min_words/max_words changes** — Suggestion proposes 15/150 per message. Current 300/800 refers to total sequence output, which is appropriate. No change.
8. **"Observações" section** — Sending tips and timing advice contradicts existing quality_rules which prohibit automation/funnel strategy advice. Discard.
9. **Timing suggestions in parentheses** — e.g., "*(Enviar 2-3 dias após)*". This is delivery timing advice, prohibited by current quality_rules. Discard.

### Implementation Plan

**Single SQL migration** updating 5 fields on `whatsapp-sales-monster`:

**1. system_prompt** — Enhanced with:
- DNA cross-referencing instruction (extract avatar pain, desire, objections, proof from loaded context)
- Flexible sequence structure (adapt message count to user request, not fixed at 6+3)
- Permission-based approach for WhatsApp etiquette
- Value-before-sell principle
- Infoproduct positioning (courses, mentorships, workshops)
- All existing formatting prohibitions preserved

**2. role_definition** — Refined to emphasize conversational sales mastery for infoproducts, permission-based rapport building, and mobile-optimized persuasion — without the "8 years" backstory

**3. core_function** — Specify deliverables: complete WhatsApp sales sequences with metadata header, flexible message count, natural conversation flow — adapted by goal (direct sale, call scheduling, webinar registration), built from minimal briefing (audience, goal, offer, message count) plus DNA

**4. output_structure** — Enhanced to include:
- Sequence metadata header (audience, goal, number of messages)
- Flexible per-message structure: purpose label, message text
- Follow-up messages section (if applicable)
- All plain text labels (no markdown headers, no italic markers)

**5. few_shot_examples** — Add 3 examples:
- Portuguese: 5-message direct sale sequence for "Mentoria Lançamentos 360"
- English: 4-message discovery call scheduling for "High-Converting Copy Course"
- Spanish: 6-message workshop sale for "Workshop Productividad 10x"

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model, temperature, or parameter changes
- No new dependencies
- min_words/max_words remain 300/800
- max_tokens remains 2000
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
  WHERE slug = 'whatsapp-sales-monster';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output uses plain text without markdown headers, asterisks, emojis, or decorative elements — messages look exactly like real WhatsApp messages, consistent with the production formatting standard and existing quality_rules.

