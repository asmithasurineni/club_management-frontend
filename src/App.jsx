import { useEffect, useState } from "react";
import "./App.css";
import Admin from "./Admin";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const API = `${API_BASE_URL}/api/clubs`;
const STUDENT_API = `${API_BASE_URL}/api/students`;
const MEMBERSHIP_API = `${API_BASE_URL}/api/memberships`;
const EVENTS_API = `${API_BASE_URL}/api/events`;
const ANNOUNCEMENTS_API = `${API_BASE_URL}/api/announcements`;

const clubDetails = [
  {
    match: "specdam",
    category: "CULTURAL",
    icon: "🎭",
    color: "art-0",
  },
  {
    match: "click cadets",
    category: "ARTS & MEDIA",
    icon: "📷",
    color: "art-1",
  },
  {
    match: "kriya",
    category: "EVENTS",
    icon: "📅",
    color: "art-2",
  },
  {
    match: "vlsi",
    category: "TECHNICAL",
    icon: "🔬",
    color: "art-3",
  },
  {
    match: "embedded systems",
    category: "TECHNICAL",
    icon: "🔌",
    color: "art-0",
  },
  {
    match: "coding",
    category: "TECHNICAL",
    icon: "💻",
    color: "art-1",
  },
  {
    match: "robotics",
    category: "TECHNICAL",
    icon: "🤖",
    color: "art-2",
  },
  {
    match: "ai & machine learning",
    category: "TECHNICAL",
    icon: "🧠",
    color: "art-3",
  },
  {
    match: "entrepreneurship",
    category: "PROFESSIONAL",
    icon: "💡",
    color: "art-0",
  },
  {
    match: "literary",
    category: "NON-TECHNICAL",
    icon: "📚",
    color: "art-1",
  },
  {
    match: "sports",
    category: "SPORTS",
    icon: "🏆",
    color: "art-2",
  },
  {
    match: "social service",
    category: "SOCIAL IMPACT",
    icon: "🤝",
    color: "art-3",
  },
];

