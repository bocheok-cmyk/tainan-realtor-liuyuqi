import { AGENT } from "@/lib/brand";
import { ContactForm } from "@/components/ContactForm";

export const metadata = { title: "聯絡我" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-3xl font-bold text-text">聯絡我</h1>
      <p className="mt-2 text-text/60">
        電話 {AGENT.phone}　LINE {AGENT.line}，或直接留言給我。
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
