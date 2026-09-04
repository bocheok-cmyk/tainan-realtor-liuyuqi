import Image from "next/image";
import { AGENT } from "@/lib/brand";

export const metadata = { title: `關於我｜${AGENT.name}` };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <Image
          src="/images/liu-yuqi-headshot-v2.png"
          alt={AGENT.name}
          width={320}
          height={427}
          className="w-40 flex-none object-contain sm:w-48"
        />
        <div>
          <p className="text-sm font-semibold text-primary">{AGENT.title}</p>
          <h1 className="mt-4 font-heading text-3xl font-bold text-text">關於{AGENT.name}</h1>
          {/* TODO: 經歷/自我介紹文字要等她確認要公開哪些內容再補，目前先留骨架 */}
          <div className="mt-8 space-y-4 text-text/80">
            <p>{AGENT.company}</p>
            <p>
              電話：{AGENT.phone}　LINE：{AGENT.line}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
