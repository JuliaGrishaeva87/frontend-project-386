# Call Calendar

A call-scheduling service (a simplified Cal.com): a single Host publishes bookable call slots and Guests book them. It exists so people can grab a free time without back-and-forth messaging.

## Language

**Host**:
The single owner of the calendar; their weekly Availability and EventTypes determine what can be booked. There is exactly one Host, and no authentication identifies them.
_Avoid_: Owner, organizer, user, account

**Guest**:
A person who books a call from the public page without an account, identified only by the name and email they provide.
_Avoid_: Client, customer, visitor, user

**EventType**:
A bookable meeting template the Host defines: a slug `id` the Host chooses, a name, a description and a fixed duration (for example "Intro call", 15 minutes). Every Booking references exactly one EventType.
_Avoid_: Meeting type, appointment type, event, call type

**Availability**:
The Host's weekly recurring windows, given as time ranges per weekday, from which bookable Slots are derived.
_Avoid_: Schedule, working hours, calendar, opening hours

**Slot**:
A concrete bookable time interval, derived from Availability and an EventType's duration, excluding any interval already taken by a Booking.
_Avoid_: Free time, opening, availability window

**Booking**:
A confirmed reservation of one Slot by a Guest for an EventType, recording the Guest's name and email.
_Avoid_: Appointment, reservation, meeting, event
