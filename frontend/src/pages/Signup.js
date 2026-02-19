import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
    const nav = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setMsg("");

        if (!name.trim() || !email.trim() || !password) {
            setError("Name, email, and password are required.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/register", {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
            });

            sessionStorage.setItem("verifyEmail", email.trim().toLowerCase());
            setMsg("Verification code sent. Check your email.");
            nav("/verify");
        } catch (err) {
            setError(err?.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-72px)] bg-emerald-50 px-6 py-10">
            <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
                <p className="mt-1 text-sm text-slate-600">Sign up and verify your email.</p>

                {msg && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {msg}
                    </div>
                )}
                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={submit} className="mt-5 space-y-3">
                    <div>
                        <label className="text-sm text-slate-600">Full name</label>
                        <input
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-600">Email</label>
                        <input
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-600">Password</label>
                        <input
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {loading ? "Creating…" : "Sign up"}
                    </button>
                </form>

                <p className="mt-4 text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link className="text-emerald-700 underline" to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
