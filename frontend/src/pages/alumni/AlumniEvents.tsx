/**
 * Alumni Events - Browse and RSVP to alumni events
 * Features: Event listing, RSVP, Calendar view, Event details
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Typography,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Skeleton,
    Paper,
    Avatar,
    AvatarGroup,
    Tabs,
    Tab,
    IconButton,
    Divider,
} from '@mui/material';
import {
    Event,
    LocationOn,
    CalendarToday,
    AccessTime,
    People,
    CheckCircle,
    Cancel,
    Share,
    Add,
} from '@mui/icons-material';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format, isPast, isFuture, isToday, parseISO } from 'date-fns';

interface AlumniEvent {
    id: number;
    title: string;
    description: string;
    event_type: string;
    date: string;
    time: string;
    end_time?: string;
    location: string;
    is_virtual: boolean;
    virtual_link?: string;
    image?: string;
    max_attendees?: number;
    current_attendees: number;
    is_registered: boolean;
    registration_deadline?: string;
    organizer_name: string;
}

interface RSVPResponse {
    id: number;
    alumni_name: string;
    response: 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING';
    guests: number;
}

const AlumniEvents: React.FC = () => {
    const [events, setEvents] = useState<AlumniEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedEvent, setSelectedEvent] = useState<AlumniEvent | null>(null);
    const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
    const [rsvpResponse, setRsvpResponse] = useState<'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING'>('ATTENDING');
    const [guestCount, setGuestCount] = useState(0);
    const [eventDetailOpen, setEventDetailOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/alumni/events/');
            const data = response.data.results || response.data || [];
            setEvents(data);
        } catch (err) {
            console.error('Error fetching events:', err);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async () => {
        if (!selectedEvent) return;

        try {
            await api.post(`/api/alumni/events/${selectedEvent.id}/rsvp/`, {
                response: rsvpResponse,
                guests: guestCount,
            });

            toast.success('RSVP submitted successfully!');
            setRsvpDialogOpen(false);
            fetchEvents();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to submit RSVP');
        }
    };

    const handleCancelRSVP = async (eventId: number) => {
        try {
            await api.delete(`/api/alumni/events/${eventId}/rsvp/`);
            toast.success('RSVP cancelled');
            fetchEvents();
        } catch (err: any) {
            toast.error('Failed to cancel RSVP');
        }
    };

    const getEventTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            REUNION: '#8b5cf6',
            NETWORKING: '#3b82f6',
            WORKSHOP: '#f59e0b',
            WEBINAR: '#10b981',
            MEETUP: '#ec4899',
            FUNDRAISER: '#ef4444',
        };
        return colors[type] || '#6b7280';
    };

    const upcomingEvents = events.filter(e => isFuture(parseISO(e.date)) || isToday(parseISO(e.date)));
    const pastEvents = events.filter(e => isPast(parseISO(e.date)) && !isToday(parseISO(e.date)));
    const myEvents = events.filter(e => e.is_registered);

    const getFilteredEvents = () => {
        switch (activeTab) {
            case 0: return upcomingEvents;
            case 1: return pastEvents;
            case 2: return myEvents;
            default: return upcomingEvents;
        }
    };

    const EventCard = ({ event }: { event: AlumniEvent }) => {
        const eventDate = parseISO(event.date);
        const isPastEvent = isPast(eventDate) && !isToday(eventDate);
        const isFull = event.max_attendees && event.current_attendees >= event.max_attendees;

        return (
            <Card sx={{
                borderRadius: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: isPastEvent ? 0.7 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: isPastEvent ? 'none' : 'translateY(-4px)',
                    boxShadow: isPastEvent ? 'none' : '0 12px 40px rgba(0,0,0,0.12)',
                }
            }}>
                {/* Event Image */}
                <Box sx={{
                    height: 140,
                    background: event.image
                        ? `url(${event.image}) center/cover`
                        : `linear-gradient(135deg, ${getEventTypeColor(event.event_type)} 0%, ${getEventTypeColor(event.event_type)}99 100%)`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 2,
                }}>
                    <Chip
                        label={event.event_type.replace('_', ' ')}
                        size="small"
                        sx={{
                            bgcolor: 'white',
                            fontWeight: 600,
                        }}
                    />
                    {event.is_virtual && (
                        <Chip
                            label="Virtual"
                            size="small"
                            sx={{ bgcolor: 'white', ml: 1 }}
                        />
                    )}
                </Box>

                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Date Badge */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                    }}>
                        <Paper sx={{
                            p: 1.5,
                            textAlign: 'center',
                            minWidth: 60,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                        }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                                {format(eventDate, 'd')}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
                                {format(eventDate, 'MMM')}
                            </Typography>
                        </Paper>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {event.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                                <AccessTime sx={{ fontSize: 16 }} />
                                <Typography variant="body2">
                                    {event.time}{event.end_time ? ` - ${event.end_time}` : ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Location */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: '#64748b' }}>
                        <LocationOn sx={{ fontSize: 18, mr: 0.5 }} />
                        <Typography variant="body2" noWrap>
                            {event.is_virtual ? 'Online Event' : event.location}
                        </Typography>
                    </Box>

                    {/* Attendees */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: '#64748b' }}>
                        <People sx={{ fontSize: 18, mr: 0.5 }} />
                        <Typography variant="body2">
                            {event.current_attendees} attending
                            {event.max_attendees && ` / ${event.max_attendees} spots`}
                        </Typography>
                    </Box>

                    {/* Description */}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 2,
                        }}
                    >
                        {event.description}
                    </Typography>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={() => {
                                setSelectedEvent(event);
                                setEventDetailOpen(true);
                            }}
                        >
                            Details
                        </Button>
                        {!isPastEvent && (
                            event.is_registered ? (
                                <Button
                                    variant="contained"
                                    size="small"
                                    fullWidth
                                    color="success"
                                    startIcon={<CheckCircle />}
                                    onClick={() => handleCancelRSVP(event.id)}
                                >
                                    Registered
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    size="small"
                                    fullWidth
                                    disabled={!!isFull}
                                    onClick={() => {
                                        setSelectedEvent(event);
                                        setRsvpDialogOpen(true);
                                    }}
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    }}
                                >
                                    {isFull ? 'Full' : 'RSVP'}
                                </Button>
                            )
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        🎉 Alumni Events
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Reconnect with your classmates at our upcoming events
                    </Typography>
                </Box>
            </Box>

            {/* Tabs */}
            <Paper sx={{ borderRadius: 3, mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{ px: 2 }}
                >
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Upcoming
                                <Chip label={upcomingEvents.length} size="small" />
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Past Events
                                <Chip label={pastEvents.length} size="small" />
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                My Events
                                <Chip label={myEvents.length} size="small" color="primary" />
                            </Box>
                        }
                    />
                </Tabs>
            </Paper>

            {/* Events Grid */}
            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                            <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : getFilteredEvents().length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Event sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No events found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Check back later for upcoming events
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {getFilteredEvents().map((event) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={event.id}>
                            <EventCard event={event} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* RSVP Dialog */}
            <Dialog open={rsvpDialogOpen} onClose={() => setRsvpDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>RSVP to Event</DialogTitle>
                <DialogContent>
                    {selectedEvent && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {selectedEvent.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, color: '#64748b' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarToday sx={{ fontSize: 18 }} />
                                    <Typography variant="body2">
                                        {format(parseISO(selectedEvent.date), 'MMMM d, yyyy')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 18 }} />
                                    <Typography variant="body2">{selectedEvent.time}</Typography>
                                </Box>
                            </Box>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Your Response</InputLabel>
                                <Select
                                    value={rsvpResponse}
                                    label="Your Response"
                                    onChange={(e) => setRsvpResponse(e.target.value as any)}
                                >
                                    <MenuItem value="ATTENDING">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircle color="success" /> Attending
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="MAYBE">Maybe</MenuItem>
                                    <MenuItem value="NOT_ATTENDING">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Cancel color="error" /> Not Attending
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            {rsvpResponse === 'ATTENDING' && (
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Number of Guests (excluding yourself)"
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(Math.max(0, parseInt(e.target.value) || 0))}
                                    inputProps={{ min: 0, max: 5 }}
                                />
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRsvpDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleRSVP}>
                        Submit RSVP
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Event Detail Dialog */}
            <Dialog open={eventDetailOpen} onClose={() => setEventDetailOpen(false)} maxWidth="md" fullWidth>
                {selectedEvent && (
                    <>
                        <Box sx={{
                            height: 200,
                            background: selectedEvent.image
                                ? `url(${selectedEvent.image}) center/cover`
                                : `linear-gradient(135deg, ${getEventTypeColor(selectedEvent.event_type)} 0%, ${getEventTypeColor(selectedEvent.event_type)}99 100%)`,
                        }} />
                        <DialogContent>
                            <Chip
                                label={selectedEvent.event_type.replace('_', ' ')}
                                sx={{ mb: 2 }}
                            />
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                                {selectedEvent.title}
                            </Typography>

                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <CalendarToday color="action" />
                                        <Typography>
                                            {format(parseISO(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <AccessTime color="action" />
                                        <Typography>
                                            {selectedEvent.time}{selectedEvent.end_time ? ` - ${selectedEvent.end_time}` : ''}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <LocationOn color="action" />
                                        <Typography>
                                            {selectedEvent.is_virtual ? 'Online Event' : selectedEvent.location}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <People color="action" />
                                        <Typography>
                                            {selectedEvent.current_attendees} attending
                                            {selectedEvent.max_attendees && ` / ${selectedEvent.max_attendees} spots`}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" sx={{ mb: 1 }}>About this event</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                {selectedEvent.description}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" color="text.secondary">
                                Organized by: {selectedEvent.organizer_name}
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEventDetailOpen(false)}>Close</Button>
                            {!isPast(parseISO(selectedEvent.date)) && (
                                selectedEvent.is_registered ? (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckCircle />}
                                    >
                                        You're Registered
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setEventDetailOpen(false);
                                            setRsvpDialogOpen(true);
                                        }}
                                    >
                                        RSVP Now
                                    </Button>
                                )
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default AlumniEvents;
