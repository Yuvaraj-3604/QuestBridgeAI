import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import Sidebar from '@/Components/Dashboard/Sidebar';
import DashboardHeader from '@/Components/Dashboard/DashboardHeader';
import EventCard from '@/Components/Dashboard/EventCard';
import { Skeleton } from '@/Components/ui/skeleton';

export default function Events() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-created_date')
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => base44.entities.Registration.list()
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || event.status === statusFilter;
    const matchesType = !typeFilter || event.event_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getRegistrationCount = (eventId) => {
    return registrations.filter(r => r.event_id === eventId).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-500 mt-1">Manage all your events in one place</p>
            </div>
            <Link to={createPageUrl('CreateEvent')}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        All Status
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        All Types
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In-Person</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-l border-gray-200 pl-3">
                  <Tabs value={viewMode} onValueChange={setViewMode}>
                    <TabsList className="bg-gray-100">
                      <TabsTrigger value="grid"><Grid3X3 className="w-4 h-4" /></TabsTrigger>
                      <TabsTrigger value="list"><List className="w-4 h-4" /></TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>

          {/* Events Grid/List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6">
                  <Skeleton className="h-48 mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery
                  ? 'No events match your filters'
                  : 'No events yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Create your first event to get started'}
              </p>
              {!searchQuery && (
                <Link to={createPageUrl('CreateEvent')}>
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {filteredEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  registrationCount={getRegistrationCount(event.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
