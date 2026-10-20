# Single timezone, no timezone logic

The service schedules calls for a single Host, so we treat time as living in one implicit timezone throughout: times are stored and shown as-is, with no UTC conversion and no per-User timezone handling. Supporting multiple timezones (Host zone vs Guest zone, DST) would add real complexity to slot generation and display for no MVP benefit. Revisit if Guests in other timezones must see correct local times.
