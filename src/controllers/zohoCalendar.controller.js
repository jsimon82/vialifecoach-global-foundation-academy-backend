import { catchAsync } from "../utils/asyncHelpers.js";
import { createZohoEvent } from "../services/zohoCalendar.service.js";

export const createBookingZohoEvent = catchAsync(async (req, res) => {
  const {
    title,
    description,
    startDateTime,
    durationMinutes,
    timezone,
    location,
    meetingUrl,
    attendeeEmail,
    attendeeName,
  } = req.body || {};

  if (!title || !startDateTime) {
    return res.status(400).json({ message: "title and startDateTime are required" });
  }

  const attendees = attendeeEmail
    ? [
        {
          email: attendeeEmail,
          name: attendeeName || attendeeEmail,
          rsvp: "NEEDS-ACTION",
        },
      ]
    : [];

  try {
    const result = await createZohoEvent({
      title,
      description,
      startDateTime,
      durationMinutes: Number(durationMinutes) || 60,
      timezone,
      location,
      meetingUrl,
      attendees,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create Zoho event.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
