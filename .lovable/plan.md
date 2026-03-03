

## Confirmations

- All system prompts will remain in English.
- Few-shot examples in multiple languages will not interfere with automatic language detection.
- Final outputs will always match the detected user language (EN/PT/ES).
- No changes will be made to language detection logic.

---

## Analysis: Landing Pages Monster — Premium Quality Refinement

### Current State (slug: `landing-pages`)

- **system_prompt** (~780 chars): Functional with language detection, formatting rules, and vague-input handling — but no DNA cross-referencing, no infoproduct focus, no structured section flow
- **role_definition** (~310 chars): Good foundation — mentions persuasion psychology and buyer awareness levels
- **core_function** (~260 chars): Basic — asks clarifying questions if info missing, but no DNA dependency, no briefing-based adaptation, no goal differentiation
- **output_structure**: 7 sections (Headline, Subheadline, Hero, Benefits, Social Proof, CTA, FAQ) — missing Problem Agitation, Offer Details, Guarantee, Objection Handling, P.S., and Urgency sections
- **quality_rules**: Strong formatting prohibition rules already in place — well done
- **few_shot_examples**: Empty array — major gap
- **Parameters**: temp 0.70, max_tokens 4096, min_words 100, max_words 2000

### Worth Adopting

1. **DNA cross-referencing** — Explicit instruction to extract avatar pain, desire, objections, and proof from loaded DNA context. Currently absent. High value.

2. **11-section landing page structure** — Current 7-section structure misses critical conversion elements: Problem Agitation, Offer/Solution Details, Objection Handling, Guarantee/Risk Reversal, Urgency/Scarcity, and P.S. The suggested structure follows the standard high-converting landing page format. High value.

3. **Goal differentiation** — Landing pages serve different goals (direct sale, lead capture, webinar registration, waitlist). Current prompt treats all pages the same. The suggestion adds goal-aware adaptation. Medium-high value.

4. **Infoproduct positioning** — Explicit focus on courses, mentorships, workshops, e-books. Currently generic. Medium value.

5. **Few-shot examples** — Empty array is the biggest gap. Adding 3 examples (PT direct sale mentorship, EN direct sale copywriting course, ES direct sale workshop) will dramatically improve consistency. Highest impact.

6. **P.S. closing section** — Standard landing page closer that reinforces urgency or main benefit. Currently missing. Medium value.

7. **min_words/max_words adjustment** — Current 100/2000 is too low for complete landing pages. Suggestion proposes 800/3500 which better reflects actual landing page lengths. High value.

### Discard

1. **Model recommendation (Claude/GPT-4)** — Admin panel concern. Discard.
2. **Temperature change to 0.6** — Current 0.70 is appropriate for creative landing page copy. No change.
3. **max_tokens change to 4000** — Current 4096 is essentially the same. No change.
4. **presence_penalty/frequency_penalty** — Not applicable to current architecture. Discard.
5. **"10 years experience" backstory** — Excessive persona detail. Discard.
6. **Markdown headers (#, ##) in output structure** — Suggestion uses `# [Headline]` and `## [Subheadline]`. Must use plain text labels consistent with production standard. Discard format, adopt structure.
7. **Bold markers in output** — Suggestion uses `**Apresente a solução**`. Must remain plain text per existing quality_rules. Discard.

### Implementation Plan

**Single data update** modifying 6 fields on `landing-pages`:

**1. system_prompt** — Enhanced with:
- DNA cross-referencing instruction (extract avatar pain, desire, objections, proof from loaded context)
- 11-section landing page structure (Headline → Subheadline → Problem Agitation → Solution/Offer → Benefits → Social Proof → Objection Handling → Guarantee → CTA → Urgency → P.S.)
- Goal-aware adaptation (direct sale, lead capture, webinar registration)
- Infoproduct positioning
- All existing formatting prohibitions preserved

**2. role_definition** — Refined to emphasize conversion-focused landing page mastery for infoproducts, understanding of buyer awareness levels, and multi-goal page strategies

**3. core_function** — Specify deliverables: complete landing page copy with all 11 sections, adapted by goal (sale, lead capture, registration), built from minimal briefing (offer name, goal, optional angle) plus DNA

**4. output_structure** — Enhanced to include all 11 sections with plain text labels:
- Headline, Subheadline, Problem Agitation, Solution/Offer, Benefits List, Social Proof, Objection Handling, Guarantee, CTA, Urgency/Scarcity, P.S.

**5. few_shot_examples** — Add 3 examples:
- Portuguese: Direct sale landing page for "Mentoria Lançamentos 360"
- English: Direct sale landing page for "High-Converting Copy Course"
- Spanish: Direct sale landing page for "Workshop Productividad 10x"

**6. min_words/max_words** — Adjust from 100/2000 to 800/3500 to match actual landing page output requirements

### What Will NOT Change

- No frontend/UI changes
- No schema changes
- No i18n file changes
- No edge function changes
- No model changes
- No new dependencies
- max_tokens remains 4096
- temperature remains 0.70
- Language detection remains automatic via chat-stream
- quality_rules field preserved as-is (already strong)
- Existing formatting prohibitions fully preserved

### Technical Details

```text
Files changed: 0 (data update only via insert tool)

Database update:
  UPDATE agents SET
    system_prompt = '...',
    role_definition = '...',
    core_function = '...',
    output_structure = '...',
    few_shot_examples = '[...]'::jsonb,
    min_words = 800,
    max_words = 3500
  WHERE slug = 'landing-pages';
```

Few-shot examples stored as JSON array matching the existing `{input, output}` structure. All output uses plain text without markdown headers, bold markers, emojis, or decorative elements — consistent with production formatting standard and existing quality_rules.

