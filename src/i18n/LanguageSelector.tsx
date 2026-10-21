import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { i18n, selectLocale, translateText } from "./config";
import { languages, validLocale } from "./languages";
import "./localization.css";

export function LanguageSelector() {
  useTranslation("common", { i18n, useSuspense: false });
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const host = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    search = useRef<HTMLInputElement>(null);
  const active = languages.find(
    (language) => language.code === validLocale(i18n.language),
  )!;
  const filtered = languages.filter((language) =>
    `${language.nativeName} ${language.code} ${language.region}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const close = (event: PointerEvent) => {
      if (!host.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div className="ml-locale" ref={host} data-i18n-protect>
      <button
        ref={trigger}
        type="button"
        className="ml-locale-trigger"
        aria-label={translateText("Choose language")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={17} />
        <span>{active.nativeName}</span>
      </button>
      {open && (
        <div
          className="ml-locale-menu"
          role="dialog"
          aria-label={translateText("Choose language")}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              trigger.current?.focus();
            }
            if (
              ["ArrowDown", "ArrowUp", "Home", "End", "Tab"].includes(event.key)
            ) {
              const items = Array.from(
                host.current?.querySelectorAll<HTMLElement>("input, button") ??
                  [],
              ).filter(
                (item) =>
                  item !== trigger.current && !item.hasAttribute("disabled"),
              );
              const index = items.indexOf(
                document.activeElement as HTMLElement,
              );
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? items.length - 1
                    : (index +
                        (event.key === "ArrowUp" || event.shiftKey ? -1 : 1) +
                        items.length) %
                      items.length;
              event.preventDefault();
              items[next]?.focus();
            }
          }}
        >
          <input
            ref={search}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={translateText("Search languages")}
            aria-label={translateText("Search languages")}
          />
          <div className="ml-locale-options" aria-busy={busy}>
            {[...new Set(filtered.map((language) => language.region))].map(
              (region) => (
                <section key={region} aria-label={region}>
                  <h3>{translateText(region)}</h3>
                  {filtered
                    .filter((language) => language.region === region)
                    .map((language) => (
                      <button
                        key={language.code}
                        type="button"
                        disabled={busy}
                        aria-pressed={language.code === active.code}
                        lang={language.code}
                        dir={language.dir}
                        onClick={async () => {
                          setBusy(true);
                          setError("");
                          try {
                            await selectLocale(language.code);
                            setOpen(false);
                            setQuery("");
                            trigger.current?.focus();
                          } catch {
                            setError(
                              "Language could not be loaded. Please try again.",
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <span>{language.nativeName}</span>
                        <small>{language.code}</small>
                        {language.code === active.code && <Check size={16} />}
                      </button>
                    ))}
                </section>
              ),
            )}
            {!filtered.length && <p>{translateText("No languages found")}</p>}
          </div>
          {error && <p role="alert">{translateText(error)}</p>}
        </div>
      )}
    </div>
  );
}
