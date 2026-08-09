import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Evaluator from '../models/Evaluator.js';

const router = express.Router();

// Strictly protect all admin routes
router.use(requireAuth('admin'));

// ==========================================
// EVENTS API
// ==========================================
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

router.post('/events', async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// ==========================================
// TRACKS API (The Round 1 Bug Fix)
// ==========================================
// BUG CONTEXT: In Round 1, modifying a track caused array corruption or race conditions 
// because the entire Event document was fetched, modified in memory, and re-saved.
// FIX: We strictly use MongoDB atomic operators ($push, $set, $pull) to isolate track CRUD.

router.post('/events/:eventId/tracks', async (req, res) => {
    try {
        // Atomic $push prevents race conditions when multiple admins add tracks simultaneously
        const event = await Event.findByIdAndUpdate(
            req.params.eventId,
            { $push: { tracks: req.body } },
            { new: true, runValidators: true }
        );
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add track' });
    }
});

router.put('/events/:eventId/tracks/:trackId', async (req, res) => {
    try {
        const { name, description, capacity, isLocked } = req.body;
        
        // Atomic $set isolates the update to ONLY this specific sub-document
        const event = await Event.findOneAndUpdate(
            { _id: req.params.eventId, "tracks._id": req.params.trackId },
            { 
                $set: {
                    "tracks.$.name": name,
                    "tracks.$.description": description,
                    "tracks.$.capacity": capacity,
                    "tracks.$.isLocked": isLocked
                }
            },
            { new: true }
        );
        
        if (!event) return res.status(404).json({ error: 'Track or Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update track. Race condition prevented.' });
    }
});

router.delete('/events/:eventId/tracks/:trackId', async (req, res) => {
    try {
        // Atomic $pull safely removes the track
        const event = await Event.findByIdAndUpdate(
            req.params.eventId,
            { $pull: { tracks: { _id: req.params.trackId } } },
            { new: true }
        );
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete track' });
    }
});

// ==========================================
// USERS API (Evaluators, Judges, etc)
// ==========================================
router.get('/evaluators', async (req, res) => {
    try {
        const evaluators = await Evaluator.find().populate('eventId', 'name');
        res.json(evaluators);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch evaluators' });
    }
});

export default router;
