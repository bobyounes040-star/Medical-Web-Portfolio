import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Verify() {
    const { login } = useContext(AuthContext);
    const nav = useNavigate();

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");

    const email = sessionStorage.getItem("verifyEmail") || "";

    const goNext = () => {
        const next = localStorage.getItem("redirectAfterLogin") || "/";
        localStorage.removeItem("redirectAfterLogin");
        nav(next, { replace: true });
    };

    const verify = async (e) => {
        e.preventDefault();
        setError("");
        setMsg("");

        const cleanCode = code.trim();

        if (!email) {
            setError("Missing email. Go back to signup/login.");
            return;
        }
        if (!/^\d{6}$/.test(cleanCode)) {
            setError("Enter the 6-digit code.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/auth/verify-email", {
                email,
                code: cleanCode,
            });

            // res.data should be { token, user }
            login(res.data);

            sessionStorage.removeItem("verifyEmail");
            setMsg("Verified successfully.");
            goNext();
        } catch (err) {
            setError(err?.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        setError("");
        setMsg("");

        if (!email) {
            setError("Missing email. Go back to signup/login.");
            return;
        }

        setResending(true);
        try {
            await api.post("/auth/resend-verification", { email });
            setMsg("New code sent.");
        } catch (err) {
            setError(err?.response?.data?.message || "Resend failed");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-72px)] bg-emerald-50 px-6 py-10">
            <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Verify email</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Enter the 6-digit code sent to <b>{email || "your email"}</b>.
                </p>

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

                <form onSubmit={verify} className="mt-5 space-y-3">
                    <div>
                        <label className="text-sm text-slate-600">Verification code</label>
                        <input
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            inputMode="numeric"
                            placeholder="123456"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {loading ? "Verifying…" : "Verify"}
                    </button>
                </form>

                <button
                    onClick={resend}
                    disabled={resending}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                    {resending ? "Sending…" : "Resend code"}
                </button>
            </div>
        </div>
    );
}
