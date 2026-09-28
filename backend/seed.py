import random
from datetime import datetime, timedelta

from .database import SessionLocal
from . import models

DEMO_DAYS = 180  # about six months of history


def _reading_value(context, days_ago, rng):
    """Realistic mg/dL values for someone with Type 2 diabetes whose control improves after starting Metformin."""
    # 0.0 at the start of the history, 1.0 today
    progress = 1 - (days_ago / DEMO_DAYS)

    ranges = {
        "fasting": (150, 105),       # (typical six months ago, typical now)
        "before_meal": (160, 115),
        "after_meal": (230, 160),
        "bedtime": (185, 130),
    }
    start, end = ranges[context]
    typical = start + (end - start) * progress

    value = typical + rng.uniform(-18, 18)

    # the odd high spike after a big meal, and a rare low
    roll = rng.random()
    if context == "after_meal" and roll < 0.12:
        value += rng.uniform(30, 60)
    elif context == "fasting" and roll < 0.03:
        value = rng.uniform(62, 69)

    return round(value)


def seed_demo_data():
    """Fill an empty database with realistic sample data so the demo never looks blank."""
    db = SessionLocal()

    try:
        if db.query(models.GlucoseReading).first() or db.query(models.Profile).first():
            return

        # fixed seed = the same demo data every time the app starts fresh
        rng = random.Random(42)
        now = datetime.now().replace(second=0, microsecond=0)

        db.add(models.Profile(
            first_name="Demo",
            last_name="User",
            age=34,
            gender="female",
            diabetes_type="Type 2"
        ))

        # READINGS: most days have a fasting reading, many have one or two more
        for days_ago in range(DEMO_DAYS, -1, -1):
            day = now - timedelta(days=days_ago)

            if rng.random() < 0.12 and days_ago > 0:
                continue  # a few missed days, like real life

            day_readings = [("fasting", 7, rng.randint(0, 45))]
            if rng.random() < 0.55:
                day_readings.append(("after_meal", 13, rng.randint(15, 59)))
            if rng.random() < 0.25:
                day_readings.append(("before_meal", 18, rng.randint(0, 40)))
            if rng.random() < 0.35:
                day_readings.append(("bedtime", 21, rng.randint(30, 59)))

            for context, hour, minute in day_readings:
                reading_time = day.replace(hour=hour, minute=minute)
                if reading_time > now:
                    continue  # no readings in the future
                db.add(models.GlucoseReading(
                    value=_reading_value(context, days_ago, rng),
                    reading_time=reading_time,
                    context=context
                ))

        # MEDICATIONS
        db.add(models.Medication(
            name="Metformin",
            dosage="500mg twice daily",
            frequency="twice daily",
            start_date=now - timedelta(days=150),
            prescribing_doctor="Dr. Naidoo"
        ))
        db.add(models.Medication(
            name="Gliclazide",
            dosage="40mg once daily",
            frequency="once daily",
            start_date=now - timedelta(days=175),
            end_date=now - timedelta(days=150),
            prescribing_doctor="Dr. Naidoo"
        ))
        db.add(models.Medication(
            name="Vitamin D",
            dosage="1000 IU once daily",
            frequency="once daily",
            start_date=now - timedelta(days=60)
        ))

        # DOCTOR VISITS
        visits = [
            (178, "Dr. Naidoo", "Diagnosed with Type 2 diabetes. Started Gliclazide and asked to log fasting readings daily."),
            (150, "Dr. Naidoo", "Some low readings on Gliclazide. Switched to Metformin 500mg twice daily."),
            (95, "Dr. Pillay", "HbA1c improving. Discussed diet and walking after meals."),
            (60, "Dr. Naidoo", "Low vitamin D on blood test. Started supplement. Continue Metformin."),
            (10, "Dr. Pillay", "Fasting readings now mostly in range. Follow up in 3 months."),
        ]
        for days_ago, doctor, notes in visits:
            db.add(models.DoctorVisit(
                visit_date=now - timedelta(days=days_ago),
                doctor_name=doctor,
                notes=notes
            ))

        # NOTES
        notes = [
            (170, "Readings very high this week. Cutting down on sugary drinks."),
            (140, "Stomach a bit upset since starting Metformin. Taking it with food helps."),
            (100, "Started walking 20 minutes after dinner."),
            (45, "Higher reading after a late lunch. Try eating earlier."),
            (12, "Felt a bit dizzy in the morning, drank more water and felt better."),
            (3, "Best fasting week so far."),
        ]
        for days_ago, content in notes:
            db.add(models.Note(
                content=content,
                created_at=now - timedelta(days=days_ago, hours=rng.randint(1, 10))
            ))

        db.commit()
    finally:
        db.close()
