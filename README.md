CodeCraftHub API
Personal learning goal tracker API built with Node.js and Express. Data is stored in a simple JSON file (courses.json) to keep things beginner-friendly and database-free.

Project overview
Lightweight REST API to manage learning courses.
All data stored in a JSON file named courses.json (no database).
Endpoints under /api/courses for Create, Read, Update, and Delete (CRUD).
Each course includes:
id: auto-generated numeric identifier starting from 1
name: required
description: required
target_date: required, format YYYY-MM-DD
status: required; one of "Not Started", "In Progress", or "Completed"
created_at: auto-generated timestamp
Server runs on port 5000.
Automatically creates courses.json if it doesn’t exist.
No authentication required.
Features
CRUD endpoints for courses
Simple file-based storage (courses.json)
Basic input validation (required fields, date format, valid status)
Clear error handling for missing fields, not-found resources, invalid statuses, and file I/O issues
Beginner-friendly code with comments
Installation
Prerequisites:

Node.js installed (v14+ recommended)
Create a new project directory (or use an existing one).

Install dependencies (only Express is needed for this project):

npm install
Note: This project uses a single app.js file and a pre-defined package.json. If you’re starting fresh, ensure dependencies are listed (Express).
Ensure you have the app.js file (the server code) and the data file setup as described in the project.

How to run the application
In the project root, start the server:

npm start
This will run node app.js and start the server on port 5000.
The first run will create the data file courses.json automatically if it doesn’t exist.

Open the API in your browser or via curl:

http://localhost:5000/api/courses
API endpoint documentation
Base path: /api/courses

Note: All requests expect JSON bodies for create/update where applicable, and responses are in JSON.

Create a new course
POST /api/courses

Request body (JSON): { "name": "Intro to JavaScript", "description": "Learn basics of JavaScript", "target_date": "2026-12-31", "status": "Not Started" }

Response:

Status: 201 Created
Body: the created course object, including id and created_at
Errors:

400 Bad Request if any required field is missing or invalid
500 Internal Server Error for unexpected server errors
Example (curl): curl -X POST http://localhost:5000/api/courses
-H "Content-Type: application/json"
-d '{"name":"Intro to JavaScript","description":"Learn basics of JS","target_date":"2026-12-31","status":"Not Started"}'

Get all courses
GET /api/courses

Response:

Status: 200 OK
Body: array of course objects
Example (curl): curl http://localhost:5000/api/courses

Get a specific course by id
GET /api/courses/{id}

Note: The implementation exposes a route GET /api/courses/:id

Response:

Status: 200 OK
Body: the course object
If not found: 404 Not Found with error message
Example (curl): curl http://localhost:5000/api/courses/1

Update a course
PUT /api/courses

Request body (JSON) - partial updates allowed, but id is required { "id": 1, "name": "Intro to JavaScript - Updated", "description": "Updated description", "target_date": "2026-11-30", "status": "In Progress" }

Response:

Status: 200 OK
Body: the updated course object
Errors:

400 Bad Request for invalid payload
404 Not Found if the course with given id doesn’t exist
500 Internal Server Error for unexpected issues
Example (curl): curl -X PUT http://localhost:5000/api/courses
-H "Content-Type: application/json"
-d '{"id":1,"name":"Intro to JavaScript - Updated","description":"Updated","target_date":"2026-11-30","status":"In Progress"}'

Delete a course
DELETE /api/courses
Request body (JSON): { "id": 1 }
Response:
Status: 204 No Content on successful deletion (no response body)
404 Not Found if the course doesn’t exist
Example (curl): curl -X DELETE http://localhost:5000/api/courses
-H "Content-Type: application/json"
-d '{"id": 1}'
Status values for status field

"Not Started"
"In Progress"
"Completed"
Date format

target_date must be in YYYY-MM-DD format (e.g., 2026-12-31)
Data storage details
Data file: courses.json (located in the project root)
Structure: an array of course objects
Each course object includes:
id: numeric, auto-generated starting from 1
name
description
target_date (YYYY-MM-DD)
status
created_at (ISO timestamp)
Error handling and troubleshooting
Common errors and what they mean:

400 Bad Request: Missing required fields or invalid payload (e.g., missing target_date, invalid status, non-string name/description, or missing id for updates)
404 Not Found: No course exists with the provided id
500 Internal Server Error: Unexpected I/O or server issue (check server logs)
Tips:

Ensure the JSON you send is valid (use a JSON linter or pretty-printed JSON).
When updating, include id in the request body.
If the server cannot locate courses.json, it will attempt to create it automatically on startup.
If you encounter permissions issues, ensure the project directory is writable by the running process.
Troubleshooting checklist
 Server starts but curl requests fail with 400: double-check required fields and correct field names (name, description, target_date, status)
 Server returns 404 for an existing course: confirm the id exists in courses.json
 500 errors: check the server console for stack traces; ensure the filesystem is writable
 Data file not created: verify that the app has permission to create files in the project directory; ensure you started the server from the project root
