# Button

The first shared component in the Reason-inspired component pass. Implementation: `src/ui/Button.tsx`; styles: `src/styles/button.css`, loaded once by `src/main.tsx`.

## Appearance

The installed Reason 0.1.120 interface is the visual reference for compact pill actions, quiet neutral surfaces, and restrained borders. A Gent uses original code, its own semantic colors, and the existing Inter font.

| Variant | Use |
| --- | --- |
| `primary` | Main action; ink-colored fill and contrasting label |
| `secondary` | Alternative action; subtle neutral fill and border |
| `quiet` | Low-emphasis action such as Cancel |
| `danger` | Destructive action; red label with a quiet red surface |
| `text` | Action within content |

Small/default/large buttons are 28/32/36px high with 12/13/14px text. Text buttons have a 24px minimum height. Icon buttons use an 8px radius, while their toolbar contexts retain the existing sizes. Labelled actions receive larger touch targets. Hover styles are limited to fine pointers; pressed and keyboard states respond immediately.

## Usage

```tsx
import { Button, IconButton } from './ui/Button';
import { Plus, Copy } from 'lucide-react';

<Button variant="primary" type="submit" loading={saving} disabled={!valid}>
  Save changes
</Button>

<Button size="sm" leadingIcon={<Plus />} onClick={createAgent}>
  Add agent
</Button>

<IconButton label="Copy link" onClick={copyLink}>
  <Copy size={16} />
</IconButton>
```

The default type is `button`; submit actions explicitly use `type="submit"`. Native button attributes, events, and React 19 refs are forwarded. Optional `leadingIcon` and `trailingIcon` slots are decorative; an icon-only button needs `IconButton`'s `label`.

`loading` sets `aria-busy`, disables repeated activation, and overlays a spinner while retaining the content's measured width. `loadingLabel` optionally changes the accessible name. Only the active action shows loading in forms with Save/Delete or Save/Archive actions. Reduced motion replaces the rotating indicator with its static glyph while retaining the busy semantics.

## Preview

Run `npm run dev` and open `/?component=button`. The preview is development-only and is excluded from the production build. It displays every variant in default, disabled, and loading states, all sizes, icon slots, keyboard focus, and a live loading example. Its theme and action examples do not modify workspace data.

## Validation

- Typecheck and production build pass.
- Computer Use verified native keyboard activation, disabled controls being skipped, a visible 2px focus ring, Cancel versus submit behavior, and Enter submission in the group form.
- Loading example measured 137.117px wide before, during, and after loading.
- Enabled default, hover, and pressed text contrast checked on the preview surface: light-theme minimum 4.91:1; dark-theme minimum 5.77:1. Default-state minima are 5.98:1 and 6.67:1 respectively. This is a focused contrast check, not a full axe audit.
- Preview checked at 1280px and 390px widths without page overflow. Touch emulation at 390px reports 36/40/44px labelled action targets. Reduced-motion mode reports `animation-name: none` on the loading glyph.
- Fake-provider connection completed from the migrated action button. The QA host uses a separate temporary workspace and the test Codex adapter.
- macOS DMG/ZIP rebuilt. Packaged JS/CSS hashes match the production build, the development preview is excluded, and the packaged app starts its local host.
- Automated Playwright suites were not rerun in this pass.

Previews: [dark](screenshots/button-component-dark.jpg), [light](screenshots/button-component-light.jpg), [mobile](screenshots/button-component-mobile.jpg), [dialog integration](screenshots/button-in-dialog.jpg).
