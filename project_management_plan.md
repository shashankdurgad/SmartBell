**Workout App --- MVP Dev Plan**

4 People · 4 Sprints · 8 Weeks · Vibe-Coding Friendly

Approach

This is an MVP. The goal is a working app, not a perfect one.
Vibe-coding is encouraged --- move fast, use AI tools, don't
over-engineer. No CI/CD, no E2E test suites, no accessibility audits.
Just get it working, make it useful, and ship it.

Team Split

Each person owns a chunk of the app end-to-end (engine logic + UI). Keep
it simple --- if you own it, you ship it.

  --------- ------------------ -------------------------------------------
  **Who**   **Role**           **Owns**

  **Dev A** Foundation + Data  Vite project setup, Dexie DB, exercise data
                               seeding, Zustand stores, repos

  **Dev B** Generator Engine   Split selector, daily routine generator,
                               volume balancer, weekly plan algorithm +
                               generator UI

  **Dev C** Workout Tracker    Active workout screen, set logger, rest
                               timer, weight recommender, logging flow

  **Dev D** UI + Analytics     App shell, shared components, progress
                               charts, PR detection, plan display cards
  --------- ------------------ -------------------------------------------

Reviews: keep it informal. Quick Slack/Discord review before merging, no
formal process needed.

Sprint Overview

4 sprints, 2 weeks each. Each sprint ends with something demoable.

  -------- ------------------ ---------------------------- ----------------
  **\#**   **Theme**          **Demo-able Result**         **Weeks**

  **1**    **Foundation +     App boots, DB loads 800+     1--2
           Types**            exercises, nav works         

  **2**    **Plan Generator** Pick days → get a full       3--4
                              weekly workout plan          

  **3**    **Workout          Start a plan day, log sets   5--6
           Logging**          with weight/reps/RPE         

  **4**    **Weight Recs +    See weight suggestions +     7--8
           Charts**           basic progress charts,       
                              deploy                       
  -------- ------------------ ---------------------------- ----------------

  -----------------------------------------------------------------------
  **Sprint 1: Foundation + Types (Weeks 1--2)**

  -----------------------------------------------------------------------

**Goal:** App boots with zero errors. 800+ exercises in the DB.
Navigation shell works. All shared types exist.

  ----------- --------------------------------------------- ---------------
  **Owner**   **Task**                                      **Est.**

  **Dev A**   Init Vite + React + TS + Tailwind project.    2 days
              Set up folder structure.                      

  **Dev A**   Dexie DB schema + seed script --- load 800+   4 days
              exercises with applicability scores on first  
              boot.                                         

  **Dev B**   All TypeScript types/interfaces: Exercise,    3 days
              WeeklyPlan, DailyWorkout, WorkoutSession,     
              splits, etc.                                  

  **Dev B**   Build split-templates.json (all 7 splits) and 3 days
              Zod schemas for plan constraints.             

  **Dev C**   Zustand stores (workout, weeklyPlan, user)    4 days
              with basic actions. Custom hooks for DB       
              queries.                                      

  **Dev C**   useWorkoutTimer hook with countdown logic.    2 days

  **Dev D**   App shell: routing (React Router), nav bar,   4 days
              responsive layout, basic page scaffolds.      

  **Dev D**   Shared UI components: buttons, cards, inputs, 3 days
              modals, loading spinner. Keep it simple.      
  ----------- --------------------------------------------- ---------------

**Unblocks:** Everything in Sprint 2 depends on types + DB being ready.

  -----------------------------------------------------------------------
  **Sprint 2: Plan Generator (Weeks 3--4)**

  -----------------------------------------------------------------------

**Goal:** User picks how many days they train → app generates a full
weekly plan with exercises, sets, reps.

  ----------- --------------------------------------------- ---------------
  **Owner**   **Task**                                      **Est.**

  **Dev B**   WeeklyPlanGenerator: select split by          3 days
              daysPerWeek, call DailyRoutineGenerator per   
              day, return WeeklyPlan.                       

  **Dev B**   DailyRoutineGenerator: filter exercises by    4 days
              equipment + muscles, score by applicability,  
              select top picks, configure sets/reps/rest,   
              order (compounds first).                      

  **Dev B**   Volume balancer: make sure no muscle group is 2 days
              totally neglected across the week.            

  **Dev A**   weeklyPlanRepo: save/load/delete plans. Wire  3 days
              to Zustand store.                             

  **Dev A**   Scheduling helper: suggest which day of the   2 days
              week each workout goes on.                    

  **Dev C**   Generator input UI: days-per-week picker,     4 days
              equipment checklist, training style toggle,   
              time slider.                                  

  **Dev C**   Constraint form: difficulty filter, exercise  2 days
              exclusions. Hook up to Zod + React Hook Form. 

  **Dev D**   WeeklyPlanDisplay: overview of all days with  5 days
              exercise cards showing name/sets/reps/rest.   

  **Dev D**   Weekly volume summary bar (simple Recharts    2 days
              bar showing sets by muscle group).            
  ----------- --------------------------------------------- ---------------

