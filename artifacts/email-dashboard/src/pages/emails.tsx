import React, { useState } from "react";
import { Link } from "wouter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Search, Plus, FilterX, Clock, Hash, Eye, MousePointerClick,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;

interface Email {
  id: number; from: string; fromName?: string | null; to: string; cc?: string | null; bcc?: string | null;
  subject: string; status: string; opens: number; clicks: number;
  messageId?: string | null; errorMessage?: string | null; retryCount: number;
  tag?: string | null; htmlBody?: string | null; textBody?: string | null;
  createdAt: string; sentAt?: string | null;
}

async function fetchEmails(page: number, search: string, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const res = await fetch(`/api/emails?${params}`);
  if (!res.ok) throw new Error("Failed to load emails");
  return res.json() as Promise<{ emails: Email[]; total: number; page: number; limit: number }>;
}

async function fetchEmail(id: number): Promise<Email> {
  const res = await fetch(`/api/emails/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

async function resendEmail(id: number): Promise<Email> {
  const res = await fetch(`/api/emails/${id}/resend`, { method: "POST" });
  if (!res.ok) throw new Error("Resend failed");
  return res.json();
}

export default function Emails() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["emails", page, search, status],
    queryFn: () => fetchEmails(page, search, status),
  });

  const resendMut = useMutation({
    mutationFn: resendEmail,
    onSuccess: (updated) => {
      toast({
        title: updated.status === "sent" ? "Resent Successfully" : "Resend Failed",
        description: updated.status === "sent"
          ? `Email delivered to ${updated.to}`
          : updated.errorMessage || "Could not send",
        variant: updated.status === "sent" ? "default" : "destructive",
      });
      qc.invalidateQueries({ queryKey: ["emails"] });
      if (selectedId === updated.id) qc.invalidateQueries({ queryKey: ["email", updated.id] });
    },
    onError: () => toast({ title: "Resend failed", variant: "destructive" }),
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outbound Emails</h1>
          <p className="text-muted-foreground mt-1">
            {data ? `${data.total.toLocaleString()} total emails` : "Log of all sent emails"}
          </p>
        </div>
        <Link href="/emails/compose">
          <Button><Plus className="mr-2 h-4 w-4" /> Compose</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipient or subject…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
        {(search || status) && (
          <Button variant="outline" size="icon" onClick={() => { setSearch(""); setStatus(undefined); setPage(1); }}>
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.emails.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No emails found.
                  </TableCell>
                </TableRow>
              )
              : data?.emails.map((email) => (
                  <TableRow key={email.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(email.id)}>
                    <TableCell className="font-medium">
                      <div>{email.to}</div>
                      {email.fromName && <div className="text-xs text-muted-foreground">{email.fromName} &lt;{email.from}&gt;</div>}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[260px] truncate">{email.subject}</div>
                      {email.tag && <Badge variant="secondary" className="text-xs mt-0.5">{email.tag}</Badge>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={email.status} />
                      {email.status === "failed" && email.retryCount > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">× {email.retryCount}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {email.sentAt ? format(parseISO(email.sentAt), "MMM d, h:mm a") : "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {(email.status === "failed" || email.status === "queued") && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          disabled={resendMut.isPending && resendMut.variables === email.id}
                          onClick={() => resendMut.mutate(email.id)}
                          title="Resend"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <EmailDetailSheet
        emailId={selectedId}
        onClose={() => setSelectedId(null)}
        onResend={(id) => resendMut.mutate(id)}
        resendPending={resendMut.isPending}
      />
    </div>
  );
}

function EmailDetailSheet({
  emailId, onClose, onResend, resendPending,
}: {
  emailId: number | null;
  onClose: () => void;
  onResend: (id: number) => void;
  resendPending: boolean;
}) {
  const { data: email, isLoading } = useQuery({
    queryKey: ["email", emailId],
    queryFn: () => fetchEmail(emailId!),
    enabled: !!emailId,
  });

  return (
    <Sheet open={!!emailId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
        {isLoading || !email ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-lg leading-snug">{email.subject}</SheetTitle>
                <StatusBadge status={email.status} />
              </div>
            </SheetHeader>

            <div className="space-y-5">
              {/* Error banner */}
              {email.status === "failed" && email.errorMessage && (
                <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Send failed</p>
                    <p className="text-xs mt-0.5 font-mono">{email.errorMessage}</p>
                  </div>
                  <Button
                    size="sm" variant="destructive" className="ml-auto shrink-0 h-7 text-xs"
                    disabled={resendPending}
                    onClick={() => onResend(email.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-lg border">
                {[
                  ["From", email.fromName ? `${email.fromName} <${email.from}>` : email.from],
                  ["To", email.to],
                  email.cc ? ["CC", email.cc] : null,
                  email.bcc ? ["BCC", email.bcc] : null,
                  ["Sent", email.sentAt ? format(parseISO(email.sentAt), "PP p") : "—"],
                  ["Message ID", email.messageId || "pending"],
                  email.tag ? ["Tag", email.tag] : null,
                  email.retryCount > 0 ? ["Retries", String(email.retryCount)] : null,
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label}>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-0.5">{label}</span>
                    <span className="font-medium font-mono text-xs break-all">{value}</span>
                  </div>
                ))}
              </div>

              {/* Engagement */}
              {(email.opens > 0 || email.clicks > 0) && (
                <div className="flex gap-4 p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="font-bold">{email.opens}</span>
                    <span className="text-xs text-muted-foreground">opens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-purple-500" />
                    <span className="font-bold">{email.clicks}</span>
                    <span className="text-xs text-muted-foreground">clicks</span>
                  </div>
                </div>
              )}

              {/* Body */}
              <div>
                <h3 className="font-semibold text-sm mb-2 border-b pb-2">Message Body</h3>
                <div className="border rounded-md overflow-hidden">
                  {email.htmlBody ? (
                    <iframe
                      srcDoc={email.htmlBody}
                      className="w-full min-h-[300px] border-0 bg-white"
                      sandbox="allow-same-origin"
                      title="Email body"
                    />
                  ) : email.textBody ? (
                    <pre className="p-4 whitespace-pre-wrap font-sans text-sm">{email.textBody}</pre>
                  ) : (
                    <p className="p-4 text-muted-foreground text-sm">No body content.</p>
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
