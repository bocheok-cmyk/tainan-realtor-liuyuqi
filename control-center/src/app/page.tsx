import { AGENT } from "@/lib/brand";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md rounded-card border border-border bg-background p-10 text-center">
        <p className="text-sm tracking-wide text-primary">{AGENT.title}</p>
        <h1 className="mt-3 text-4xl font-bold">{AGENT.name}</h1>
        <p className="mt-2 text-lg text-accent">{AGENT.slogan}</p>
        <p className="mt-6 text-sm text-text/70">{AGENT.company}</p>
        <div className="mt-8 flex flex-col gap-3">
          <a
            href={`tel:${AGENT.phoneRaw}`}
            className="flex h-11 items-center justify-center rounded-button border border-border font-numeric transition-colors hover:border-primary hover:text-primary"
          >
            {AGENT.phone}
          </a>
          <a
            href={`https://line.me/ti/p/~${AGENT.line}`}
            className="flex h-11 items-center justify-center rounded-button bg-primary font-medium text-background transition-opacity hover:opacity-90"
          >
            加 LINE 聊聊
          </a>
        </div>
      </div>
    </div>
  );
}
