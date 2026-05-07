/*
  CodeCraftHub - Simple REST API for managing learning courses
  - Node.js + Express
  - Data stored in a JSON file: courses.json (at project root)
  - CRUD endpoints under /api/courses
  - id is auto-generated starting from 1 (numeric)
  - Fields per course:
      - id (number)
      - name (string)        - required
      - description (string) - required
      - target_date (string, format YYYY-MM-DD) - required
      - status (string)      - required; one of: "Not Started", "In Progress", "Completed"
      - created_at (string, ISO timestamp) - auto-generated
  - Port: 5000
  - Automatically creates courses.json if it doesn't exist
  - Includes robust error handling and beginner-friendly comments
*/

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Server port
const PORT = 5000;
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
};
// Apply CORS middleware BEFORE other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Data file path (at project root)
const DATA_FILE = path.resolve(__dirname, 'courses.json');

// Allowed status values
const ALLOWED_STATUSES = ['Not Started', 'In Progress', 'Completed'];

/*
  Ensure the data file exists.
  If it doesn't, create it with an empty array: []
*/
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.writeFile(DATA_FILE, '[]', 'utf8');
            console.log(`Data file created: ${DATA_FILE}`);
        } else {
            throw err;
        }
    }
}

/*
  Read all courses from the JSON file
  Returns an array of course objects
*/
async function readData() {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
}

/*
  Write the entire courses array back to the JSON file
*/
async function writeData(dataArray) {
    const content = JSON.stringify(dataArray, null, 2);
    await fs.writeFile(DATA_FILE, content, 'utf8');
}

/*
  Validation helpers
*/

// Very light validation for date format: YYYY-MM-DD
function isValidDateString(dateStr) {
    return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// Validate payload for creating a course (all required)
function validateCreatePayload(payload) {
    const errors = [];
    if (!payload || typeof payload !== 'object') {
        errors.push('Request body must be a JSON object.');
        return errors;
    }

    if (!payload.name || typeof payload.name !== 'string') {
        errors.push('name is required and must be a string.');
    }
    if (!payload.description || typeof payload.description !== 'string') {
        errors.push('description is required and must be a string.');
    }
    if (!payload.target_date || !isValidDateString(payload.target_date)) {
        errors.push('target_date is required and must be in YYYY-MM-DD format.');
    }
    if (!payload.status || !ALLOWED_STATUSES.includes(payload.status)) {
        errors.push(`status is required and must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }

    return errors;
}

// Validate payload for updating a course (partial updates allowed)
function validateUpdatePayload(payload) {
    const errors = [];
    if (!payload || typeof payload !== 'object') {
        errors.push('Request body must be a JSON object.');
        return errors;
    }

    // Validate provided fields
    if (payload.name !== undefined && typeof payload.name !== 'string') {
        errors.push('name must be a string if provided.');
    }
    if (payload.description !== undefined && typeof payload.description !== 'string') {
        errors.push('description must be a string if provided.');
    }
    if (payload.target_date !== undefined && !isValidDateString(payload.target_date)) {
        errors.push('target_date must be in YYYY-MM-DD format if provided.');
    }
    if (payload.status !== undefined && !ALLOWED_STATUSES.includes(payload.status)) {
        errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')} when provided.`);
    }

    // If none of the allowed fields are provided, that's an error
    const hasUpdatableField =
        payload.name !== undefined ||
        payload.description !== undefined ||
        payload.target_date !== undefined ||
        payload.status !== undefined;

    if (!hasUpdatableField) {
        errors.push('At least one of name, description, target_date, or status must be provided.');
    }

    return errors;
}

/*
  Helper to compute the next incremental id
  - Reads all existing courses and returns max(id) + 1
  - Starts from 1 if none exist
*/
async function getNextId(data) {
    if (!Array.isArray(data) || data.length === 0) return 1;
    const maxId = data.reduce((max, c) => (typeof c.id === 'number' && c.id > max ? c.id : max), 0);
    return maxId + 1;
}

/*
  ROUTES
  All endpoints are under /api/courses
*/

// POST /api/courses
// Add a new course
app.post('/api/courses', async (req, res) => {
    try {
        const payload = req.body;
        const errors = validateCreatePayload(payload);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(' ') });
        }

        const data = await readData();
        const nextId = await getNextId(data);

        const newCourse = {
            id: nextId,
            name: payload.name,
            description: payload.description,
            target_date: payload.target_date,
            status: payload.status,
            created_at: new Date().toISOString()
        };

        data.push(newCourse);
        await writeData(data);

        res.status(201).json(newCourse);
    } catch (err) {
        console.error('Error while creating course:', err);
        res.status(500).json({ error: 'Internal server error while creating course.' });
    }
});

