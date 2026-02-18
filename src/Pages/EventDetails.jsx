import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Video,
  Edit,
  Trash2,
  Share2,
  UserPlus,
  Check,
  X,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Briefcase
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import Sidebar from '@/Components/Dashboard/Sidebar';
import DashboardHeader from '@/Components/Dashboard/DashboardHeader';
import { Skeleton } from '@/Components/ui/skeleton';
import EngagementManager from '@/Components/Engagement/EngagementManager';
import QuizGame from '@/Components/Engagement/QuizGame';
import ConnectDotsGame from '@/Components/Engagement/ConnectDotsGame';

const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  checked_in: { bg: 'bg-blue-100', text: 'text-blue-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' }
};

const ticketColors = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700' },
  vip: { bg: 'bg-purple-100', text: 'text-purple-700' },
  speaker: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  sponsor: { bg: 'bg-orange-100', text: 'text-orange-700' }
};

export default function EventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddAttendee, setShowAddAttendee] = useState(false);
  const [newAttendee, setNewAttendee] = useState({
    attendee_name: '',
    attendee_email: '',
    company: '',
    job_title: '',
    phone: '',
    ticket_type: 'general'
  });

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: ['registrations', eventId],
    queryFn: () => base44.entities.Registration.filter({ event_id: eventId }),
    enabled: !!eventId
  });

  const addRegistrationMutation = useMutation({
    mutationFn: (data) => base44.entities.Registration.create({ ...data, event_id: eventId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['registrations', eventId]);
      setShowAddAttendee(false);
      setNewAttendee({
        attendee_name: '',
        attendee_email: '',
        company: '',
        job_title: '',
        phone: '',
        ticket_type: 'general'
      });
    }
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Registration.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['registrations', eventId])
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: (id) => base44.entities.Registration.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['registrations', eventId])
  });

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <Link to={createPageUrl('Events')}>
            <Button variant="outline">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EngagementManager />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="p-6">
          {/* Back Button */}
          <Link to={createPageUrl('Events')} className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>

          {/* Event Header */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            {/* Cover */}
            <div className="relative h-64 bg-gradient-to-br from-slate-800 to-slate-900">
              {event.cover_image && (
                <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-white/20 text-white border-0 capitalize">
                        {event.event_type?.replace('_', ' ')}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0 capitalize">
                        {event.status}
                      </Badge>
                      {event.is_free ? (
                        <Badge className="bg-green-500/80 text-white border-0">Free</Badge>
                      ) : (
                        <Badge className="bg-cyan-500/80 text-white border-0">${event.ticket_price}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-gray-900">{registrations.length}</p>
                <p className="text-gray-500 text-sm">Registrations</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {registrations.filter(r => r.status === 'checked_in').length}
                </p>
                <p className="text-gray-500 text-sm">Checked In</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {event.max_attendees || '∞'}
                </p>
                <p className="text-gray-500 text-sm">Capacity</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {registrations.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-gray-500 text-sm">Pending</p>
              </div>
            </div>

            {/* Event Info */}
            <div className="p-6 grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {event.start_date ? format(new Date(event.start_date), 'MMM dd, yyyy') : 'TBD'}
                  </p>
                  {event.start_date && (
                    <p className="text-sm text-gray-500">
                      {format(new Date(event.start_date), 'h:mm a')}
                      {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                    </p>
                  )}
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              )}
              {event.virtual_link && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Video className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Virtual Link</p>
                    <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                      className="font-medium text-cyan-600 hover:underline truncate block max-w-xs">
                      {event.virtual_link}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="attendees">
            <TabsList className="mb-6">
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>

            <TabsContent value="attendees">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Attendees ({registrations.length})</CardTitle>
                  <Dialog open={showAddAttendee} onOpenChange={setShowAddAttendee}>
                    <DialogTrigger asChild>
                      <Button className="bg-cyan-500 hover:bg-cyan-600">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Attendee
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Attendee</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        addRegistrationMutation.mutate(newAttendee);
                      }} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Full Name *</Label>
                            <Input
                              value={newAttendee.attendee_name}
                              onChange={(e) => setNewAttendee(prev => ({ ...prev, attendee_name: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={newAttendee.attendee_email}
                              onChange={(e) => setNewAttendee(prev => ({ ...prev, attendee_email: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Company</Label>
                            <Input
                              value={newAttendee.company}
                              onChange={(e) => setNewAttendee(prev => ({ ...prev, company: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Job Title</Label>
                            <Input
                              value={newAttendee.job_title}
                              onChange={(e) => setNewAttendee(prev => ({ ...prev, job_title: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={newAttendee.phone}
                              onChange={(e) => setNewAttendee(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Ticket Type</Label>
                            <Select
                              value={newAttendee.ticket_type}
                              onValueChange={(val) => setNewAttendee(prev => ({ ...prev, ticket_type: val }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                                <SelectItem value="speaker">Speaker</SelectItem>
                                <SelectItem value="sponsor">Sponsor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600">
                          Add Attendee
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {registrationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : registrations.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No attendees yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Attendee</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Ticket</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((reg) => {
                          const statusStyle = statusColors[reg.status] || statusColors.pending;
                          const ticketStyle = ticketColors[reg.ticket_type] || ticketColors.general;
                          return (
                            <TableRow key={reg.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{reg.attendee_name}</p>
                                  <p className="text-sm text-gray-500">{reg.attendee_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p>{reg.company || '-'}</p>
                                  <p className="text-sm text-gray-500">{reg.job_title}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${ticketStyle.bg} ${ticketStyle.text} border-0 capitalize`}>
                                  {reg.ticket_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 capitalize`}>
                                  {reg.status?.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => updateRegistrationMutation.mutate({ id: reg.id, data: { status: 'approved' } })}
                                    >
                                      <Check className="w-4 h-4 mr-2" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => updateRegistrationMutation.mutate({ id: reg.id, data: { status: 'checked_in' } })}
                                    >
                                      <Check className="w-4 h-4 mr-2" /> Check In
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => deleteRegistrationMutation.mutate(reg.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-600">{event.description || 'No description provided.'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement">
              <Card>
                <CardHeader>
                  <CardTitle>Attendee Engagement</CardTitle>
                  <p className="text-gray-500">Preview the engagement activities available to attendees.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold mb-4">Quiz Game</h3>
                      <QuizGame />
                    </div>
                    <div>
                      <h3 className="font-bold mb-4">Connect The Dots</h3>
                      <ConnectDotsGame />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
