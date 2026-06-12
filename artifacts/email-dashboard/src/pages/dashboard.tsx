import React from "react";
import { 
  useGetStatsOverview, 
  useGetDeliveryStats, 
  useGetBounceStats,
  useGetActivity 
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Send, CheckCircle, AlertTriangle, Eye, MousePointerClick } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { data: statsOverview, isLoading: isLoadingOverview } = useGetStatsOverview();
  const { data: deliveryStats, isLoading: isLoadingDelivery } = useGetDeliveryStats({ days: 30 });
  const { data: bounceStats, isLoading: isLoadingBounce } = useGetBounceStats();
  const { data: activity, isLoading: isLoadingActivity } = useGetActivity({ limit: 10 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform delivery metrics and recent activity.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sent"
          value={statsOverview?.totalSent.toLocaleString()}
          isLoading={isLoadingOverview}
          icon={Send}
        />
        <StatCard
          title="Delivered"
          value={statsOverview?.delivered.toLocaleString()}
          subtitle={`${(statsOverview?.deliveryRate || 0).toFixed(1)}% delivery rate`}
          isLoading={isLoadingOverview}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard
          title="Open Rate"
          value={`${(statsOverview?.openRate || 0).toFixed(1)}%`}
          subtitle={`${statsOverview?.opened.toLocaleString()} total opens`}
          isLoading={isLoadingOverview}
          icon={Eye}
        />
        <StatCard
          title="Click Rate"
          value={`${(statsOverview?.clickRate || 0).toFixed(1)}%`}
          subtitle={`${statsOverview?.clicked.toLocaleString()} total clicks`}
          isLoading={isLoadingOverview}
          icon={MousePointerClick}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle>Delivery Trends (30 Days)</CardTitle>
            <CardDescription>Sent vs Delivered volume over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {isLoadingDelivery ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full mx-4" />
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deliveryStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(parseISO(val), "MMM d")}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                      labelFormatter={(val) => format(parseISO(val as string), "MMM d, yyyy")}
                    />
                    <Legend iconType="circle" />
                    <Line 
                      type="monotone" 
                      dataKey="sent" 
                      name="Sent"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="delivered" 
                      name="Delivered"
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bounce Stats */}
        <Card className="md:col-span-3 lg:col-span-2">
          <CardHeader>
            <CardTitle>Issue Breakdown</CardTitle>
            <CardDescription>Bounces & complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBounce ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Hard Bounces</p>
                    <p className="text-2xl font-bold">{bounceStats?.hardBounces}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Soft Bounces</p>
                    <p className="text-2xl font-bold">{bounceStats?.softBounces}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Spam Complaints</p>
                    <p className="text-2xl font-bold">{bounceStats?.spamComplaints}</p>
                  </div>
                  <BanIcon className="h-5 w-5 text-destructive" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events across your platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {activity?.map((event) => (
                <div key={event.id} className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {event.email}
                      <span className="text-muted-foreground ml-2 font-normal">
                        {event.subject}
                      </span>
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span>{format(parseISO(event.createdAt), "MMM d, h:mm a")}</span>
                      <span>•</span>
                      <span>{event.description}</span>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={event.type} />
                  </div>
                </div>
              ))}
              {activity?.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent activity found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  isLoading, 
  icon: Icon,
  trend
}: { 
  title: string; 
  value?: string | number; 
  subtitle?: string; 
  isLoading: boolean;
  icon: React.ElementType;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value || "0"}</div>
        )}
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BanIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}