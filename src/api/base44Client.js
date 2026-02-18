
// Mock base44 client
const mockEvents = [
    {
        id: 1,
        title: 'Tech Innovation Summit 2026',
        description: 'Join industry leaders and innovators for a full day of cutting-edge technology discussions, networking opportunities, and hands-on workshops. Explore the latest trends in AI, blockchain, and sustainable tech.',
        start_date: '2026-02-17T09:00:00',
        location: 'SNS College Of Engineering , Coimbatore',
        status: 'published',
        event_type: 'hybrid',
        cover_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        max_attendees: 500
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

            // Auto-login as the first default user if not logged in (for dev convenience)
            const users = getUsers();
            const defaultUser = users[0];

            localStorage.setItem('currentUser', JSON.stringify(defaultUser));
            return defaultUser;
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

                    try {
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
                    } catch (err) {
                        console.error("Storage error:", err);
                        reject(new Error("Failed to save changes. Storage might be full."));
                    }
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
            update: async (id, data) => {
                const index = mockEvents.findIndex(e => e.id == id);
                if (index !== -1) {
                    mockEvents[index] = { ...mockEvents[index], ...data };
                    return mockEvents[index];
                }
                throw new Error("Event not found");
            },
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
