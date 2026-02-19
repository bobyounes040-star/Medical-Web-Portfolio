import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
    const { login } = useContext(AuthContext);
    const nav = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect"); // optional

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const goNext = () => {
        const next = redirect || localStorage.getItem("redirectAfterLogin") || "/";
        localStorage.removeItem("redirectAfterLogin");
        nav(next, { replace: true });
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Enter email and password.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/auth/login", {
                email: email.trim().toLowerCase(),
                password,
            });

            // res.data should be { token, user }
            login(res.data);
            goNext();
        } catch (err) {
            const msg = err?.response?.data?.message || "Login failed";

            // If backend tells you “verify first”
            if (err?.response?.status === 403 && err?.response?.data?.needsVerification) {
                sessionStorage.setItem("verifyEmail", email.trim().toLowerCase());
                nav("/verify");
                return;
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-72px)] bg-emerald-50 px-6 py-10">
            <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
                <p className="mt-1 text-sm text-slate-600">Welcome back.</p>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={submit} className="mt-5 space-y-3">
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
                        {loading ? "Logging in…" : "Login"}
                    </button>
                </form>

                <p className="mt-4 text-sm text-slate-600">
                    Don’t have an account?{" "}
                    <Link className="text-emerald-700 underline" to="/signup">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
