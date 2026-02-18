import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
  TrendingUp,
  Users,
  CalendarDays,
  Eye
} from 'lucide-react';
import Sidebar from '@/Components/Dashboard/Sidebar';
import DashboardHeader from '@/Components/Dashboard/DashboardHeader';
import StatsCard from '@/Components/Dashboard/StatsCard';

const COLORS = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function Analytics() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list()
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => base44.entities.Registration.list()
  });

  // Calculate stats
  const totalEvents = events.length;
  const totalRegistrations = registrations.length;
  const activeEvents = events.filter(e => e.status === 'published' || e.status === 'ongoing').length;
  const checkIns = registrations.filter(r => r.status === 'checked_in').length;

  // Event type distribution
  const eventTypeData = [
    { name: 'In-Person', value: events.filter(e => e.event_type === 'in_person').length },
    { name: 'Virtual', value: events.filter(e => e.event_type === 'virtual').length },
    { name: 'Hybrid', value: events.filter(e => e.event_type === 'hybrid').length },
    { name: 'Webinar', value: events.filter(e => e.event_type === 'webinar').length }
  ].filter(d => d.value > 0);

  // Registration status distribution
  const statusData = [
    { name: 'Approved', value: registrations.filter(r => r.status === 'approved').length, fill: '#10B981' },
    { name: 'Pending', value: registrations.filter(r => r.status === 'pending').length, fill: '#F59E0B' },
    { name: 'Checked In', value: registrations.filter(r => r.status === 'checked_in').length, fill: '#06B6D4' },
    { name: 'Cancelled', value: registrations.filter(r => r.status === 'cancelled').length, fill: '#EF4444' }
  ].filter(d => d.value > 0);

  // Top events by registrations
  const topEventsData = events
    .map(event => ({
      name: event.title?.substring(0, 20) + (event.title?.length > 20 ? '...' : ''),
      registrations: registrations.filter(r => r.event_id === event.id).length
    }))
    .sort((a, b) => b.registrations - a.registrations)
    .slice(0, 5);

  // Monthly trend (mock data - in real scenario would calculate from actual dates)
  const monthlyData = [
    { month: 'Jan', events: 2, registrations: 45 },
    { month: 'Feb', events: 3, registrations: 78 },
    { month: 'Mar', events: 5, registrations: 120 },
    { month: 'Apr', events: 4, registrations: 95 },
    { month: 'May', events: 6, registrations: 150 },
    { month: 'Jun', events: totalEvents, registrations: totalRegistrations }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">Track your event performance</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Events"
              value={totalEvents}
              icon={CalendarDays}
              trend="up"
              trendValue={12}
              color="cyan"
            />
            <StatsCard
              title="Total Registrations"
              value={totalRegistrations}
              icon={Users}
              trend="up"
              trendValue={24}
              color="purple"
            />
            <StatsCard
              title="Active Events"
              value={activeEvents}
              icon={TrendingUp}
              trend="up"
              trendValue={8}
              color="green"
            />
            <StatsCard
              title="Check-ins"
              value={checkIns}
              icon={Eye}
              trend="up"
              trendValue={15}
              color="orange"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="registrations"
                        stroke="#06B6D4"
                        fill="url(#colorReg)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Event Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {eventTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {eventTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No events data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Events */}
            <Card>
              <CardHeader>
                <CardTitle>Top Events by Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {topEventsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topEventsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#9CA3AF" />
                        <YAxis type="category" dataKey="name" width={120} stroke="#9CA3AF" />
                        <Tooltip />
                        <Bar dataKey="registrations" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No events data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Registration Status */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No registration data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
