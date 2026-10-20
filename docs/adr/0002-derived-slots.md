# Slots are derived, not stored

A Slot is computed on demand from the weekly Availability and an EventType's duration, minus any interval already taken by a Booking; it is never persisted. Only Availability, EventTypes, and Bookings are stored. Deriving slots means there are no stored slots to go stale, and the in-memory model stays small — the trade-off is that slot generation runs on every request.
