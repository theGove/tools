import van from "vanjs-core";
import { tag } from "./dom";
import type { MessageOptions, MsgDialogElement, ShowToastFn } from "./types";

const { button, div, span, style } = van.tags;

const MSG_STYLES = `
            #msg-galley { pointer-events:none; }
            .msg-dialog { pointer-events:auto; width:100%; background:#fff;
                          box-shadow:0 4px 24px rgba(0,0,0,0.22); position:relative;
                          overflow:hidden; box-sizing:border-box; }
            .msg-title   { padding:10px 36px 8px 14px; font-weight:600; font-size:14px; color:#fff; }
            .msg-info    .msg-title { background:#2196f3; }
            .msg-warning .msg-title { background:#ff9800; }
            .msg-error   .msg-title { background:#f44336; }
            .msg-message { padding:10px 14px; font-size:13px; color:#333; border-radius:0; }
            .msg-button-bar { display:flex; justify-content:flex-end; gap:8px; padding:8px 14px 12px; }
            .msg-button-bar button { padding:4px 14px; border-radius:4px; border:1px solid #ccc;
                                     cursor:pointer; font-size:13px; background:#f0f0f0; }
            .msg-button-bar button:hover { background:#e0e0e0; }
            .msg-close { position:absolute; top:8px; right:8px; cursor:pointer; color:#000;
                         line-height:1; display:flex; align-items:center;
                         background:#d0d0d0; border:1px solid #000; border-radius:3px; padding:1px 2px; }
            .msg-close:hover { background:#bbb; }
            .msg-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:9998; }
        `;

/** Ensures the toast host element exists on the page. */
function getToastEl(): HTMLElement {
  let el = tag("toast");
  if (!el) {
    el = div({ id: "toast", hidden: true });
    document.body.appendChild(el);
  }
  return el;
}

/** Auto-hide timer for showToast (avoids recursive typed property on the fn). */
let showToastTimer: ReturnType<typeof setTimeout> | undefined;

export const showToast: ShowToastFn = function showToast(message, kind) {
  const toastEl = getToastEl();
  toastEl.textContent = message;
  toastEl.className = "toast" + (kind ? " " + kind : "");
  toastEl.hidden = false;
  clearTimeout(showToastTimer);
  showToastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 3200);
};

/** Closes the message dialog that contains the event target (or none). */
export function closeMessage(evt?: Event): void {
  let dialog: MsgDialogElement | null | undefined;
  if (evt && evt.target) {
    let elem: Node | null = evt.target as Node;
    while (elem && !(elem instanceof HTMLElement && elem.classList.contains("msg-dialog"))) {
      elem = elem.parentNode;
    }
    dialog = elem instanceof HTMLElement ? (elem as MsgDialogElement) : null;
  }
  if (dialog) {
    if (dialog._msgOverlay) dialog._msgOverlay.remove();
    dialog.remove();
  }
}

/**
 * Shows an in-page message dialog.
 * @param options - Dialog content and behavior.
 */
export function message({
  text: messageHtml = "An error occurred.",
  title: titleText = "System Message",
  buttons: callbacks = [{ text: "OK", fn: closeMessage }],
  seconds: secondsUntilClose,
  type = "info",
  modal = false,
}: MessageOptions = {}): void {
  let galley = tag("msg-galley");
  if (!galley) {
    galley = div({
      id: "msg-galley",
      style:
        "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;min-width:300px;max-width:min(500px,90vw);",
    });
    document.body.appendChild(galley);
  }

  if (!tag("msg-styles")) {
    van.add(document.head, style({ id: "msg-styles" }, MSG_STYLES));
  }

  let overlay: HTMLDivElement | null = null;
  if (modal) {
    overlay = div({ class: "msg-overlay" });
    document.body.appendChild(overlay);
  }

  const dialog = div({ class: "msg-dialog msg-" + type }) as MsgDialogElement;
  dialog._msgOverlay = overlay;

  const closeIcon = span({
    class: "material-symbols-outlined",
    style: "font-size:calc(15px * var(--font-zoom, 1))",
  }, "close");
  const closeBtn = div({ class: "msg-close", onclick: closeMessage }, closeIcon);
  van.add(dialog, closeBtn);

  van.add(dialog, div({ class: "msg-title" }, titleText));

  const messagePane = div({ class: "msg-message" });
  messagePane.innerHTML = messageHtml;
  van.add(dialog, messagePane);

  if (callbacks.length > 0) {
    const buttonBar = div(
      { class: "msg-button-bar" },
      ...callbacks.map((cb) =>
        button({ onclick: (evt: Event) => cb.fn(evt) }, cb.text),
      ),
    );
    van.add(dialog, buttonBar);
  }

  van.add(galley, dialog);

  if (secondsUntilClose) {
    const timeoutId = setTimeout(() => {
      if (overlay) overlay.remove();
      dialog.remove();
    }, secondsUntilClose * 1000);
    dialog.addEventListener("mousemove", () => clearTimeout(timeoutId));
  }
}
