# In-memory storage behind a Repository interface

We keep all state in process memory for the first increment, but reach it only through a narrow repository interface. This avoids a database and any external service for a teaching/MVP project, while leaving a seam to swap in SQLite or Postgres later without touching domain logic. The cost is that data does not survive a process restart.
