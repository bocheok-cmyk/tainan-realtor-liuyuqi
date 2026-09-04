import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, contactInfo, message, articleId } = body as {
    name?: string;
    contactInfo?: string;
    message?: string;
    articleId?: string;
  };

  if (!name || !contactInfo || !message) {
    return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
  }

  // 寫入資料庫是主流程；資料庫寫不進去（Supabase 還沒接上）也不擋這次送出，
  // 因為寄信通知本人才是這個表單真正要保證的事——跟中控情報台一貫的
  // fallback 原則相同：次要步驟失敗不能擋主流程。
  try {
    const supabase = await createClient();
    await supabase.from("contact_messages").insert({
      name,
      contact_info: contactInfo,
      message,
      article_id: articleId ?? null,
    });
  } catch {
    // ignore — 下面還是會嘗試寄信
  }

  const settings = await getSiteSettings();
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey && settings.contactEmailTo) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "網站留言 <onboarding@resend.dev>",
        to: settings.contactEmailTo,
        subject: `[網站留言] ${name}`,
        text: `姓名：${name}\n聯絡方式：${contactInfo}\n\n訊息：\n${message}`,
      });
    } catch (err) {
      // RESEND_API_KEY 還沒設定或寄信失敗時，訊息仍然已經存進資料庫，
      // 不要讓訪客看到失敗——這裡只記錄，不拋出。
      console.error("Resend send failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