**Unblocks:** Sprint 3 needs real plans to exist so users can start
logging workouts against them.

  -----------------------------------------------------------------------
  **Sprint 3: Workout Logging (Weeks 5--6)**

  -----------------------------------------------------------------------

**Goal:** User starts a workout day from their plan and logs every set
with weight, reps, and RPE.

  ----------- --------------------------------------------- ---------------
  **Owner**   **Task**                                      **Est.**

  **Dev C**   ActiveWorkout screen: load today's plan day,  3 days
              show exercises in order, progress bar.        

  **Dev C**   SetLogger: weight input (+/-- buttons), reps  4 days
              input, RPE slider 1--10, complete/skip        
              buttons.                                      

  **Dev C**   RestTimer: configurable countdown between     2 days
              sets, audio beep when done, skip button.      

  **Dev A**   workoutRepo: save sessions linked to          3 days
              weeklyPlanId + dayNumber. Query by date       
              range.                                        

  **Dev A**   DaySelector: show which plan days are done    2 days
              this week vs. remaining.                      

  **Dev B**   Exercise swap: during workout, let user       3 days
              replace an exercise with an alternative for   
              same muscle/equipment.                        

  **Dev B**   Exercise library page: searchable list of all 3 days
              exercises, filter by muscle + equipment.      

  **Dev D**   Workout complete screen: summary with total   2 days
              volume, duration, sets done.                  

  **Dev D**   Mobile UX pass: big tap targets, reasonable   3 days
              font sizes, works on a phone screen.          
  ----------- --------------------------------------------- ---------------

**Unblocks:** Sprint 4 needs logged workout history to power weight recs
and charts.

  -----------------------------------------------------------------------
  **Sprint 4: Weight Recs + Charts + Ship (Weeks 7--8)**

  -----------------------------------------------------------------------

**Goal:** App suggests weights, shows progress charts, and gets deployed
to Vercel. MVP is live.

  ----------- --------------------------------------------- ---------------
  **Owner**   **Task**                                      **Est.**

  **Dev C**   weightRecommender: decision tree (RPE ≤ 7 →   5 days
              increase, completion \< 75% → decrease,       
              declining trend → deload, else maintain).     
              Show suggestion in SetLogger.                 

  **Dev C**   Trend analysis: compare recent vs. older      2 days
              sessions, detect improving/stable/declining.  

  **Dev D**   Progress line chart (Recharts): weight over   3 days
              time per exercise, with estimated 1RM line.   

  **Dev D**   Volume bar chart: weekly sets by muscle       2 days
              group. Simple, functional.                    

  **Dev D**   PR detection: check for weight/reps/volume    2 days
              PRs during logging, show a toast              
              notification.                                 

  **Dev B**   Weekly adherence: simple progress ring ---    2 days
              3/4 workouts done this week, etc.             

  **Dev B**   Data export as JSON (just a download button). 3 days
              Basic data import with validation.            

  **Dev A**   Settings page: units (lbs/kg), default rest   2 days
              timer, clear data option.                     

  **Dev A**   Deploy to Vercel. Make sure it works. Done.   2 days
  ----------- --------------------------------------------- ---------------

**Milestone:** App is live. Users can generate plans, log workouts, see
weight suggestions, and track progress.

What We're Intentionally Skipping

This is an MVP. The following are all real features but none of them are
needed to ship:

-   CI/CD pipelines

-   E2E test suites (Playwright/Cypress)

-   Accessibility audits

-   PWA / offline support / service workers

-   Onboarding flow

-   Dark mode

-   Data sync / cloud backup

-   Workout frequency heatmap

-   Muscle balance radar chart

-   Mesocycle / periodization planning

Any of these can be added later if the MVP gets traction. Don't
gold-plate.

Ground Rules

-   Ship working code, not perfect code. Refactor later if needed.

-   Use AI coding tools freely --- Cursor, Copilot, Claude, whatever
    makes you faster.

-   If you're blocked for more than 30 minutes, message the team.

-   Merge to main often. Small PRs. Don't sit on branches for days.

-   If a feature is taking way longer than estimated, cut scope and move
    on.

-   Manual testing is fine. Click through the app before you call
    something done.