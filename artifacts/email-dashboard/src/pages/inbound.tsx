import React, { useState } from "react";
import { 
  useListInbound,
  useGetInbound,
  getGetInboundQueryKey
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from "@/components/ui/sheet";
import { format, parseISO } from "date-fns";
import { Search, Clock, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Inbound() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);

  const { data, isLoading } = useListInbound({
    page,
    limit: 50,
    search: search || undefined
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbound Emails</h1>
        <p className="text-muted-foreground mt-1">Processed incoming emails routed to your platform.</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sender or subject..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Attachments</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                </TableRow>
              ))
            ) : data?.emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No inbound emails found.
                </TableCell>
              </TableRow>
            ) : (
              data?.emails.map((email) => (
                <TableRow 
                  key={email.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEmailId(email.id)}
                >
                  <TableCell className="font-medium">{email.from}</TableCell>
                  <TableCell>{email.to}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{email.subject}</TableCell>
                  <TableCell>
                    {email.attachments ? (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Paperclip className="h-3 w-3" /> {email.attachments}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(parseISO(email.receivedAt), "MMM d, h:mm a")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InboundDetailSheet 
        emailId={selectedEmailId} 
        onClose={() => setSelectedEmailId(null)} 
      />
    </div>
  );
}

function InboundDetailSheet({ emailId, onClose }: { emailId: number | null; onClose: () => void }) {
  const { data: email, isLoading } = useGetInbound(emailId as number, { 
    query: { 
      enabled: !!emailId,
      queryKey: emailId ? getGetInboundQueryKey(emailId) : []
    } 
  });

  return (
    <Sheet open={!!emailId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
        {isLoading || !email ? (
          <div className="space-y-6 pt-6">
            <Skeleton className="h-8 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl">{email.subject}</SheetTitle>
            </SheetHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">From</span>
                  <span className="font-medium">{email.from}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">To</span>
                  <span className="font-medium">{email.to}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Received
                  </span>
                  <span>{format(parseISO(email.receivedAt), "PP pp")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> Attachments
                  </span>
                  <span>{email.attachments || 0} files</span>
                </div>
              </div>

              {email.headers && (
                <div className="text-xs bg-slate-950 text-slate-300 p-4 rounded-lg font-mono overflow-x-auto">
                  <div className="text-slate-500 mb-2 font-semibold">HEADERS</div>
                  <pre>{email.headers}</pre>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Message Body</h3>
                <div className="border rounded-md">
                  {email.htmlBody ? (
                    <div className="p-4 bg-white dark:bg-slate-50 text-black prose max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
                  ) : (
                    <pre className="p-4 whitespace-pre-wrap font-sans text-sm">{email.textBody}</pre>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
