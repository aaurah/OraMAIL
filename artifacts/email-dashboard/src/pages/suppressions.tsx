import React, { useState } from "react";
import { 
  useListSuppressions,
  useAddSuppression,
  useDeleteSuppression,
  getListSuppressionsQueryKey
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { Plus, Ban, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Suppressions() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListSuppressions({ page, limit: 50 });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState<any>("manual");
  
  const addSuppression = useAddSuppression();
  const deleteSuppression = useDeleteSuppression();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdd = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }
    addSuppression.mutate({ data: { email: newEmail, reason: newReason } }, {
      onSuccess: () => {
        toast({ title: "Address Suppressed", description: `${newEmail} has been added to the suppression list.` });
        setIsAddOpen(false);
        setNewEmail("");
        setNewReason("manual");
        queryClient.invalidateQueries({ queryKey: getListSuppressionsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to add suppression", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from suppressions? They will receive emails again.`)) return;
    // @ts-ignore
    deleteSuppression.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Suppression Removed", description: "Address can now receive emails." });
        queryClient.invalidateQueries({ queryKey: getListSuppressionsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppression List</h1>
          <p className="text-muted-foreground mt-1">Addresses blocked from receiving emails.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} variant="destructive">
          <Plus className="mr-2 h-4 w-4" /> Suppress Address
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email Address</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[40px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.suppressions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Ban className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Suppression list is empty.</p>
                </TableCell>
              </TableRow>
            ) : (
              data?.suppressions.map((suppression) => (
                <TableRow key={suppression.id}>
                  <TableCell className="font-medium text-base">{suppression.email}</TableCell>
                  <TableCell>
                    <StatusBadge status={suppression.reason} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(parseISO(suppression.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleDelete(suppression.id, suppression.email)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <DialogTitle>Add to Suppression List</DialogTitle>
            <DialogDescription>
              Manually block an email address from receiving any further communications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                placeholder="user@example.com" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={newReason} onValueChange={setNewReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Request</SelectItem>
                  <SelectItem value="bounce">Hard Bounce</SelectItem>
                  <SelectItem value="spam">Spam Complaint</SelectItem>
                  <SelectItem value="unsubscribe">Unsubscribed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleAdd} disabled={addSuppression.isPending || !newEmail}>
              Suppress Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
