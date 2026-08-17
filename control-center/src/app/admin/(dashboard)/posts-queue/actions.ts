"use server";

import { polishDraft, type PolishResult } from "@/lib/posting/polish";
import { createClient } from "@/lib/supabase/server";

export async function polishAction(rawDraft: string): Promise<PolishResult> {
  return polishDraft(rawDraft);
}

export type Platform = "fb" | "ig" | "threads";

export type SubmitQueueInput = {
  rawDraft: string;
  polishedText: string | null;
  entries: {
    platform: Platform;
    formattedText: string;
    charCount: number;
    alsoPostToStory: boolean;
  }[];
};

export type SubmitQueueResult = { ok: true } | { ok: false; error: string };

/**
 * 建立待確認的發文佇列。這裡只負責「存起來、狀態設成 draft」，
 * 絕對不會真的發文——實際發布永遠是之後請 Claude 操作已登入的瀏覽器、
 * 她確認過內容才動手貼。
 */
export async function submitQueueAction(input: SubmitQueueInput): Promise<SubmitQueueResult> {
  if (input.entries.length === 0) {
    return { ok: false, error: "至少要選一個平台" };
  }
  if (input.entries.some((e) => e.charCount > 1900)) {
    return { ok: false, error: "有平台的字數超過 1900 字上限" };
  }

  const supabase = await createClient();

  const { data: draft, error: draftError } = await supabase
    .from("post_drafts")
    .insert({
      raw_draft: input.rawDraft,
      polished_text: input.polishedText,
      polish_status: input.polishedText ? "done" : "none",
    })
    .select("id")
    .single();

  if (draftError || !draft) {
    return { ok: false, error: draftError?.message ?? "建立草稿失敗" };
  }

  const { error: queueError } = await supabase.from("social_queue").insert(
    input.entries.map((e) => ({
      post_draft_id: draft.id,
      platform: e.platform,
      formatted_text: e.formattedText,
      char_count: e.charCount,
      also_post_to_story: e.platform === "ig" ? e.alsoPostToStory : false,
      status: "draft",
    })),
  );

  if (queueError) {
    return { ok: false, error: queueError.message };
  }

  return { ok: true };
}
