# GlucoNote

A personal diabetes health tracker for logging blood sugar readings, medications, doctor visits and notes, with a one-click summary to share with your doctor.

**Live demo:** _link coming soon_

> This is **version 1**, a single-user demo. Anyone with the link sees and edits the same sample data, which resets from time to time.
> **Version 2** is in development as a full multi-user rebuild with secure login (JWT), React, PostgreSQL and Docker.

## Features

- Log blood sugar readings with date, time and context (fasting, before meal, after meal, bedtime)
- Interactive line chart with 7, 30, 90 day and all-time views, arrows to scroll back through past readings, and colour-coded points
- Track medications, doctor visits and personal notes
- Add, edit and delete every type of entry
- Search across readings, medications, visits and notes
- Generate a printable health summary for doctor appointments
- Patient profile

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** HTML, CSS, vanilla JavaScript, Chart.js
- **Design:** Figma

## Project Structure

```
gluconote/
  backend/
    main.py          # app setup, routers, serves the frontend
    database.py      # SQLite connection
    models.py        # database tables
    schemas.py       # request and response validation
    seed.py          # sample data for an empty database
    routers/         # one file per feature (readings, medications, visits, notes, profile, search, summary)
  frontend/
    index.html
    style.css
    app.js
```

## Running Locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Then open http://127.0.0.1:8000. API docs are at http://127.0.0.1:8000/docs.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/readings` | List or add glucose readings |
| GET, PUT, DELETE | `/readings/{id}` | Get, update or delete a reading |
| GET, POST | `/medications` | List or add medications |
| PUT, DELETE | `/medications/{id}` | Update or delete a medication |
| GET, POST | `/visits` | List or add doctor visits |
| PUT, DELETE | `/visits/{id}` | Update or delete a visit |
| GET, POST | `/notes` | List or add notes |
| PUT, DELETE | `/notes/{id}` | Update or delete a note |
| GET, POST, PUT | `/profile` | View, create or update the profile |
| GET | `/search?q=` | Search across all entries |
| GET | `/summary` | 30-day health summary |

## Author

Built by [waasifah-suleman](https://github.com/waasifah-suleman)
