# Workout App — ER Diagram

```mermaid
erDiagram
    EXERCISES ||--o{ ROUTINE_EXERCISES : "defines"
    WEEKLY_PLANS ||--|{ DAILY_WORKOUTS : "contains"
    DAILY_WORKOUTS ||--|{ ROUTINE_EXERCISES : "consists of"
    WEEKLY_PLANS ||--o{ WORKOUT_SESSIONS : "tracked in"
    DAILY_WORKOUTS ||--o{ WORKOUT_SESSIONS : "logged as"
    WORKOUT_SESSIONS ||--|{ WORKOUT_EXERCISES : "contains"
    WORKOUT_EXERCISES ||--|{ WORKOUT_SETS : "has"
    EXERCISES ||--o{ WORKOUT_EXERCISES : "performed in"

    EXERCISES {
        string id PK
        string name
        string mechanic
        string force
        json applicability
        string[] primaryMuscles
    }

    WEEKLY_PLANS {
        string id PK
        string name
        int daysPerWeek
        string splitType
        string trainingStyle
    }

    DAILY_WORKOUTS {
        string id PK
        string weeklyPlanId FK
        int dayNumber
        string name
        string[] targetMuscles
    }

    ROUTINE_EXERCISES {
        string exerciseId FK
        int sets
        string reps
        int restSeconds
    }

    WORKOUT_SESSIONS {
        string id PK
        string weeklyPlanId FK
        string dailyWorkoutId FK
        datetime date
        int duration
        float totalVolume
    }

    WORKOUT_EXERCISES {
        string exerciseId FK
        json personalRecord
    }

    WORKOUT_SETS {
        int setNumber
        float weight
        int completedReps
        int rpe
        boolean isWarmup
    }
```
