import { AGENT, SOCIAL, hasLink } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-text/70">
        <p className="font-medium text-text">{AGENT.name}｜{AGENT.title}</p>
        <p className="mt-1">{AGENT.company}</p>
        <p className="mt-1">
          電話 {AGENT.phone}　LINE {AGENT.line}
        </p>
        <div className="mt-4 flex gap-4">
          {hasLink(SOCIAL.fb) && (
            <a href={SOCIAL.fb} target="_blank" rel="noopener" className="hover:text-primary">
              Facebook
            </a>
          )}
          {hasLink(SOCIAL.threads) && (
            <a href={SOCIAL.threads} target="_blank" rel="noopener" className="hover:text-primary">
              Threads
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
