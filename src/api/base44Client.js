
// Mock base44 client
const mockEvents = [
    {
        id: 1,
        title: 'Tech Innovation Summit 2025',
        description: 'Join industry leaders and innovators for a full day of cutting-edge technology discussions, networking opportunities, and hands-on workshops. Explore the latest trends in AI, blockchain, and sustainable tech.',
        start_date: '2025-12-15T09:00:00',
        location: 'San Francisco Convention Center, CA',
        status: 'published',
        event_type: 'hybrid',
        cover_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        max_attendees: 500
    },
    {
        id: 2,
        title: 'Product Design Masterclass',
        description: 'A comprehensive workshop on modern product design principles, UX research methods, and design thinking. Perfect for designers looking to level up their skills.',
        start_date: '2025-12-12T14:00:00',
        location: 'Virtual Event',
        status: 'published',
        event_type: 'virtual',
        cover_image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        max_attendees: 100
    },
    {
        id: 3,
        title: 'Startup Networking Night',
        description: 'Connect with fellow entrepreneurs, investors, and mentors in an evening of networking and knowledge sharing. Pitch your ideas and find your next co-founder!',
        start_date: '2025-12-12T18:00:00',
        location: 'WeWork Downtown, New York, NY',
        status: 'published',
        event_type: 'in_person',
        cover_image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        max_attendees: 150
    }
];

const mockRegistrations = [];

export const base44 = {
    auth: {
        me: async () => ({ full_name: 'John Doe', email: 'john@example.com' }),
        login: async () => { },
        logout: async () => { },
    },
    integrations: {
        Core: {
            UploadFile: async ({ file }) => ({ file_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' })
        }
    },
    entities: {
        Event: {
            list: async () => mockEvents,
            get: async (id) => mockEvents.find(e => e.id == id) || mockEvents[0],
            filter: async (params) => {
                if (params && params.id) {
                    const found = mockEvents.find(e => e.id == params.id);
                    return found ? [found] : [];
                }
                return mockEvents;
            },
            create: async (data) => {
                const newEvent = {
                    ...data,
                    id: Math.floor(Math.random() * 10000) + 4,
                    // Ensure defaults for required fields if missing
                    max_attendees: data.max_attendees || 100,
                    ticket_price: data.ticket_price || 0
                };
                mockEvents.unshift(newEvent); // Add to beginning
                return newEvent;
            },
            update: async () => { },
            delete: async () => { },
        },
        Registration: {
            list: async () => mockRegistrations,
            filter: async (params) => {
                if (params && params.event_id) {
                    return mockRegistrations.filter(r => r.event_id == params.event_id);
                }
                return mockRegistrations;
            },
            create: async (data) => {
                const newReg = { ...data, id: Math.floor(Math.random() * 10000), status: 'pending' };
                mockRegistrations.push(newReg);
                return newReg;
            },
            update: async (id, data) => {
                const index = mockRegistrations.findIndex(r => r.id === id);
                if (index !== -1) {
                    mockRegistrations[index] = { ...mockRegistrations[index], ...data };
                    return mockRegistrations[index];
                }
            },
            delete: async (id) => {
                const index = mockRegistrations.findIndex(r => r.id === id);
                if (index !== -1) {
                    mockRegistrations.splice(index, 1);
                }
            },
        },
    },
    storage: {
        upload: async () => 'https://via.placeholder.com/150',
    }
};
