import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, Loader2, Eye, Code, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  from: z.string().email({ message: "Invalid sender email" }),
  fromName: z.string().optional(),
  to: z.string().min(1, "Recipient is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  replyTo: z.string().email().optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
  templateId: z.coerce.number().optional(),
  tag: z.string().optional(),
  trackOpens: z.boolean().default(true),
  trackLinks: z.boolean().default(true),
}).refine(data => data.htmlBody || data.textBody || data.templateId, {
  message: "Provide HTML body, text body, or select a template",
  path: ["htmlBody"],
});

type FormValues = z.infer<typeof formSchema>;

async function sendEmail(data: FormValues) {
  const res = await fetch("/api/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      replyTo: data.replyTo || undefined,
      fromName: data.fromName || undefined,
      cc: data.cc || undefined,
      bcc: data.bcc || undefined,
      templateId: data.templateId || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to send email");
  }
  return res.json();
}

export default function Compose() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bodyTab, setBodyTab] = useState<"html" | "text" | "preview">("html");

  const { data: templates } = useQuery<Array<{ id: number; name: string; subject: string }>>({
    queryKey: ["templates"],
    queryFn: () => fetch("/api/templates").then(r => r.json()),
  });

  const sendMutation = useMutation({ mutationFn: sendEmail });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "",
      fromName: "",
      to: "",
      cc: "",
      bcc: "",
      replyTo: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      tag: "",
      trackOpens: true,
      trackLinks: true,
    },
  });

  const selectedTemplateId = form.watch("templateId");
  const htmlBody = form.watch("htmlBody");

  React.useEffect(() => {
    if (selectedTemplateId && templates) {
      const tpl = templates.find(t => t.id === selectedTemplateId);
      if (tpl && !form.getValues("subject")) form.setValue("subject", tpl.subject);
    }
  }, [selectedTemplateId, templates, form]);

  const onSubmit = (values: FormValues) => {
    sendMutation.mutate(values, {
      onSuccess: () => {
        toast({ title: "Email Sent", description: "Your email has been queued for delivery." });
        setLocation("/emails");
      },
      onError: (err: unknown) => {
        toast({
          title: "Send Failed",
          description: err instanceof Error ? err.message : "Failed to send email",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/emails">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compose Email</h1>
          <p className="text-muted-foreground text-sm">Send a transactional email directly from the dashboard.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Recipients */}
          <Card>
            <CardHeader><CardTitle className="text-base">Recipients &amp; Sender</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="from" render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Email</FormLabel>
                    <FormControl><Input placeholder="sender@yourdomain.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fromName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="OraMAIL Notifications" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="to" render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl><Input placeholder="recipient@example.com" {...field} /></FormControl>
                  <FormDescription>Separate multiple addresses with commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowAdvanced(v => !v)}
              >
                {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showAdvanced ? "Hide" : "Show"} CC / BCC / Reply-To
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="cc" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CC <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl><Input placeholder="cc@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bcc" render={({ field }) => (
                      <FormItem>
                        <FormLabel>BCC <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl><Input placeholder="bcc@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="replyTo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply-To <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl><Input placeholder="replies@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject & Template */}
          <Card>
            <CardHeader><CardTitle className="text-base">Subject</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormControl><Input placeholder="Welcome to our platform!" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {templates && templates.length > 0 && (
                <FormField control={form.control} name="templateId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? undefined : Number(v))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choose a template…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No template — write custom body</SelectItem>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Selecting a template loads its body content.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </CardContent>
          </Card>

          {/* Body */}
          {!selectedTemplateId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Email Body</CardTitle>
                  <Tabs value={bodyTab} onValueChange={v => setBodyTab(v as typeof bodyTab)}>
                    <TabsList className="h-7">
                      <TabsTrigger value="html" className="text-xs h-6 px-2"><Code className="h-3 w-3 mr-1" />HTML</TabsTrigger>
                      <TabsTrigger value="text" className="text-xs h-6 px-2">Text</TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs h-6 px-2"><Eye className="h-3 w-3 mr-1" />Preview</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {bodyTab === "html" && (
                  <FormField control={form.control} name="htmlBody" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="<h1>Hello!</h1><p>Your message here.</p>" className="min-h-[240px] font-mono text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {bodyTab === "text" && (
                  <FormField control={form.control} name="textBody" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Plain text fallback for email clients that don't render HTML." className="min-h-[240px] text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {bodyTab === "preview" && (
                  <div className="rounded-md border overflow-hidden min-h-[240px] bg-white">
                    {htmlBody ? (
                      <iframe
                        srcDoc={htmlBody}
                        className="w-full min-h-[240px] border-0"
                        sandbox="allow-same-origin"
                        title="Email preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                        Write HTML in the HTML tab to see a preview here.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Options */}
          <Card>
            <CardHeader><CardTitle className="text-base">Options</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="tag" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Tag <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input placeholder="welcome-series, password-reset, invoice…" {...field} /></FormControl>
                  <FormDescription>Group emails for analytics.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-4">
                <FormField control={form.control} name="trackOpens" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                    <div>
                      <FormLabel className="text-sm font-medium">Track Opens</FormLabel>
                      <FormDescription className="text-xs">Insert tracking pixel</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="trackLinks" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                    <div>
                      <FormLabel className="text-sm font-medium">Track Clicks</FormLabel>
                      <FormDescription className="text-xs">Wrap links with tracker</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/emails"><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                : <><Send className="mr-2 h-4 w-4" /> Send Email</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
