import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Call Scheduler API" })
@info(#{ version: "1.0.0" })
namespace CallScheduler;

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

model EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: int32;
}

model EventTypeDraft {
  id: string;
  name: string;
  description: string;
  durationMinutes: int32;
}

model Slot {
  start: utcDateTime;
  end: utcDateTime;
}

model BookingDraft {
  eventTypeId: string;
  start: utcDateTime;
  guestName: string;
  guestEmail: string;
}

model Booking extends BookingDraft {
  id: string;
  end: utcDateTime;
}

model TimeRange {
  @doc("Start of the range, HH:MM (UTC).")
  start: string;

  @doc("End of the range, HH:MM (UTC).")
  end: string;
}

model WeeklyAvailability {
  mon?: TimeRange[];
  tue?: TimeRange[];
  wed?: TimeRange[];
  thu?: TimeRange[];
  fri?: TimeRange[];
  sat?: TimeRange[];
  sun?: TimeRange[];
}

model ApiErrorBody {
  code: string;
  message: string;
}

model ApiError {
  error: ApiErrorBody;
}

model Health {
  status: string;
  service: string;
}

// ---------------------------------------------------------------------------
// Responses with explicit status codes
// ---------------------------------------------------------------------------

model BadRequest {
  @statusCode statusCode: 400;
  @body body: ApiError;
}

model NotFound {
  @statusCode statusCode: 404;
  @body body: ApiError;
}

model Conflict {
  @statusCode statusCode: 409;
  @body body: ApiError;
}

model CreatedEventType {
  @statusCode statusCode: 201;
  @body body: EventType;
}

model CreatedBooking {
  @statusCode statusCode: 201;
  @body body: Booking;
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

@route("/api")
interface CallSchedulerApi {
  @get
  @route("/health")
  getHealth(): Health;

  @get
  @route("/event-types")
  listEventTypes(): EventType[];

  @post
  @route("/event-types")
  createEventType(@body body: EventTypeDraft): CreatedEventType | BadRequest | Conflict;

  @get
  @route("/availability")
  getAvailability(): WeeklyAvailability;

  @put
  @route("/availability")
  putAvailability(@body body: WeeklyAvailability): WeeklyAvailability | BadRequest;

  @get
  @route("/slots")
  listSlots(
    @query eventTypeId: string,
    @query from?: utcDateTime,
    @query to?: utcDateTime,
  ): Slot[] | BadRequest | NotFound;

  @get
  @route("/bookings")
  listBookings(): Booking[];

  @post
  @route("/bookings")
  createBooking(@body body: BookingDraft): CreatedBooking | BadRequest | NotFound | Conflict;
}
