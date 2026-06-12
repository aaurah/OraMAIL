import React, { useState } from "react";
import {
  useListDomains,
  useCreateDomain,
  useDeleteDomain,
  useVerifyDomain,
  getListDomainsQueryKey
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format, parseISO } from "date-fns";
import { Plus, Globe, CheckCircle2, XCircle, Loader2, Trash2, ShieldCheck, Copy, Check, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type Domain = {
  id: number;
  domain: string;
  status: string;
  spfVerified: boolean;
  dkimVerified: boolean;
  createdAt: string;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function DnsRecordsPanel({ domain, open, onClose }: { domain: Domain | null; open: boolean; onClose: () => void }) {
  if (!domain) return null;

  const d = domain.domain;

  const records = [
    {
      type: "TXT",
      name: "@",
      value: "v=spf1 include:spf.mtasv.net ~all",
      purpose: "SPF",
      description: "Authorizes Postmark to send email from your domain",
      status: domain.spfVerified,
    },
    {
      type: "TXT",
      name: `pm._domainkey.${d}`,
      value: "<DKIM key — copy from Postmark → Sender Signatures → " + d + ">",
      purpose: "DKIM",
      description: "Cryptographic signing key (get value from Postmark dashboard)",
      status: domain.dkimVerified,
      placeholder: true,
    },
    {
      type: "CNAME",
      name: `pm-bounces.${d}`,
      value: "pm.mtasv.net",
      purpose: "Return-Path",
      description: "Enables bounce tracking and return-path alignment",
      status: null,
    },
    {
      type: "TXT",
      name: `_dmarc.${d}`,
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${d}`,
      purpose: "DMARC",
      description: "Email authentication policy (adjust p= to quarantine/reject once ready)",
      status: null,
    },
    {
      type: "MX",
      name: `inbound.${d}`,
      value: "inbound.postmarkapp.com",
      extra: "Priority: 10",
      purpose: "Inbound MX",
      description: "Routes incoming email to Postmark for processing",
      status: null,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            DNS Records for {d}
          </SheetTitle>
          <SheetDescription>
            Add these records at your DNS provider to authenticate the domain and enable inbound routing.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.purpose} className="overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">{record.type}</Badge>
                    <span className="text-sm font-medium">{record.purpose}</span>
                  </div>
                  {record.status === true && (
                    <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/10 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                  {record.status === false && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs">
                      <XCircle className="h-3 w-3 mr-1" /> Not Verified
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1">{record.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name / Host</p>
                  <div className="flex items-center gap-2 rounded bg-muted/50 border px-2 py-1.5">
                    <code className="text-xs font-mono flex-1 break-all">{record.name}</code>
                    {!record.placeholder && <CopyButton value={record.name} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Value</p>
                  <div className="flex items-center gap-2 rounded bg-muted/50 border px-2 py-1.5">
                    <code className="text-xs font-mono flex-1 break-all">{record.value}</code>
                    {!record.placeholder && <CopyButton value={record.value} />}
                  </div>
                </div>
                {record.extra && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    <div className="rounded bg-muted/50 border px-2 py-1.5">
                      <code className="text-xs font-mono">10</code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground">After adding DNS records</p>
          <p>DNS changes can take up to 48 hours to propagate. Click <strong>Verify</strong> on the domain to check SPF and DKIM status.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Domains() {
  const { data: domains, isLoading } = useListDomains();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  const createDomain = useCreateDomain();
  const verifyDomain = useVerifyDomain();
  const deleteDomain = useDeleteDomain();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAddDomain = () => {
    if (!newDomain || !newDomain.includes(".")) {
      toast({ title: "Invalid Domain", description: "Please enter a valid domain name.", variant: "destructive" });
      return;
    }
    createDomain.mutate({ data: { domain: newDomain } }, {
      onSuccess: () => {
        toast({ title: "Domain Added", description: `${newDomain} has been added successfully.` });
        setIsAddOpen(false);
        setNewDomain("");
        queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to add domain", variant: "destructive" });
      }
    });
  };

  const handleVerify = (id: number) => {
    // @ts-ignore
    verifyDomain.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Verification Triggered", description: "Checking DNS records..." });
        queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to remove this domain?")) return;
    // @ts-ignore
    deleteDomain.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Domain Removed" });
        queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sender Domains</h1>
          <p className="text-muted-foreground mt-1">Authenticate domains to improve deliverability.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Domain
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Authentication</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[100px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : domains?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Globe className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No domains configured.</p>
                  <Button variant="link" onClick={() => setIsAddOpen(true)}>Add your first domain</Button>
                </TableCell>
              </TableRow>
            ) : (
              domains?.map((domain) => (
                <TableRow
                  key={domain.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelectedDomain(domain as Domain)}
                >
                  <TableCell className="font-medium text-base">
                    <div className="flex items-center gap-1.5">
                      {domain.domain}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={domain.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">SPF</span>
                        {domain.spfVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">DKIM</span>
                        {domain.dkimVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(parseISO(domain.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(domain.id)}
                        disabled={domain.status === "verified"}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1.5" />
                        Verify
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DnsRecordsPanel
        domain={selectedDomain}
        open={!!selectedDomain}
        onClose={() => setSelectedDomain(null)}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sending Domain</DialogTitle>
            <DialogDescription>
              Enter the domain you want to send emails from. You'll need to configure DNS records after adding it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g. yourcompany.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDomain} disabled={createDomain.isPending || !newDomain}>
              {createDomain.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
