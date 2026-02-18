import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { MapPin, Users, Video, Calendar, MoreVertical, Heart, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const eventTypeColors = {
    in_person: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In-Person' },
    virtual: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Virtual' },
    hybrid: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Hybrid' },
    webinar: { bg: 'bg-green-100', text: 'text-green-700', label: 'Webinar' }
};

const statusColors = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
    published: { bg: 'bg-green-100', text: 'text-green-700' },
    ongoing: { bg: 'bg-orange-100', text: 'text-orange-700' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700' }
};

export default function EventCard({ event, index = 0, registrationCount = 0 }) {
    if (!event) return null;

    const typeStyle = eventTypeColors[event?.event_type] || eventTypeColors.in_person;
    const statusStyle = statusColors[event.status] || statusColors.draft;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                {
                    event.cover_image ? (
                        <img
                            src={event.cover_image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center" >
                            <Calendar className="w-16 h-16 text-slate-700" />
                        </div>
                    )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2" >
                    <Badge className={`${typeStyle.bg} ${typeStyle.text} border-0`}>
                        {typeStyle.label}
                    </Badge>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-colors">
                        <Heart className="w-4 h-4" />
                    </button>
                    <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 capitalize`}>
                        {event.status}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-6" >
                <div className="flex items-start justify-between mb-3" >
                    <Link to={createPageUrl(`EventDetails?id=${event.id}`)}>
                        <h3 className="text-xl font-bold text-gray-900 hover:text-cyan-600 transition-colors line-clamp-1" >
                            {event.title}
                        </h3>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild >
                            <Button variant="ghost" size="icon" className="h-8 w-8" >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Link to={createPageUrl(`EventDetails?id=${event.id}`)}> View Details </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem> Edit Event </DropdownMenuItem>
                            <DropdownMenuItem> Duplicate </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600"> Delete </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {event.description || 'No description available'}
                </p>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600" >
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{event.start_date ? format(new Date(event.start_date), 'MMM dd, yyyy • h:mm a') : 'Date TBD'} </span>
                    </div>
                    {
                        event.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600" >
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="truncate" > {event.location} </span>
                            </div>
                        )
                    }
                    {
                        event.event_type === 'virtual' && event.virtual_link && (
                            <div className="flex items-center gap-2 text-sm text-gray-600" >
                                <Video className="w-4 h-4 text-gray-400" />
                                <span>Virtual Event </span>
                            </div>
                        )
                    }
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2" >
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600" >
                            {registrationCount} / {event.max_attendees || '∞'} attendees
                        </span>
                    </div>
                    <Link to={createPageUrl(`EventDetails?id=${event.id}`)}>
                        <Button size="sm" variant="outline" className="text-cyan-600 border-cyan-200 hover:bg-cyan-50">
                            Manage
                        </Button>
                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-cyan-600" title="Publish Event">
                            <Globe className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}