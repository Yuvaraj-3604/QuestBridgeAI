
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/Pages/Home';
import Dashboard from '@/Pages/Dashboard';
import Events from '@/Pages/Events';
import CreateEvent from '@/Pages/CreateEvent';
import EventDetails from '@/Pages/EventDetails';
import Attendees from '@/Pages/Attendees';
import Analytics from '@/Pages/Analytics';
import Marketing from '@/Pages/Marketing';
import Settings from '@/Pages/Settings';
import Leaderboard from '@/Pages/Leaderboard';
import AILeaderboardResults from '@/Pages/AILeaderboardResults';
import ProjectMonitoringFeed from '@/Pages/ProjectMonitoringFeed';
import Login from '@/Pages/Login';
import Signup from '@/Pages/Signup';
import ForgotPassword from '@/Pages/ForgotPassword';
import BookDemo from '@/Pages/BookDemo';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Events" element={<Events />} />
                <Route path="/CreateEvent" element={<CreateEvent />} />
                <Route path="/EventDetails" element={<EventDetails />} />
                <Route path="/Attendees" element={<Attendees />} />
                <Route path="/Analytics" element={<Analytics />} />
                <Route path="/Marketing" element={<Marketing />} />
                <Route path="/Leaderboard" element={<Leaderboard />} />
                <Route path="/AIResults" element={<AILeaderboardResults />} />
                <Route path="/Monitoring" element={<ProjectMonitoringFeed />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/Settings" element={<Settings />} />
                <Route path="/book-demo" element={<BookDemo />} />
            </Routes>
        </Router>
    );
}

export default App;
