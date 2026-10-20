# Single timezone, no timezone logic

The service schedules calls for a single Host, so we treat time as living in one implicit timezone throughout. There is no per-User timezone handling and no Host-zone-vs-Guest-zone conversion.

Concretely, the implicit zone is UTC. Availability is given as wall-clock `HH:MM` ranges per weekday, and those ranges are placed on each calendar day using UTC (for example Monday 09:00–17:00 means 09:00–17:00 UTC on each Monday). Slots and Bookings are exchanged as ISO-8601 UTC instants and shown as-is: the client slices the date (`start.slice(0, 10)`) and the time (`start.slice(11, 16)`) straight out of the ISO string rather than converting to the browser's local zone. "No timezone logic" therefore means we never translate between zones — not that we avoid UTC; picking UTC as the single zone is what makes the derivation deterministic.

Supporting multiple timezones (Host zone vs Guest zone, DST) would add real complexity to slot generation and display for no MVP benefit. Revisit if Guests in other timezones must see correct local times.
