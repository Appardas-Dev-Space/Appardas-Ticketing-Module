import { TicketDetail } from "@/components/tickets/ticket-detail";

export default function TicketPage({
  params,
}: {
  params: { documentId: string };
}) {
  return <TicketDetail documentId={params.documentId} />;
}
