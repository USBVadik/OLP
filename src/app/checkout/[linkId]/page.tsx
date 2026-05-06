import { redirect } from "next/navigation";

export default function CheckoutRedirect({
  params,
}: {
  params: { linkId: string };
}) {
  redirect(`/pay/${params.linkId}`);
}
