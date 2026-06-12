import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useSendEmail, 
  useListTemplates 
} from "@workspace/api-client-react";
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
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  from: z.string().email({ message: "Invalid email address" }),
  to: z.string().email({ message: "Invalid email address" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
  templateId: z.coerce.number().optional(),
  tag: z.string().optional(),
  trackOpens: z.boolean().default(true),
  trackLinks: z.boolean().default(true),
}).refine(data => data.htmlBody || data.textBody || data.templateId, {
  message: "Provide either HTML body, text body, or select a template",
  path: ["htmlBody"]
});

export default function Compose() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: templates } = useListTemplates();
  
  const sendEmail = useSendEmail();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "hello@yourdomain.com",
      to: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      tag: "",
      trackOpens: true,
      trackLinks: true,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    sendEmail.mutate({ data: values }, {
      onSuccess: () => {
        toast({
          title: "Email Queued",
          description: "Your email has been queued for delivery.",
        });
        setLocation("/emails");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.message || "Failed to send email",
          variant: "destructive",
        });
      }
    });
  };

  const selectedTemplateId = form.watch("templateId");
  
  React.useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        if (!form.getValues("subject")) form.setValue("subject", template.subject);
      }
    }
  }, [selectedTemplateId, templates, form]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/emails">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compose Email</h1>
          <p className="text-muted-foreground text-sm">Send a transactional email directly from the dashboard.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input placeholder="sender@domain.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input placeholder="recipient@domain.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Welcome to our platform!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {templates && templates.length > 0 && (
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template (Optional)</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "none" ? undefined : Number(val))}
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Template (Custom Body)</SelectItem>
                          {templates.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Using a template will override custom body content.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!selectedTemplateId && (
                <>
                  <FormField
                    control={form.control}
                    name="htmlBody"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTML Body</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="<h1>Hello World</h1>" 
                            className="min-h-[200px] font-mono text-sm" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="textBody"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Body (Fallback)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Hello World" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. welcome-series, password-reset" {...field} />
                    </FormControl>
                    <FormDescription>Use tags to group analytics.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-8 pt-4">
                <FormField
                  control={form.control}
                  name="trackOpens"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Track Opens</FormLabel>
                        <FormDescription>Insert tracking pixel</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackLinks"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Track Clicks</FormLabel>
                        <FormDescription>Wrap links with tracker</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/emails">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={sendEmail.isPending}>
              {sendEmail.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Email
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
