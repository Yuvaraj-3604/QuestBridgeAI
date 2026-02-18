
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

// Helper to get users from storage
const getUsers = () => {
    const stored = localStorage.getItem('mockUsers');
    if (stored) {
        return JSON.parse(stored);
    }
    const defaults = [
        {
            id: 1,
            full_name: 'John Doe',
            email: 'john@example.com',
            password: 'password123'
        }
    ];
    localStorage.setItem('mockUsers', JSON.stringify(defaults));
    return defaults;
};

export const base44 = {
    auth: {
        me: async () => {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                return JSON.parse(storedUser);
            }
            // Return default user if not logged in (to prevent breaking)
            return { full_name: 'John Doe', email: 'john@example.com' };
        },
        login: async (email, password) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const users = getUsers();
                    const user = users.find(u => u.email === email || u.username === email); // Allow username or email

                    if (!user) {
                        reject(new Error("No account found with this email."));
                        return;
                    }

                    // Simulate password hash comparison
                    if (user.password !== password) {
                        reject(new Error("Incorrect password. Please try again."));
                        return;
                    }

                    // Set current session
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    resolve(user);
                }, 1000);
            });
        },
        signup: async (userData) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const users = getUsers();
                    const newUser = {
                        id: users.length + 1,
                        ...userData
                    };
                    users.push(newUser);
                    localStorage.setItem('mockUsers', JSON.stringify(users));
                    resolve(newUser);
                }, 1000);
            });
        },
        logout: async () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    localStorage.removeItem('currentUser');
                    resolve();
                }, 500);
            });
        },
        updateMe: async (updates) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const storedUser = localStorage.getItem('currentUser');
                    if (!storedUser) {
                        reject(new Error("Not authenticated"));
                        return;
                    }

                    const currentUser = JSON.parse(storedUser);

                    let updatedUser;
                    // Handle notifications vs profile data - shallow merge updates
                    if (updates && updates.notifications) {
                        updatedUser = {
                            ...currentUser,
                            notifications: {
                                ...(currentUser.notifications || {}),
                                ...updates.notifications
                            }
                        };
                    } else {
                        updatedUser = { ...currentUser, ...updates };
                    }

                    // Update in list
                    const users = getUsers();
                    const index = users.findIndex(u => u.id === currentUser.id || u.email === currentUser.email);
                    if (index !== -1) {
                        // Apply same logic to stored user in list
                        if (updates && updates.notifications) {
                            users[index] = {
                                ...users[index],
                                notifications: {
                                    ...(users[index].notifications || {}),
                                    ...updates.notifications
                                }
                            };
                        } else {
                            users[index] = { ...users[index], ...updates };
                        }
                        localStorage.setItem('mockUsers', JSON.stringify(users));
                    }

                    // Update session
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                    resolve(updatedUser);
                }, 800);
            });
        },
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
