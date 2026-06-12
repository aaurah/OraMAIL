import React, { useState } from "react";
import { Link } from "wouter";
import { 
  useListEmails, 
  useGetEmail,
  getGetEmailQueryKey
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { Search, Plus, FilterX, Clock, MapPin, Eye, MousePointerClick } from "lucide-react";

export default function Emails() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);

  const { data, isLoading } = useListEmails({
    page,
    limit: 50,
    search: search || undefined,
    status: status as any
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outbound Emails</h1>
          <p className="text-muted-foreground mt-1">Log of all emails sent from your platform.</p>
        </div>
        <Link href="/emails/compose">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Compose Email
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient or subject..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-[200px] flex gap-2">
          <Select 
            value={status || "all"} 
            onValueChange={(v) => {
              setStatus(v === "all" ? undefined : v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="clicked">Clicked</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
          {(search || status) && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                setSearch("");
                setStatus(undefined);
                setPage(1);
              }}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                </TableRow>
              ))
            ) : data?.emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No emails found.
                </TableCell>
              </TableRow>
            ) : (
              data?.emails.map((email) => (
                <TableRow 
                  key={email.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEmailId(email.id)}
                >
                  <TableCell className="font-medium">{email.to}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{email.subject}</TableCell>
                  <TableCell>
                    <StatusBadge status={email.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {email.sentAt ? format(parseISO(email.sentAt), "MMM d, h:mm a") : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls could go here */}
      
      <EmailDetailSheet 
        emailId={selectedEmailId} 
        onClose={() => setSelectedEmailId(null)} 
      />
    </div>
  );
}

function EmailDetailSheet({ emailId, onClose }: { emailId: number | null; onClose: () => void }) {
  const { data: email, isLoading } = useGetEmail(emailId as number, { 
    query: { 
      enabled: !!emailId,
      queryKey: emailId ? getGetEmailQueryKey(emailId) : []
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
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl">{email.subject}</SheetTitle>
                <StatusBadge status={email.status} />
              </div>
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
                    <Clock className="h-3 w-3" /> Date
                  </span>
                  <span>{format(parseISO(email.createdAt), "PP pp")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Message ID
                  </span>
                  <span className="font-mono text-xs">{email.messageId || "Pending"}</span>
                </div>
              </div>

              {(email.opens !== undefined || email.clicks !== undefined) && (
                <div className="flex gap-6 p-4 border rounded-lg bg-card">
                  {email.opens !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold leading-none">{email.opens}</div>
                        <div className="text-xs text-muted-foreground">Opens</div>
                      </div>
                    </div>
                  )}
                  {email.clicks !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <MousePointerClick className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold leading-none">{email.clicks}</div>
                        <div className="text-xs text-muted-foreground">Clicks</div>
                      </div>
                    </div>
                  )}
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
