import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const DAY_OPTIONS = [
    { label: "Mon", val: 1 },
    { label: "Tue", val: 2 },
    { label: "Wed", val: 3 },
    { label: "Thu", val: 4 },
    { label: "Fri", val: 5 },
    { label: "Sat", val: 6 },
    { label: "Sun", val: 0 }, 
];

function dayLabel(dayVal) {
    const found = DAY_OPTIONS.find((d) => d.val === dayVal);
    return found ? found.label : String(dayVal);
}

export default function AdminDoctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    // form fields
    const [editingId, setEditingId] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [department, setDepartment] = useState("");
    const [bio, setBio] = useState("");
    const [yearsExperience, setYearsExperience] = useState(0);

    // schedule blocks: [{days:[1,2], start:"08:00", end:"16:00"}]
    const [blocks, setBlocks] = useState([{ days: [], start: "", end: "" }]);

    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const resetForm = () => {
        setEditingId(null);
        setEmail("");
        setPassword("");
        setFullName("");
        setDepartment("");
        setBio("");
        setYearsExperience(0);
        setBlocks([{ days: [], start: "", end: "" }]);
    };

    const fetchDoctors = async () => {
        setError("");
        setMsg("");
        setLoading(true);
        try {
            const res = await api.get("/doctors");
            setDoctors(res.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to load doctors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    // ----- schedule helpers -----
    const addBlock = () => setBlocks((prev) => [...prev, { days: [], start: "", end: "" }]);

    const removeBlock = (idx) => setBlocks((prev) => prev.filter((_, i) => i !== idx));

    const updateBlock = (idx, key, value) => {
        setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, [key]: value } : b)));
    };

    const toggleDayInBlock = (idx, dayVal) => {
        setBlocks((prev) =>
            prev.map((b, i) => {
                if (i !== idx) return b;
                const has = b.days.includes(dayVal);
                return { ...b, days: has ? b.days.filter((d) => d !== dayVal) : [...b.days, dayVal] };
            })
        );
    };

    // Convert blocks => backend availability [{day, ranges:[{start,end}]}]
    const availabilityFromBlocks = useMemo(() => {
        const map = new Map(); // day -> ranges[]
        for (const b of blocks) {
            if (!b.days?.length) continue;
            if (!b.start || !b.end) continue;

            for (const day of b.days) {
                if (!map.has(day)) map.set(day, []);
                map.get(day).push({ start: b.start, end: b.end });
            }
        }
        return Array.from(map.entries()).map(([day, ranges]) => ({ day, ranges }));
    }, [blocks]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMsg("");

        if (!email.trim() || !fullName.trim() || !department.trim()) {
            setError("Email, full name, and department are required.");
            return;
        }

        if (availabilityFromBlocks.length === 0) {
            setError("Add at least one schedule block (days + start/end).");
            return;
        }

        const payload = {
            email: email.trim().toLowerCase(),
            password: password.trim().toLowerCase(),
            fullName: fullName.trim(),
            department: department.trim(),
            bio: bio.trim(),
            yearsExperience: Number(yearsExperience) || 0,
            availability: availabilityFromBlocks,
        };

        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/doctors/${editingId}`, payload);
                setMsg("Doctor updated.");
            } else {
                await api.post("/doctors", payload);
                setMsg("Doctor created.");
            }
            resetForm();
            fetchDoctors();
        } catch (err) {
            setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to save doctor.");
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (d) => {
        setMsg("");
        setError("");
        setEditingId(d.id);
        setEmail(d.email || "");
        setPassword(d.password || "");
        setFullName(d.fullName || "");
        setDepartment(d.department || "");
        setBio(d.bio || "");
        setYearsExperience(d.yearsExperience || 0);

        // convert backend availability -> blocks (approx)
        // We create one block per day group based on first range sets (simple)
        const av = Array.isArray(d.availability) ? d.availability : [];
        if (!av.length) {
            setBlocks([{ days: [], start: "", end: "" }]);
            return;
        }

        // simple approach: one block per day using its first range
        const newBlocks = av.map((a) => ({
            days: [a.day],
            start: a.ranges?.[0]?.start || "",
            end: a.ranges?.[0]?.end || "",
        }));

        setBlocks(newBlocks.length ? newBlocks : [{ days: [], start: "", end: "" }]);
    };

    const removeDoctor = async (doctorId) => {
        setMsg("");
        setError("");
        try {
            await api.delete(`/doctors/${doctorId}`);
            setMsg("Doctor removed.");
            fetchDoctors();
        } catch (err) {
            setError(err?.response?.data?.message || err?.response?.data?.error || "Remove failed.");
        }
    };

    const uploadAvatar = async (doctorId, file) => {
        setMsg("");
        setError("");
        if (!file) return;

        try {
            const form = new FormData();
            form.append("avatar", file);

            await api.patch(`/doctors/${doctorId}/avatar`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMsg("Avatar uploaded.");
            fetchDoctors();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error || 
                "Upload failed (server error). Check backend console."
            );
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-semibold text-slate-900">Manage Doctors</h1>
                    <p className="mt-1 text-sm text-slate-600">Admin panel to create, edit, remove doctors, and manage schedules.</p>
                </div>

                <Link to="/dashboard">
                    <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        Back
                    </button>
                </Link>
            </div>

            {/* Alerts */}
            {msg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {msg}
                </div>
            )}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingId ? "Edit Doctor" : "Create Doctor"}
                        </h2>
                        <p className="text-sm text-slate-600">
                            Tip: You can create the profile even if the doctor didn’t login yet. Role assignment happens when a User exists.
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            Cancel edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="doctor@example.com"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-slate-700">Passowrd</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Dr. Ahmad Ali"
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Department</label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="Cardiology"
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Bio (optional)</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Short description..."
                            rows={3}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Years Experience</label>
                        <input
                            type="number"
                            min="0"
                            value={yearsExperience}
                            onChange={(e) => setYearsExperience(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                    </div>

                    {/* Schedule Blocks */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Weekly Schedule</p>
                                <p className="text-xs text-slate-600">Add multiple blocks: Mon–Tue 08:00–16:00, Wed–Thu 14:00–22:00, etc.</p>
                            </div>

                            <button
                                type="button"
                                onClick={addBlock}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                + Add block
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {blocks.map((b, idx) => (
                                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {DAY_OPTIONS.map((d) => (
                                            <button
                                                type="button"
                                                key={d.val}
                                                onClick={() => toggleDayInBlock(idx, d.val)}
                                                className={`rounded-lg border px-3 py-2 text-sm ${b.days.includes(d.val)
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-600">Start</label>
                                            <input
                                                type="time"
                                                value={b.start}
                                                onChange={(e) => updateBlock(idx, "start", e.target.value)}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-600">End</label>
                                            <input
                                                type="time"
                                                value={b.end}
                                                onChange={(e) => updateBlock(idx, "end", e.target.value)}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                                            />
                                        </div>
                                    </div>

                                    {blocks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeBlock(idx)}
                                            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                        >
                                            Remove block
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {submitting ? "Saving..." : editingId ? "Update Doctor" : "Create Doctor"}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Doctors List</h2>
                    <button
                        onClick={fetchDoctors}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Refresh
                    </button>
                </div>

                {loading && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                        Loading...
                    </div>
                )}

                {!loading && doctors.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                        No doctors yet.
                    </div>
                )}

                <div className="grid gap-3">
                    {doctors.map((d) => (
                        <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                                        {d.avatarUrl ? (
                                            <img src={d.avatarUrl} alt={d.fullName} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                                                No photo
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-base font-semibold text-slate-900">{d.fullName}</p>
                                        <p className="text-sm text-slate-600">{d.department}</p>
                                        <p className="text-xs text-slate-500">{d.email}</p>
                                        <p className="text-xs text-slate-500">{d.yearsExperience || 0} years experience</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(d)}
                                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeDoctor(d.id)}
                                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {/* Availability Preview */}
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">Schedule</p>

                                {Array.isArray(d.availability) && d.availability.length > 0 ? (
                                    <div className="mt-2 space-y-2 text-sm text-slate-700">
                                        {d.availability
                                            .slice()
                                            .sort((a, b) => a.day - b.day)
                                            .map((a, i) => (
                                                <div key={i} className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                                                        {dayLabel(a.day)}
                                                    </span>
                                                    <span className="text-xs text-slate-600">
                                                        {(a.ranges || [])
                                                            .map((r) => `${r.start}–${r.end}`)
                                                            .join(" , ")}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-600">No schedule set.</p>
                                )}
                            </div>

                            {/* Avatar upload */}
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <label className="text-sm font-medium text-slate-700">Upload photo:</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => uploadAvatar(d.id, e.target.files?.[0])}
                                    className="text-sm"
                                />
                                <p className="text-xs text-slate-500">
                                    If upload fails, backend Cloudinary config is the issue (500).
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
