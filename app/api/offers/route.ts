import { NextRequest, NextResponse } from "next/server";
import { listOffers, MAX_RECIPIENTS } from "@/lib/offers";
import {
  createAndPrepareOffer,
  type RecipientInput,
} from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

function parseRecipients(body: {
  recipients?: RecipientInput[];
  candidateFirstName?: string;
  candidateLastName?: string;
  candidateEmail?: string;
}): RecipientInput[] {
  if (Array.isArray(body.recipients) && body.recipients.length) {
    return body.recipients;
  }
  const firstName = String(body.candidateFirstName || "").trim();
  const lastName = String(body.candidateLastName || "").trim();
  const email = String(body.candidateEmail || "").trim();
  if (firstName && lastName && email) {
    return [{ firstName, lastName, email }];
  }
  return [];
}

export async function GET() {
  try {
    return NextResponse.json({ offers: await listOffers() });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      roleTitle?: string;
      recipients?: RecipientInput[];
      candidateFirstName?: string;
      candidateLastName?: string;
      candidateEmail?: string;
      documentId?: string;
      isBulk?: boolean;
    };
    const roleTitle = String(body.roleTitle || "").trim();
    const recipients = parseRecipients(body);
    const documentId = String(body.documentId || "").trim();

    if (!roleTitle) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 },
      );
    }
    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { message: `At most ${MAX_RECIPIENTS} recipients per request` },
        { status: 400 },
      );
    }
    if (!documentId) {
      return NextResponse.json(
        { message: "documentId is required. Upload a Document first." },
        { status: 400 },
      );
    }

    const offer = await createAndPrepareOffer({
      roleTitle,
      recipients,
      documentId,
      isBulk: Boolean(body.isBulk),
    });
    return NextResponse.json({ offer }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
