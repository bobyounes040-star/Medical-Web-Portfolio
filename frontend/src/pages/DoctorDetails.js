import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const dayLabels = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun",
  7: "Sun",
};

function formatAvailability(av) {
  if (!Array.isArray(av) || av.length === 0) return "Not set";

  const nice = av
    .slice()
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
    .map((a) => {
      const day = dayLabels[a.day] ?? a.day;
      return `${day}`;
    })
    .join(" - ");

  return `${nice} `;
}


function Avatar({ name }) {
  const initials = (name || "D")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");
  return (
    <div className="h-28 w-28 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-3xl">
      {initials}
    </div>
  );
}

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  const [date, setDate] = useState(() => {
    // default to today in YYYY-MM-DD
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);

  const availabilityText = useMemo(
    () => formatAvailability(doctor?.availability, doctor?.slotMinutes || 30),
    [doctor]
  );


  // 1) fetch doctor
  useEffect(() => {
    let mounted = true;
    setError("");
    setMsg("");
    setLoadingDoctor(true);

    api
      .get(`/doctors/${id}`)
      .then((res) => {
        if (!mounted) return;
        setDoctor(res.data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Failed to load doctor");
      })
      .finally(() => mounted && setLoadingDoctor(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  // 2) fetch slots for selected date
  const fetchSlots = async (pickedDate) => {
    setError("");
    setMsg("");
    setLoadingSlots(true);
    setSelectedSlot("");
    try {
      const res = await api.get(`/doctors/${id}/slots`, {
        params: { date: pickedDate },
      });
      setSlots(res.data?.slots || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load slots");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchSlots(date);
    // eslint-disable-next-line
  }, [id, date]);

  // 3) book selected slot
  const book = async () => {
    setError("");
    setMsg("");

    // Require login to book
    const token = localStorage.getItem("token");
    if (!token) {
      // redirect back after login
      localStorage.setItem("redirectAfterLogin", `/doctors/${id}`);
      navigate("/login");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }

    setBooking(true);
    try {
      const iso = new Date(selectedSlot).toISOString();

      await api.post("/appointments", {
        doctorId: id,
        date: iso,
      });

      setMsg("Appointment booked (pending).");
      // refresh slots to remove booked slot
      fetchSlots(date);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  if (loadingDoctor) {
    return <div className="p-6 text-slate-700">Loading doctor…</div>;
  }

  if (!doctor) {
    return (
      <div className="p-6">
        <p className="text-red-600">Doctor not found.</p>
        <Link to="/doctors" className="text-emerald-700 underline">
          Back to doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">

        <div className="flex items-center justify-between">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm hover:bg-emerald-50"
          >
            ← Back
          </Link>

          <div className="text-xs text-slate-500">
            {user ? `Logged in as ${user.email}` : "Browse doctors (login to book)"}
          </div>
        </div>

        {/* Doctor profile card */}
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {doctor.avatarUrl ? (
              <img
                src={doctor.avatarUrl}
                alt={doctor.fullName}
                className="h-28 w-28 rounded-full object-cover ring-4 ring-emerald-100"
              />
            ) : (
              <Avatar name={doctor.fullName} />
            )}


            <div className="flex-1 space-y-2 text-center md:text-left">
              <h1 className="text-2xl font-semibold text-slate-900">
                {doctor.fullName}
              </h1>

              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                {doctor.department}
              </span>

              <div className="grid gap-2 sm:grid-cols-2 mt-4 text-sm text-slate-700">
                <div className="rounded-xl border border-emerald-100 px-3 py-2">
                  <b>Experience:</b> {doctor.yearsExperience || 0} years
                </div>
                <div className="rounded-xl border border-emerald-100 px-3 py-2">
                  <b>Availability:</b>
                  <div className="text-slate-600 mt-1">{availabilityText}</div>
                </div>
              </div>

              {doctor.bio && (
                <div className="pt-3">
                  <p className="text-sm text-slate-600">{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking section */}
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Book Your Appointment
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Date */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-slate-900">Select Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-3 w-full rounded-xl border border-emerald-100 bg-white px-4 py-3"
              />

              <p className="mt-3 text-xs text-slate-500">
                Slots are generated from doctor working days/hours and filtered
                by already-booked appointments.
              </p>
            </div>

            {/* Slots */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  Available Time Slots
                </p>
                {loadingSlots && (
                  <span className="text-xs text-slate-500">Loading…</span>
                )}
              </div>

              {!loadingSlots && slots.length === 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  No slots available for this date.
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`rounded-xl border px-3 py-2 text-sm transition
                      ${selectedSlot === s
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-slate-800"
                      }`}
                  >
                    {new Date(s).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>

              <button
                onClick={book}
                disabled={booking || loadingSlots}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {booking ? "Booking…" : "Book Now"}
              </button>

              {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