// GET /api/courses
// Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const data = await readData();
        res.json(data);
    } catch (err) {
        console.error('Error while reading courses:', err);
        res.status(500).json({ error: 'Internal server error while retrieving courses.' });
    }
});

// GET /api/courses/:id
// Get a specific course by id
app.get('/api/courses/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid course id.' });
        }

        const data = await readData();
        const course = data.find((c) => c.id === id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        return res.json(course);
    } catch (err) {
        console.error('Error while getting course:', err);
        return res.status(500).json({ error: 'Internal server error while retrieving the course.' });
    }
});

// PUT /api/courses/:id
// Update a course by id (URL-based update)
app.put('/api/courses/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid course id.' });
        }

        const updates = req.body || {};
        // Validate: at least one updatable field provided
        const errors = [];
        const hasField =
            updates.name !== undefined ||
            updates.description !== undefined ||
            updates.target_date !== undefined ||
            updates.status !== undefined;

        if (!hasField) {
            errors.push('At least one of name, description, target_date, or status must be provided.');
        }

        if (updates.name !== undefined && typeof updates.name !== 'string') {
            errors.push('name must be a string if provided.');
        }
        if (updates.description !== undefined && typeof updates.description !== 'string') {
            errors.push('description must be a string if provided.');
        }
        if (updates.target_date !== undefined && !isValidDateString(updates.target_date)) {
            errors.push('target_date must be in YYYY-MM-DD format if provided.');
        }
        if (updates.status !== undefined && !ALLOWED_STATUSES.includes(updates.status)) {
            errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')} when provided.`);
        }

        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(' ') });
        }

        const data = await readData();
        const idx = data.findIndex((c) => c.id === id);
        if (idx === -1) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        const existing = data[idx];
        const updated = {
            ...existing,
            name: updates.name !== undefined ? updates.name : existing.name,
            description: updates.description !== undefined ? updates.description : existing.description,
            target_date: updates.target_date !== undefined ? updates.target_date : existing.target_date,
            status: updates.status !== undefined ? updates.status : existing.status,
            updated_at: new Date().toISOString()
        };

        data[idx] = updated;
        await writeData(data);

        res.json(updated);
    } catch (err) {
        console.error('Error while updating course:', err);
        res.status(500).json({ error: 'Internal server error while updating course.' });
    }
});

// DELETE /api/courses/:id
// Delete a course by id (URL-based delete)
app.delete('/api/courses/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid course id.' });
        }

        const data = await readData();
        const idx = data.findIndex((c) => c.id === id);
        if (idx === -1) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        data.splice(idx, 1);
        await writeData(data);

        // 204 No Content indicates success with no body
        return res.status(204).send();
    } catch (err) {
        console.error('Error while deleting course:', err);
        return res.status(500).json({ error: 'Internal server error while deleting course.' });
    }
});

/*
  Initialize the app
  - Ensure the data file exists (creates it if missing)
  - Start listening on the configured port
*/
(async () => {
    try {
        await ensureDataFile();
        console.log(`Data store ready at ${DATA_FILE}`);
        app.listen(PORT, () => {
            console.log(`CodeCraftHub API is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})();