import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  BarChart3,
  Mail,
  HelpCircle,
  Plus,
  ChevronLeft,
  Trophy,
  Brain,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'Dashboard' },
  { icon: CalendarDays, label: 'Events', page: 'Events' },
  { icon: Users, label: 'Attendees', page: 'Attendees' },
  { icon: BarChart3, label: 'Analytics', page: 'Analytics' },
  { icon: Mail, label: 'Marketing', page: 'Marketing' },
  { icon: Trophy, label: 'Leaderboard', page: 'Leaderboard' },
  { icon: Brain, label: 'AI Results', page: 'AIResults' },
  { icon: Activity, label: 'Monitoring', page: 'Monitoring' },
  { icon: Settings, label: 'Settings', page: 'Settings' }
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <Link to={createPageUrl('Home')} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          {!collapsed && <span className="font-bold text-xl">Questbridge</span>}
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Create Event Button */}
      <div className="p-4">
        <Link to={createPageUrl('CreateEvent')}>
          <Button className={cn(
            "w-full bg-cyan-500 hover:bg-cyan-600 transition-all",
            collapsed ? "px-3" : "px-4"
          )}>
            <Plus className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Create Event</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentPath.includes(item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-gray-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Help */}
      <div className="p-4 border-t border-slate-800">
        <button className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white transition-all w-full"
        )}>
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Help & Support</span>}
        </button>
      </div>
    </aside>
  );
}