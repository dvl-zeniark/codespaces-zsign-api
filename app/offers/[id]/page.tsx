import { redirect } from "next/navigation";

export default function OfferPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/?requestId=${params.id}`);
}
