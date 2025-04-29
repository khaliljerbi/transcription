// lib/qstash-verify.ts
import { Receiver } from "@upstash/qstash";
import { NextRequest } from "next/server";

// Create a receiver instance
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

export async function verifySignature(request: NextRequest): Promise<boolean> {
  // Skip verification in development for easier testing
  // if (process.env.NODE_ENV === "development") {
  //   return true;
  // }

  try {
    const signature = request.headers.get("Upstash-Signature") || "";
    const body = await request.text();

    const isValid = await receiver.verify({
      signature,
      body,
      url: process.env.NEXT_PUBLIC_APP_URL + "/api/process-translation",
    });

    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
