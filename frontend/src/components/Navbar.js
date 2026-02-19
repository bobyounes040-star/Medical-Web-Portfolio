import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="sticky top-0 z-50 border-b border-emerald-100 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
                <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                        +
                    </span>
                    <span className="tracking-wide">Smart Clinic</span>
                </Link>

                {user ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to="/dashboard"
                            className="rounded-xl border border-emerald-100 bg-white px-3 py-1.5 text-sm hover:bg-emerald-50"
                        >
                            Dashboard
                        </Link>

                        <Link
                            to="/appointments"
                            className="rounded-xl border border-emerald-100 bg-white px-3 py-1.5 text-sm hover:bg-emerald-50"
                        >
                            Appointments
                        </Link>

                        {user.role === "patient" && (
                            <Link
                                to="/doctors"
                                className="rounded-xl border border-emerald-100 bg-white px-3 py-1.5 text-sm hover:bg-emerald-50"
                            >
                                Book
                            </Link>
                        )}

                        {user.role === "admin" && (
                            <Link
                                to="/admin/doctors"
                                className="rounded-xl border border-emerald-100 bg-white px-3 py-1.5 text-sm hover:bg-emerald-50"
                            >
                                Manage Doctors
                            </Link>
                        )}

                        <span className="hidden sm:inline text-xs text-slate-500">
                            {user.email} • <span className="font-semibold">{user.role}</span>
                        </span>

                        <button
                            onClick={handleLogout}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-slate-500">Not logged in</div>
                )}
            </div>
        </div>
    );
}