function getClubDetails(club) {
  const name = (club.name || "").toLowerCase();

  return (
    clubDetails.find((item) => name.includes(item.match)) || {
      category: club.category || "CAMPUS CLUB",
      icon: "🌟",
      color: "art-0",
    }
  );
}

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  const [authMode, setAuthMode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [membershipMessage, setMembershipMessage] = useState("");
  const [joiningClubId, setJoiningClubId] = useState(null);
  const [myMemberships, setMyMemberships] = useState([]);

  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState("");

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsError, setAnnouncementsError] = useState("");

  // Load clubs
  useEffect(() => {
    fetch(API)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load clubs");
        }
        return response.json();
      })
      .then(setClubs)
      .catch(() => {
        setError(
          "Could not load clubs. Check whether Spring Boot is running."
        );
      });
  }, []);

  // Load events
  useEffect(() => {
    fetch(EVENTS_API)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load events");
        }
        return response.json();
      })
      .then(setEvents)
      .catch(() => {
        setEventsError("Could not load events.");
      });
  }, []);

  // Load announcements
  useEffect(() => {
    fetch(ANNOUNCEMENTS_API)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load announcements");
        }
        return response.json();
      })
      .then(setAnnouncements)
      .catch(() => {
        setAnnouncementsError("Could not load announcements.");
      });
  }, []);

  // Remove duplicate club names from the display.
  const uniqueClubs = [
    ...new Map(
      clubs.map((club) => [
        (club.name || "").trim().toLowerCase(),
        club,
      ])
    ).values(),
  ];

  // Search clubs by name or category.
  const filteredClubs = uniqueClubs.filter((club) =>
    `${club.name || ""} ${getClubDetails(club).category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthMessage("");
    setPassword("");
  }

  // Load the logged-in student's memberships.
  async function loadMemberships(studentId) {
    try {
      const response = await fetch(
        `${MEMBERSHIP_API}/student/${studentId}`
      );

      if (response.ok) {
        setMyMemberships(await response.json());
      }
    } catch {
      console.error("Could not load memberships.");
    }
  }

  // Student registration and login.
  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage("");

    if (authLoading) return;

    const isRegister = authMode === "register";

    if (!studentName.trim() || !rollNumber.trim() || !password) {
      setAuthMessage("Please fill in all the fields.");
      return;
    }

    if (password.length < 6) {
      setAuthMessage("Password must contain at least 6 characters.");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(
        `${STUDENT_API}/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: studentName.trim(),
            rollNumber: rollNumber.trim(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            (isRegister
              ? "Registration failed. Check your details."
              : "Login failed. Check your details.")
        );
      }

      if (isRegister) {
        setAuthMessage("Registration successful! Please log in.");
        setAuthMode("login");
        setPassword("");
      } else {
        if (!data.studentId) {
          throw new Error(
            "Student ID missing. Check StudentController.java."
          );
        }

        const student = {
          id: Number(data.studentId),
          name: data.name,
          rollNumber: data.rollNumber,
        };

        setLoggedIn(student);
        await loadMemberships(student.id);
        setAuthMode("");
        setPassword("");
      }
    } catch (err) {
      setAuthMessage(
        err.message || "Could not connect to the backend."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  // Student logout.
  function logout() {
    setLoggedIn(null);
    setStudentName("");
    setRollNumber("");
    setPassword("");
    setAuthMessage("");
    setMembershipMessage("");
    setMyMemberships([]);
  }

  // Join a club.
  async function discoverClub(club) {
    setMembershipMessage("");

    if (!loggedIn) {
      setAuthMessage(`Please log in to join ${club.name}.`);
      setAuthMode("login");
      return;
    }

    if (joiningClubId !== null) return;

    setJoiningClubId(club.id);

    try {
      const response = await fetch(`${MEMBERSHIP_API}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: loggedIn.id,
          clubId: club.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Membership request failed."
        );
      }

      setMembershipMessage(`${club.name}: ${data.message}`);
      await loadMemberships(loggedIn.id);
    } catch (err) {
      setMembershipMessage(
        err.message || "Could not submit the request."
      );
    } finally {
      setJoiningClubId(null);
    }
  }

  // Find the student's membership for a club.
  function getMembership(clubId) {
    return myMemberships.find(
      (membership) =>
        Number(membership.clubId) === Number(clubId)
    );
  }

  // Open the admin dashboard.
  if (showAdmin) {
    return <Admin onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">C</span>
          <span>
            Campus<span className="accent">Connect</span>
          </span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#clubs">Clubs</a>
          <a href="#events">Events</a>
          <a href="#announcements">Announcements</a>
        </nav>

        <div className="auth-nav">
          {loggedIn ? (
            <>
              <span className="welcome-user">
                Hi, {loggedIn.name}
              </span>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("login")}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => openAuth("register")}
              >
                Register
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowAdmin(true)}
          >
            Admin
          </button>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> YOUR CAMPUS, YOUR COMMUNITY
            </div>

            <h1>
              Find your people.
              <br />
              Discover your <span>passion.</span>
            </h1>

            <p>
              One campus. Countless possibilities. Explore student
              clubs, discover events, and find your place in college
              life.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#clubs">
                Explore clubs <span>↗</span>
              </a>

              <a className="text-button" href="#events">
                Discover events →
              </a>
            </div>

            <div className="hero-note">
              ✦ &nbsp; Learn something new. Make something memorable.
            </div>
          </div>

          <div className="hero-art">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />

            <div className="art-card art-card-one">
              <span>✦</span>
              <b>CREATE</b>
              <small>Make it yours</small>
            </div>

            <div className="art-card art-card-two">
              <span>♫</span>
              <b>CONNECT</b>
              <small>Find your people</small>
            </div>

            <div className="art-card art-card-three">
              <span>✺</span>
              <b>EXPLORE</b>
              <small>Try something new</small>
            </div>

            <div className="art-center">
              C<span>+</span>
            </div>

            <div className="floating-star">✳</div>
          </div>
        </section>

        {/* Statistics */}
        <section className="stats">
          <div>
            <strong>{uniqueClubs.length.toString().padStart(2, "0")}</strong>
            <span>Clubs available</span>
          </div>

          <div>
            <strong>∞</strong>
            <span>Ways to get involved</span>
          </div>

          <div>
            <strong>01</strong>
            <span>Campus community</span>
          </div>
        </section>

        {/* Clubs section */}
        <section className="section" id="clubs">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FIND YOUR COMMUNITY</div>
              <h2>
                Explore our clubs<span>.</span>
              </h2>
            </div>

            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clubs..."
                aria-label="Search clubs"
              />
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          {membershipMessage && (
            <p className="auth-message" role="status">
              {membershipMessage}
            </p>
          )}

          <div className="club-grid">
            {filteredClubs.map((club, index) => {
              const membership = getMembership(club.id);
              const details = getClubDetails(club);

              return (
                <article className="club-card" key={club.id}>
                  {/* Unique icon for each club */}
                  <div className={`club-art ${details.color}`}>
                    {club.imageUrl ? (
                      <img src={club.imageUrl} alt={club.name} />
                    ) : (
                      <span
                        className="club-logo"
                        role="img"
                        aria-label={club.name}
                      >
                        {details.icon}
                      </span>
                    )}

                    <span className="club-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="club-info">
                    <span className="category">
                      {details.category}
                    </span>

                    <h3>{club.name}</h3>

                    <p>
                      {club.description ||
                        "Discover new interests and meet people in your campus community."}
                    </p>

                    {membership && (
                      <p>
                        Membership status:{" "}
                        <strong>{membership.status}</strong>
                      </p>
                    )}

                    <button
                      type="button"
                      className="join-button"
                      disabled={joiningClubId !== null}
                      onClick={() => discoverClub(club)}
                    >
                      {joiningClubId === club.id
                        ? "Submitting..."
                        : membership
                          ? "Check membership"
                          : "Join Club"}

                      <span> ↗</span>
                    </button>
                  </div>
                </article>
              );
            })}

            {!error && filteredClubs.length === 0 && (
              <p className="empty">
                No clubs found. Try another search.
              </p>
            )}
          </div>
        </section>

        {/* Events section */}
        <section className="event-section" id="events">
          <div>
            <div className="eyebrow">SAVE THE DATE</div>
            <h2>
              Upcoming campus events<span>.</span>
            </h2>
            <p>Discover what's happening around campus.</p>
          </div>

          <div className="events-list">
            {eventsError ? (
              <p className="error">{eventsError}</p>
            ) : events.length > 0 ? (
              events.map((event) => (
                <article
                  className="event-placeholder"
                  key={event.id}
                >
                  <span className="event-icon">✳</span>

                  <div>
                    <b>{event.name}</b>

                    <p>
                      {event.description || "More details coming soon."}
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {event.eventDate
                        ? new Date(event.eventDate).toLocaleString()
                        : "To be announced"}
                    </p>

                    <p>
                      <strong>Venue:</strong>{" "}
                      {event.venue || "To be announced"}
                    </p>
                  </div>

                  <span className="event-arrow">↗</span>
                </article>
              ))
            ) : (
              <p>No events available yet.</p>
            )}
          </div>
        </section>

        {/* Announcements section */}
        <section className="announcement" id="announcements">
          <div>
            <div className="eyebrow">STAY IN THE LOOP</div>
            <h2>
              Campus announcements<span>.</span>
            </h2>
            <p>Important updates from your campus community.</p>
          </div>

          <div className="announcements-list">
            {announcementsError ? (
              <p className="error">{announcementsError}</p>
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => (
                <article
                  className="event-placeholder"
                  key={announcement.id}
                >
                  <span className="event-icon">✦</span>

                  <div>
                    <b>{announcement.title}</b>
                    <p>{announcement.message}</p>

                    <p>
                      <strong>Published:</strong>{" "}
                      {announcement.createdAt
                        ? new Date(
                            announcement.createdAt
                          ).toLocaleString()
                        : "Recently"}
                    </p>
                  </div>

                  <span className="event-arrow">↗</span>
                </article>
              ))
            ) : (
              <p>No announcements available yet.</p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <a className="brand" href="#home">
          <span className="brand-icon">C</span>
          <span>
            Campus<span className="accent">Connect</span>
          </span>
        </a>

        <span>Made for campus life ✦</span>
      </footer>

      {/* Student login and registration popup */}
      {authMode && (
        <div
          className="auth-overlay"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !authLoading
            ) {
              setAuthMode("");
              setAuthMessage("");
            }
          }}
        >
          <form className="auth-card" onSubmit={handleAuth}>
            <button
              type="button"
              className="auth-close"
              aria-label="Close form"
              disabled={authLoading}
              onClick={() => {
                setAuthMode("");
                setAuthMessage("");
              }}
            >
              ✕
            </button>

            <div className="eyebrow">CAMPUSCONNECT</div>

            <h2>
              {authMode === "register"
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p>
              {authMode === "register"
                ? "Join your campus community."
                : "Log in to explore your campus clubs."}
            </p>

            <label htmlFor="studentName">Student name</label>
            <input
              id="studentName"
              type="text"
              autoComplete="name"
              required
              value={studentName}
              onChange={(event) =>
                setStudentName(event.target.value)
              }
              placeholder="Enter your full name"
            />

            <label htmlFor="rollNumber">College roll number</label>
            <input
              id="rollNumber"
              type="text"
              autoComplete="username"
              required
              value={rollNumber}
              onChange={(event) =>
                setRollNumber(event.target.value)
              }
              placeholder="Enter your roll number"
            />

            <label htmlFor="studentPassword">Password</label>
            <input
              id="studentPassword"
              type="password"
              autoComplete={
                authMode === "register"
                  ? "new-password"
                  : "current-password"
              }
              minLength={6}
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 6 characters"
            />

            <button
              className="auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "register"
                  ? "Create account →"
                  : "Login →"}
            </button>

            {authMessage && (
              <p className="auth-message" role="status">
                {authMessage}
              </p>
            )}

            <p className="auth-switch">
              {authMode === "register"
                ? "Already registered?"
                : "New student?"}{" "}

              <button
                type="button"
                disabled={authLoading}
                onClick={() =>
                  openAuth(
                    authMode === "register" ? "login" : "register"
                  )
                }
              >
                {authMode === "register" ? "Login" : "Register"}
              </button>
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;