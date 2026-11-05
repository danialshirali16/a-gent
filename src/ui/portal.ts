/**
 * Overlays rendered with position: fixed must live inside the native dialog
 * top layer when one is open, otherwise they appear behind the dialog.
 */
export function overlayRoot(): HTMLElement {
  const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open]');
  return dialogs.length ? dialogs[dialogs.length - 1] : document.body;
}
