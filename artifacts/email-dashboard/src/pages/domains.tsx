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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { Plus, Globe, CheckCircle2, XCircle, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Domains() {
  const { data: domains, isLoading } = useListDomains();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  
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
                <TableRow key={domain.id}>
                  <TableCell className="font-medium text-base">{domain.domain}</TableCell>
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
                  <TableCell className="text-right">
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
