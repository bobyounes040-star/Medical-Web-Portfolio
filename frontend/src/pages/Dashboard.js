import { Link } from "react-router-dom";

function Icon({ children }) {
    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
            {children}
        </div>
    );
}

function Stat({ value, label }) {
    return (
        <div className="rounded-2xl bg-white/70 backdrop-blur p-4 ring-1 ring-emerald-100">
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-600">{label}</div>
        </div>
    );
}

function Feature({ icon, title, desc }) {
    return (
        <div className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start gap-4">
                <Icon>{icon}</Icon>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
            </div>
        </div>
    );
}

function Step({ n, title, desc }) {
    return (
        <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/60">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white font-semibold">
                    {n}
                </div>
                <h4 className="text-base font-semibold text-slate-900">{title}</h4>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>
        </div>
    );
}

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top gradient background */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-50" />
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
                <div className="absolute -top-10 -left-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />

                <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10">
                    {/* HERO */}
                    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm text-slate-700 ring-1 ring-emerald-100 backdrop-blur">
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                Modern appointments • Secure access • Real doctors
                            </div>

                            <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                                Smart Clinic
                                <span className="block text-emerald-700">care that feels effortless.</span>
                            </h1>

                            <p className="mt-4 text-lg leading-7 text-slate-600">
                                Find specialists, book in seconds, and manage appointments with a clean, secure system.
                            </p>

                            <div className="mt-8 grid grid-cols-3 gap-3">
                                <Stat value="24/7" label="Booking access" />
                                <Stat value="OTP" label="Secure sign-in" />
                                <Stat value="Fast" label="Slot matching" />
                            </div>
                        </div>

                        {/* Right card */}
                        <div className="rounded-3xl bg-white/70 backdrop-blur p-6 ring-1 ring-emerald-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Today’s highlight</p>
                                    <h3 className="mt-1 text-xl font-semibold text-slate-900">Book smarter, not harder</h3>
                                </div>
                                <div className="h-10 w-10 rounded-2xl bg-emerald-600/10 ring-1 ring-emerald-200 flex items-center justify-center">
                                    {/* Heart icon */}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-700">
                                        <path
                                            d="M12 21s-7-4.35-9.5-8.5C.8 9.6 2.3 6.5 5.7 6.1c1.8-.2 3.4.7 4.3 2 0 0 .9-1.4 3.1-2 3.1-.8 6.2 1.5 5.8 5.2C18.2 16.6 12 21 12 21z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60">
                                    <div className="text-sm text-slate-600">Easy workflow</div>
                                    <div className="mt-1 font-semibold text-slate-900">Choose doctor → pick slot → confirm</div>
                                </div>
                                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60">
                                    <div className="text-sm text-slate-600">Clear status</div>
                                    <div className="mt-1 font-semibold text-slate-900">Pending • Approved • Rejected</div>
                                </div>
                                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60">
                                    <div className="text-sm text-slate-600">Reliable scheduling</div>
                                    <div className="mt-1 font-semibold text-slate-900">Availability + slot checks built-in</div>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                                <div className="text-sm text-emerald-900 font-semibold">Tip</div>
                                <p className="mt-1 text-sm text-emerald-800">
                                    Upload doctor avatars and departments so the experience feels like a real clinic portal.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FEATURES */}
                    <div className="mt-14">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Designed like a real clinic system</h2>
                                <p className="mt-2 text-slate-600">
                                    Modern UI, secure access, and a smooth booking experience for patients and admins.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            <Feature
                                title="Fast appointment booking"
                                desc="Book available slots quickly with clean confirmation and status tracking."
                                icon={
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-emerald-700">
                                        <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        <path
                                            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        />
                                    </svg>
                                }
                            />
                            <Feature
                                title="Verified doctor profiles"
                                desc="Specialty/department, profile info, and optional avatars for trust."
                                icon={
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-emerald-700">
                                        <path
                                            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        />
                                        <path
                                            d="M20 21a8 8 0 0 0-16 0"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                }
                            />
                            <Feature
                                title="Secure OTP authentication"
                                desc="OTP-based sign-in to keep access safe and reduce account risk."
                                icon={
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-emerald-700">
                                        <path
                                            d="M17 11V7a5 5 0 0 0-10 0v4"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M7 11h10v10H7z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                }
                            />
                        </div>
                    </div>

                    {/* HOW IT WORKS */}
                    <div className="mt-14">
                        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
                        <p className="mt-2 text-slate-600">Simple flow that feels professional and modern.</p>

                        <div className="mt-6 grid gap-5 md:grid-cols-3">
                            <Step
                                n="1"
                                title="Browse doctors"
                                desc="View doctors, departments, and available booking slots."
                            />
                            <Step
                                n="2"
                                title="Book a slot"
                                desc="Choose your preferred time. The system checks availability and conflicts."
                            />
                            <Step
                                n="3"
                                title="Manage appointments"
                                desc="Track status updates and see details clearly in one place."
                            />
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-14 mb-10 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white shadow-sm">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-2xl font-bold">Ready to book your next appointment?</h3>
                                <p className="mt-2 text-white/90">
                                    Start by browsing doctors or login to confirm your booking.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link to="/doctors">
                                    <button className="rounded-2xl bg-white px-6 py-3 text-emerald-700 shadow-sm transition hover:bg-emerald-50">
                                        Browse Doctors
                                    </button>
                                </Link>
                                <Link to="/login">
                                    <button className="rounded-2xl bg-emerald-900/30 px-6 py-3 text-white ring-1 ring-white/30 transition hover:bg-emerald-900/40">
                                        Login
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
