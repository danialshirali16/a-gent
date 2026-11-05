# Input and Textarea

Completed: 2026-11-05. The second shared component family in the [component checklist](component-roadmap.md).

Implementation: `src/ui/Input.tsx`; styles: `src/styles/input.css`, loaded once by `src/main.tsx`.

## Appearance

Reason's installed interface is the reference for the compact geometry, neutral fill, subtle border, and small rounded corners. A Gent retains its own code, branding, and Inter font.

- Small/default/large inputs: 28/32/36px high with 12/13/14px text and an 8px radius.
- Textareas: four rows by default, 96px minimum height, 320px maximum height, and vertical resizing. Callers can supply `rows`.
- Narrow layouts and coarse pointers: 44px input height, 16px text, and at least 112px textarea height.
- Focus: immediate 2px accent outline. Invalid fields use a red border and focus outline; callers supply the associated error message.
- Read-only fields remain focusable and selectable. Disabled fields use native disabled behavior and reduced opacity.
- Editing, focus, and state changes are immediate; these frequently used controls add no animation.

## Usage

```tsx
import { Input, Textarea } from './ui/Input';

<label htmlFor="agent-name">Agent name</label>
<Input
  id="agent-name"
  value={name}
  onChange={event => setName(event.target.value)}
  required
  maxLength={80}
  aria-invalid={invalid || undefined}
  aria-describedby={invalid ? 'name-error' : undefined}
/>
{invalid && <p id="name-error" role="alert">Enter an agent name.</p>}

<label htmlFor="agent-instructions">Instructions</label>
<Textarea
  id="agent-instructions"
  value={instructions}
  onChange={event => setInstructions(event.target.value)}
  rows={5}
/>
```

Both components forward native attributes, events, and React 19 refs. `controlSize="sm" | "md" | "lg"` controls appearance while preserving the input's native numeric `size` attribute. `Input` accepts native text, email, password, number, search, telephone, URL, and date/time types. File inputs, checkboxes, and switches are separate controls. Labels, helper text, and validation messages remain explicit at call sites; a shared Field component is next.

## Integration

15 controls now use the shared implementation: agent names/descriptions/instructions, group names, conversation titles, scheduled task names/instructions/date-time, host address/token, provider URL/key/model ID, and device name. Existing controlled values, limits, required attributes, submit behavior, and native date/password semantics are preserved.

The composer and search-specific containers retain their existing controls until their checklist passes. Legacy field CSS excludes the new components without increasing selector specificity. The device-name row delegates styling to Input.

## Preview and validation

Run `npm run dev` and open `/?component=input`. Button and Input/Textarea previews share navigation and a theme toggle. These development-only pages do not modify workspace data and are excluded from production.

- Typecheck, production build, and macOS DMG/ZIP build pass. Packaged JS/CSS bytes match `dist`, and preview code is excluded.
- Computer Use checked native keyboard order, visible focus, disabled-field skipping, unchanged read-only values, password masking, error descriptions, and ref-based focus on invalid submission.
- The live preview accepts multiline text, keeps Enter as a newline in Textarea, and submits from Input. Correcting a missing name clears the error association.
- Enabled field text, placeholder, read-only text, and error-message contrast checked on the preview surface: minimum 4.97:1 in light and 5.04:1 in dark. This is a focused contrast check, not a full accessibility audit.
- Checked at 1280px and 390px widths without horizontal overflow. Touch emulation reports 44px fields with 16px text and 112px textareas. Temporary browser emulation was reset afterward.
- Agent form checked with multiline English/Persian text; Cancel created no agent. Settings device-name styling and unchanged search styling checked. The scheduled date field retains native `datetime-local` semantics and required validation.
- Rebuilt Mac app launched; its agent form renders the new controls and Cancel returns to the workspace. No agent was created in the native workspace.
- Automated Playwright/axe/E2E suites were not rerun for this pass.

Screenshots: [dark](screenshots/input-component-dark.jpg), [light](screenshots/input-component-light.jpg), [mobile input](screenshots/input-component-mobile.jpg), [mobile textarea](screenshots/textarea-component-mobile.jpg), [form integration](screenshots/input-in-dialog.jpg), [packaged Mac](screenshots/input-mac.jpg).
