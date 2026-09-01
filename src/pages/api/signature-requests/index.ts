import type { APIRoute } from "astro";
import { listOffers, MAX_RECIPIENTS } from "@/lib/offers";
import { createAndPrepareOffer, type RecipientInput } from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const prerender = false;

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

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({ offers: await listOffers() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
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
      return new Response(JSON.stringify({ message: "Title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (recipients.length > MAX_RECIPIENTS) {
      return new Response(
        JSON.stringify({ message: `At most ${MAX_RECIPIENTS} recipients per request` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!documentId) {
      return new Response(
        JSON.stringify({ message: "documentId is required. Upload a Document first." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const offer = await createAndPrepareOffer({
      roleTitle,
      recipients,
      documentId,
      isBulk: Boolean(body.isBulk),
    });
    return new Response(JSON.stringify({ offer }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
