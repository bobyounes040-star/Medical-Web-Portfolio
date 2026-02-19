import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

// simple initials avatar (no extra libs)
function Avatar({ name }) {
    const initials = (name || "DR")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");

    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold">
            {initials}
        </div>
    );
}

export default function DoctorsDirectory() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [dept, setDept] = useState("all");

    const fetchDoctors = async () => {
        setError("");
        setLoading(true);
        try {
            const res = await api.get("/doctors");
            setDoctors(res.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load doctors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const departments = useMemo(() => {
        const set = new Set();
        doctors.forEach((d) => d.department && set.add(d.department));
        return ["all", ...Array.from(set)];
    }, [doctors]);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        return doctors.filter((d) => {
            const matchQ =
                !query ||
                d.fullName?.toLowerCase().includes(query) ||
                d.department?.toLowerCase().includes(query) ||
                d.bio?.toLowerCase().includes(query);

            const matchDept = dept === "all" || d.department === dept;
            return matchQ && matchDept;
        });
    }, [doctors, q, dept]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-semibold">Find a Doctor</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Search by name or specialty, then book an available slot.
                    </p>
                </div>

                <Link to="/appointments">
                    <button className="rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm hover:bg-emerald-50">
                        My Appointments
                    </button>
                </Link>
            </div>

            {/* Search + Filter */}
            <div className="grid gap-3 sm:grid-cols-3">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search: name / specialty / bio..."
                    className="sm:col-span-2 w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                />

                <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                >
                    {departments.map((d) => (
                        <option key={d} value={d}>
                            {d === "all" ? "All Departments" : d}
                        </option>
                    ))}
                </select>
            </div>

            {/* States */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading && (
                <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-slate-600">
                    Loading doctors...
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-slate-600">
                    No doctors match your search.
                </div>
            )}

            {/* Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((d) => (
                    <div
                        key={d.id}
                        className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm hover:shadow-md transition text-center"
                    >
                        {/* Avatar */}
                        {d.avatarUrl ? (
                            <img
                                src={d.avatarUrl}
                                alt={d.fullName}
                                className="mx-auto h-20 w-20 rounded-full object-cover "
                            />
                        ) : (
                            <Avatar name={d.fullName} />
                        )}


                        {/* Name */}
                        <p className="font-semibold text-slate-900">{d.fullName}</p>
                        <p className="text-sm text-slate-600">{d.department}</p>

                        {/* Experience */}
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 border border-emerald-100">
                            {d.yearsExperience || 0} Years Experience
                        </div>

                        {/* Book */}
                        <div className="mt-4">
                            <Link to={`/doctors/${d.id}`}>
                                <button className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                                    Book Now
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
