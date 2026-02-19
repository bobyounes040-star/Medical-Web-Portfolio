import { useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function formatDateTime(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

// Converts either a string OR an object into safe display strings
function getPersonDisplay(person) {
  if (!person) return { name: "Unknown", email: "", department: "" };

  // backend might return a string (email or id)
  if (typeof person === "string") {
    const isEmail = person.includes("@");
    return {
      name: isEmail ? "Unknown" : person,
      email: isEmail ? person : "",
      avatarUrl: "",
      department: "",
    };
  }

  const name = person.fullName || person.name || "Unknown";
  const email = person.email || "";
  const department = person.department;
  const avatarUrl = person.avatarUrl
  return { name, email, department, avatarUrl };
}

export default function Appointments() {
  const { user } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDateTime, setNewDateTime] = useState("");

  const fetchAppointments = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, []);

  const updateStatus = async (id, status) => {
    setError("");
    setMsg("");
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setMsg(`Appointment ${status}.`);
      fetchAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    }
  };

  const cancelAppointment = async (id) => {
    setError("");
    setMsg("");
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setMsg("Appointment cancelled.");
      fetchAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const reschedule = async () => {
    setError("");
    setMsg("");

    if (!rescheduleId) return;
    if (!newDateTime) {
      setError("Pick a new date/time");
      return;
    }

    try {
      const iso = new Date(newDateTime).toISOString();
      await api.patch(`/appointments/${rescheduleId}/reschedule`, { date: iso });
      setMsg("Appointment rescheduled.");
      setRescheduleId(null);
      setNewDateTime("");
      fetchAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reschedule");
    }
  };

  const role = user?.role || "guest";

  const statusBadge = (status) => {
    const base = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium";
    if (status === "approved") return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    if (status === "rejected") return `${base} border-rose-200 bg-rose-50 text-rose-700`;
    if (status === "cancelled") return `${base} border-slate-200 bg-slate-50 text-slate-700`;
    return `${base} border-amber-200 bg-amber-50 text-amber-700`; // pending
  };

  // Optional: sort upcoming first
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [appointments]);

  // If you accidentally render this page while logged out:
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
          <p className="mt-2 text-slate-600">Please log in to view your appointments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Appointments</h1>
          <p className="mt-1 text-sm text-slate-600">
            View and manage your appointments.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Reschedule box */}
      {rescheduleId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Reschedule Appointment</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pick a new date and time (30-min slots).
              </p>
            </div>
            <button
              onClick={() => {
                setRescheduleId(null);
                setNewDateTime("");
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />

            <div className="flex gap-2">
              <button
                onClick={reschedule}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setRescheduleId(null);
                  setNewDateTime("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading / Empty */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Loading...
        </div>
      )}

      {!loading && sortedAppointments.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No appointments found.
        </div>
      )}

      {/* List */}
      <div className="grid gap-3">
        {sortedAppointments.map((a) => {
          const doctor = getPersonDisplay(a.doctor);
          const patient = getPersonDisplay(a.patient);

          const canPatientCancel = role === "patient" && ["pending", "approved"].includes(a.status);
          const canPatientReschedule = role === "patient" && a.status === "pending";

          const canDoctorApproveReject = role === "doctor" && a.status === "pending";
          const canDoctorCancel = role === "doctor" && a.status === "approved";

          return (
            <div
              key={a._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">

                    {(role === "patient" || role === "admin") && (
                      <img
                        src={doctor.avatarUrl}
                        alt={""}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm text-slate-500">Date:</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(a.date)}
                    </span>
                  </div>

                  {role === "patient" && (
                    <>
                      <div className="text-sm text-slate-600">
                        Doctor:{" "}
                        <span className="font-medium text-slate-900"> {doctor.name} </span>
                      </div>

                      <div className="text-sm text-slate-600">
                        Doctor Department:{" "}
                        <span className="font-medium text-slate-900"> {doctor.department} </span>
                      </div>

                      <div className="text-sm text-slate-600">
                        Email:{" "}
                        <span className="font-medium text-slate-900"> {doctor.email} </span>
                      </div>
                    </>
                  )}

                  {role === "doctor" && (
                    <div className="text-sm text-slate-600">
                      <div>
                        Patient:{" "}
                        <span className="font-medium text-slate-900">{patient.name}</span>
                      </div>
                      <div>
                        Email:{""}
                        <span className="font-medium text-slate-900"> {patient.email}</span>
                      </div>
                    </div>

                  )}

                  {role === "admin" && (
                    <div className="text-sm text-slate-600 space-y-1">
                      <div>
                        Doctor:{" "}
                        <span className="font-medium text-slate-900">{doctor.name}</span>
                      </div>

                      <div>
                        Doctor Department:{""}
                        <span className="font-medium text-slate-900"> {doctor.department}</span>
                      </div>

                      <div>
                        Email:{""}
                        <span className="font-medium text-slate-900"> {doctor.email}</span>
                      </div>

                      <div>
                        Patient:{" "}
                        <span className="font-medium text-slate-900">{patient.name}</span>
                      </div>

                      <div>
                        Email:{""}
                        <span className="font-medium text-slate-900"> {patient.email}</span>
                      </div>

                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">Status:</span>
                    <span className={statusBadge(a.status)}>{a.status}</span>
                  </div>

                  {/* Patient actions */}
                  {(canPatientReschedule || canPatientCancel) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canPatientReschedule && (
                        <button
                          onClick={() => {
                            setRescheduleId(a._id);
                            setNewDateTime("");
                          }}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Reschedule
                        </button>
                      )}

                      {canPatientCancel && (
                        <button
                          onClick={() => cancelAppointment(a._id)}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Doctor actions */}
                {canDoctorApproveReject && (
                  <div className="flex gap-2 sm:flex-col sm:min-w-[160px]">
                    <button
                      onClick={() => updateStatus(a._id, "approved")}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(a._id, "rejected")}
                      className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Doctor cancel after approving */}
                {canDoctorCancel && (
                  <div className="sm:min-w-[160px]">
                    <button
                      onClick={() => cancelAppointment(a._id)}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Cancel (Doctor)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
