
import { useState } from "react";

const ADMIN_API = "http://localhost:8080/api/admin";
const MEMBERSHIP_API = "http://localhost:8080/api/memberships";
const EVENTS_API = "http://localhost:8080/api/events";
const ANNOUNCEMENTS_API = "http://localhost:8080/api/announcements";

export default function Admin({ onBack }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [message, setMessage] = useState("");
  const [memberships, setMemberships] = useState([]);

  const [event, setEvent] = useState({
    clubId: "",
    name: "",
    description: "",
    eventDate: "",
    venue: "",
  });

  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
  });

  const inputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    margin: "8px 0 16px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    font: "inherit",
  };

  const buttonStyle = {
    padding: "10px 16px",
    margin: "4px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#20231f",
    color: "white",
  };

  const sectionStyle = {
    background: "white",
    padding: "24px",
    margin: "20px 0",
    borderRadius: "14px",
    border: "1px solid #e7e4da",
  };

  // Admin login
  async function login(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${ADMIN_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Admin login failed."
        );
      }

      if (!data.adminKey) {
        throw new Error("Admin key missing from login response.");
      }

      setAdminKey(data.adminKey);
      setIsAdmin(true);
      setPassword("");
      setMessage("Admin login successful!");

      await loadMemberships(data.adminKey);
    } catch (err) {
      setMessage(err.message || "Could not connect to backend.");
    }
  }

  // Load all membership requests using the admin key
  async function loadMemberships(key = adminKey) {
    try {
      const response = await fetch(MEMBERSHIP_API, {
        headers: { "X-Admin-Key": key },
      });

      if (!response.ok) {
        throw new Error("Could not load membership requests.");
      }

      setMemberships(await response.json());
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Approve or reject membership requests
  async function updateMembership(id, status) {
    try {
      const response = await fetch(`${MEMBERSHIP_API}/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Membership update failed."
        );
      }

      setMessage(`Membership ${status.toLowerCase()} successfully.`);
      await loadMemberships();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Create an event
  async function createEvent(e) {
    e.preventDefault();

    try {
      const response = await fetch(EVENTS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({
          ...event,
          clubId: Number(event.clubId),
          eventDate: event.eventDate
            ? `${event.eventDate}:00`
            : null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Could not create event."
        );
      }

      setMessage("Event created successfully!");
      setEvent({
        clubId: "",
        name: "",
        description: "",
        eventDate: "",
        venue: "",
      });
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Publish an announcement
  async function createAnnouncement(e) {
    e.preventDefault();

    try {
      const response = await fetch(ANNOUNCEMENTS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify(announcement),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Could not publish announcement."
        );
      }

      setMessage("Announcement published successfully!");
      setAnnouncement({ title: "", message: "" });
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Admin logout
  function logout() {
    setIsAdmin(false);
    setAdminKey("");
    setPassword("");
    setMessage("");
    setMemberships([]);
  }

  // Admin login screen
  if (!isAdmin) {
    return (
      <main style={{ maxWidth: 460, margin: "70px auto", padding: 24 }}>
        <button style={buttonStyle} onClick={onBack}>
          ← Back to website
        </button>

        <form onSubmit={login} style={sectionStyle}>
          <h1>Admin Login</h1>
          <p>Sign in to manage CampusConnect.</p>

          <label htmlFor="adminUsername">Username</label>
          <input
            id="adminUsername"
            style={inputStyle}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={buttonStyle} type="submit">
            Login as Admin
          </button>

          {message && <p role="status">{message}</p>}
        </form>
      </main>
    );
  }

  // Admin dashboard
  return (
    <main style={{ maxWidth: 1000, margin: "35px auto", padding: 24 }}>
      <button style={buttonStyle} onClick={onBack}>
        ← Back to website
      </button>

      <button style={buttonStyle} onClick={logout}>
        Admin Logout
      </button>

      <h1>CampusConnect Admin Dashboard</h1>
      <p>Manage student memberships, events and announcements.</p>

      {message && <p role="status">{message}</p>}

      <section style={sectionStyle}>
        <h2>Membership Requests</h2>

        <button
          style={buttonStyle}
          onClick={() => loadMemberships()}
        >
          Refresh Requests
        </button>

        {memberships.length === 0 ? (
          <p>No requests found.</p>
        ) : (
          memberships.map((m) => (
            <div
              key={m.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "12px 0",
              }}
            >
              <strong>Student ID: {m.studentId}</strong>
              {" · "}Club ID: {m.clubId}
              {" · "}Status: <strong>{m.status}</strong>

              {m.status === "PENDING" && (
                <div>
                  <button
                    style={buttonStyle}
                    onClick={() =>
                      updateMembership(m.id, "APPROVED")
                    }
                  >
                    Approve
                  </button>

                  <button
                    style={{ ...buttonStyle, background: "#8b3434" }}
                    onClick={() =>
                      updateMembership(m.id, "REJECTED")
                    }
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Add Event</h2>

        <form onSubmit={createEvent}>
          <label htmlFor="eventClubId">Club ID</label>
          <input
            id="eventClubId"
            style={inputStyle}
            type="number"
            min="1"
            required
            value={event.clubId}
            onChange={(e) =>
              setEvent({ ...event, clubId: e.target.value })
            }
          />

          <label htmlFor="eventName">Event name</label>
          <input
            id="eventName"
            style={inputStyle}
            required
            value={event.name}
            onChange={(e) =>
              setEvent({ ...event, name: e.target.value })
            }
          />

          <label htmlFor="eventDescription">Description</label>
          <textarea
            id="eventDescription"
            style={inputStyle}
            value={event.description}
            onChange={(e) =>
              setEvent({ ...event, description: e.target.value })
            }
          />

          <label htmlFor="eventDate">Date and time</label>
          <input
            id="eventDate"
            style={inputStyle}
            type="datetime-local"
            required
            value={event.eventDate}
            onChange={(e) =>
              setEvent({ ...event, eventDate: e.target.value })
            }
          />

          <label htmlFor="eventVenue">Venue</label>
          <input
            id="eventVenue"
            style={inputStyle}
            required
            value={event.venue}
            onChange={(e) =>
              setEvent({ ...event, venue: e.target.value })
            }
          />

          <button style={buttonStyle} type="submit">
            Create Event
          </button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2>Publish Announcement</h2>

        <form onSubmit={createAnnouncement}>
          <label htmlFor="announcementTitle">Title</label>
          <input
            id="announcementTitle"
            style={inputStyle}
            required
            value={announcement.title}
            onChange={(e) =>
              setAnnouncement({
                ...announcement,
                title: e.target.value,
              })
            }
          />

          <label htmlFor="announcementMessage">Message</label>
          <textarea
            id="announcementMessage"
            style={inputStyle}
            required
            value={announcement.message}
            onChange={(e) =>
              setAnnouncement({
                ...announcement,
                message: e.target.value,
              })
            }
          />

          <button style={buttonStyle} type="submit">
            Publish Announcement
          </button>
        </form>
      </section>
    </main>
  );
}
