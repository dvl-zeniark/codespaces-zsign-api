import { redirect } from "next/navigation";

export default function NewOfferPage() {
  redirect("/?create=1");
}
