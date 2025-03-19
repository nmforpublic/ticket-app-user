"use server";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { tickets, checkinLogs } from "@/db/schema";
import { revalidatePath } from "next/cache";

// チェックイン処理：チケットの状態を "used" に更新し、チェックインログを記録
export const checkinTicket = async (
  ticketId: number,
  scannedBy: number, // organizationUsers.id を指定
  additionalInfo?: any
) => {
  await db
    .update(tickets)
    .set({
      status: "used",
      used_at: new Date(),
    })
    .where(eq(tickets.id, ticketId));

  await db.insert(checkinLogs).values({
    ticket_id: ticketId,
    scanned_by: scannedBy,
    additional_info: additionalInfo,
  });
  revalidatePath("/tickets");
};
