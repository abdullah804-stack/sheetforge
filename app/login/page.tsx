"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    router.push(redirect);
  }

  return (
    <main className="min-h-screen flex bg-white">
      {/* FORM */}
      <section className="flex w-full md:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="md:hidden mb-10">
            <Logo />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="text-sm text-gray-600 mt-1.5">
            Start turning spreadsheets into apps.
          </p>

          <form
            method="post"
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
          >
            <Input
              label="Name"
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div
                role="alert"
                className="bg-red-50 text-red-600 p-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* BRAND PANEL */}
      <BrandPanel />
    </main>
  );
}

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold leading-none ${
          inverted ? "bg-white text-black" : "bg-black text-white"
        }`}
        aria-hidden="true"
      >
        S
      </span>
      <span
        className={`font-semibold text-lg tracking-tight ${
          inverted ? "text-white" : "text-gray-900"
        }`}
      >
        SheetForge
      </span>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside
      className="relative hidden md:flex md:w-1/2 flex-col bg-black p-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Dot texture */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern
            id="brand-dots"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#brand-dots)" opacity="0.07" />
      </svg>

      <div className="relative">
        <Logo inverted />
      </div>

      <div
        className="relative flex-1 flex flex-col items-center justify-center animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <h2 className="text-4xl font-semibold tracking-tight leading-tight text-white text-center max-w-md">
          See your spreadsheet clearly.
        </h2>

        {/* Mini app preview */}
        <div className="mt-10 w-full max-w-xs bg-white rounded-lg shadow-lg overflow-hidden text-left">
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <span className="ml-2 text-xs text-gray-500">
              Inventory — SheetForge
            </span>
          </div>
          <div className="p-3">
            <div className="border-l-2 border-black pl-2 mb-3">
              <p className="text-[10px] font-semibold text-gray-700 mb-0.5">
                Summary
              </p>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                24 products across 6 categories. Stock ranges from 4 to 84.
              </p>
            </div>
            <div className="flex items-end gap-1 h-10 mb-2">
              <div className="flex-1 bg-black rounded-t" style={{ height: "80%" }}></div>
              <div className="flex-1 bg-black rounded-t" style={{ height: "45%" }}></div>
              <div className="flex-1 bg-black rounded-t" style={{ height: "65%" }}></div>
              <div className="flex-1 bg-black rounded-t" style={{ height: "30%" }}></div>
              <div className="flex-1 bg-black rounded-t" style={{ height: "90%" }}></div>
              <div className="flex-1 bg-black rounded-t" style={{ height: "55%" }}></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] py-1 border-b border-gray-100">
                <span>Wireless Mouse</span>
                <span className="text-green-600">84</span>
              </div>
              <div className="flex justify-between text-[11px] py-1 border-b border-gray-100">
                <span>Keyboard</span>
                <span className="text-yellow-600">14</span>
              </div>
              <div className="flex justify-between text-[11px] py-1">
                <span>USB-C Hub</span>
                <span className="text-red-600">7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}