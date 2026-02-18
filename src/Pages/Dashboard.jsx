import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  CalendarDays,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import Sidebar from '@/Components/Dashboard/Sidebar';
import DashboardHeader from '@/Components/Dashboard/DashboardHeader';
import StatsCard from '@/Components/Dashboard/StatsCard';
import EventCard from '@/Components/Dashboard/EventCard';
import { Skeleton } from '@/Components/ui/skeleton';

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // User not logged in
      }
    };
    fetchUser();
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-created_date', 10)
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => base44.entities.Registration.list()
  });

  const stats = [
    {
      title: 'Total Events',
      value: events.length,
      icon: CalendarDays,
      trend: 'up',
      trendValue: 12,
      color: 'cyan'
    },
    {
      title: 'Total Registrations',
      value: registrations.length,
      icon: Users,
      trend: 'up',
      trendValue: 24,
      color: 'purple'
    },
    {
      title: 'Active Events',
      value: events.filter(e => e.status === 'published' || e.status === 'ongoing').length,
      icon: TrendingUp,
      trend: 'up',
      trendValue: 8,
      color: 'green'
    },
    {
      title: 'Upcoming Events',
      value: events.filter(e => new Date(e.start_date) > new Date()).length,
      icon: Clock,
      trend: 'up',
      trendValue: 5,
      color: 'orange'
    }
  ];

  const getRegistrationCount = (eventId) => {
    return registrations.filter(r => r.event_id === eventId).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader user={user} onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-gray-500">Here's what's happening with your events.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Events Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Your Events</h2>
              <div className="flex items-center gap-3">
                <Link to={createPageUrl('Events')}>
                  <Button variant="ghost" className="text-cyan-600">
                    View All
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to={createPageUrl('CreateEvent')}>
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>

            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6">
                    <Skeleton className="h-48 mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-500 mb-6">Create your first event to get started</p>
                <Link to={createPageUrl('CreateEvent')}>
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.slice(0, 6).map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    registrationCount={getRegistrationCount(event.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
