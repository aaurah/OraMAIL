import React, { useState } from "react";
import { 
  useListTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useUpdateTemplate,
  getListTemplatesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, LayoutTemplate, Trash2, Edit2, Code } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
});

export default function Templates() {
  const { data: templates, isLoading } = useListTemplates();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">Manage reusable email layouts and content.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-between">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardFooter>
            </Card>
          ))
        ) : templates?.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
            <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create a template to reuse content across your emails.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Create First Template
            </Button>
          </div>
        ) : (
          templates?.map((template) => (
            <Card key={template.id} className="flex flex-col group">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate">{template.name}</span>
                  <Code className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {template.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="bg-muted/50 p-3 rounded-md text-sm mb-4">
                  <span className="font-semibold text-xs text-muted-foreground uppercase block mb-1">Subject</span>
                  <span className="truncate block">{template.subject}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>ID: <span className="font-mono text-foreground">{template.id}</span></div>
                  <div>Used: <span className="font-medium text-foreground">{template.usageCount} times</span></div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between items-center border-t px-6 py-4 mt-auto">
                <span className="text-xs text-muted-foreground">
                  Updated {format(parseISO(template.updatedAt || template.createdAt), "MMM d, yyyy")}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTemplate(template)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <DeleteTemplateDialog templateId={template.id} templateName={template.name} />
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <TemplateFormDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />
      
      {editingTemplate && (
        <TemplateFormDialog 
          open={!!editingTemplate} 
          onOpenChange={(open) => !open && setEditingTemplate(null)} 
          template={editingTemplate}
        />
      )}
    </div>
  );
}

function TemplateFormDialog({ open, onOpenChange, template }: { open: boolean, onOpenChange: (open: boolean) => void, template?: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const isEditing = !!template;

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      description: template?.description || "",
      htmlBody: template?.htmlBody || "",
      textBody: template?.textBody || "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: template?.name || "",
        subject: template?.subject || "",
        description: template?.description || "",
        htmlBody: template?.htmlBody || "",
        textBody: template?.textBody || "",
      });
    }
  }, [open, template, form]);

  const onSubmit = (values: z.infer<typeof templateSchema>) => {
    if (isEditing) {
      // Need ID in the path per API spec, assuming API supports updating
      // The openapi.yaml generated hooks might structure it this way
      updateTemplate.mutate(
        // @ts-ignore - The exact params depend on orval output, typically (id, data) or ({id, data})
        { id: template.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
            toast({ title: "Template updated" });
            onOpenChange(false);
          },
          onError: () => toast({ title: "Error", description: "Failed to update template", variant: "destructive" })
        }
      );
    } else {
      createTemplate.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          toast({ title: "Template created" });
          onOpenChange(false);
          form.reset();
        },
        onError: () => toast({ title: "Error", description: "Failed to create template", variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify your existing template layout.' : 'Add a new reusable email layout.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Welcome Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Welcome to our platform!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Used when a new user signs up" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="htmlBody"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTML Body</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="<html>..." 
                      className="font-mono text-xs min-h-[200px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                {isEditing ? 'Save Changes' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTemplateDialog({ templateId, templateName }: { templateId: number, templateName: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteTemplate = useDeleteTemplate();

  const onDelete = () => {
    // @ts-ignore
    deleteTemplate.mutate({ id: templateId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({ title: "Template deleted" });
        setOpen(false);
      },
      onError: () => toast({ title: "Error", description: "Failed to delete template", variant: "destructive" })
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{templateName}"? This action cannot be undone and will prevent future emails from using this template.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onDelete} disabled={deleteTemplate.isPending}>
            Delete Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
