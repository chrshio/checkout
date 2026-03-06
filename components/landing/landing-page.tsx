"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GATE_STORAGE_KEY } from "@/lib/gate";
import { LANDING_TEXT_COLOR } from "@/lib/contrast-from-background";

export function LandingPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const expected =
      process.env.NEXT_PUBLIC_GATE_PASSWORD ?? "pasta";
    if (password === expected) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(GATE_STORAGE_KEY, "true");
      }
      router.push("/prototypes");
      return;
    }
    if (password.trim().length > 0) {
      setError("Incorrect password");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Three ovals: heights as % of viewport; 80% width with side padding */}
      <div className="absolute inset-y-0 left-[10%] right-[10%]">
        {/* First oval: 30vh */}
        <div
          className="absolute left-0 right-0 top-0 z-[3] h-[30vh] w-full"
          style={{
            background:
              "linear-gradient(to bottom, #04DCFF 0%, #475ACB 70%, #475ACB 100%)",
            borderRadius: "50%",
            filter: "blur(40px)",
            transform: "scaleX(1.2)",
          }}
        />
        {/* Second oval: 50vh (starts below first) */}
        <div
          className="absolute left-0 right-0 top-[30vh] z-[2] h-[50vh] w-full"
          style={{
            background: "#FFF991",
            borderRadius: "50%",
            filter: "blur(35px)",
            transform: "scaleX(1.2)",
          }}
        />
        {/* Third oval: 28vh, solid #EADFD9, behind second */}
        <div
          className="absolute left-0 right-0 top-[72vh] z-[1] h-[28vh] w-full"
          style={{
            background: "#EADFD9",
            borderRadius: "50%",
            filter: "blur(45px)",
            transform: "scaleX(1.2)",
          }}
        />
      </div>

      {/* Glass overlay (Figma: backdrop-blur 34.35px, bg white 10%) */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backdropFilter: "blur(34px)",
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />

      {/* Form on top so it’s visible and tappable */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center px-6 pt-[calc(30vh-3rem)] text-center"
        style={{ color: "rgba(10, 10, 10, 0)" }}
      >
        <div className="w-full max-w-md">
          <div className="opacity-60" style={{ color: LANDING_TEXT_COLOR }}>
            <p
              className="mb-5 text-[14px] font-normal leading-normal"
              style={{ color: "rgba(255, 255, 255, 1)" }}
            >
              Chris Liu
            </p>
            <div className="mb-10 max-w-md text-[14px] font-normal leading-normal">
            <p
              className="mb-0"
              style={{ color: "rgba(255, 255, 255, 1)" }}
            >
              Chris is a product designer based in Brooklyn, NY. He's created digital experiences for Square, Meta, Google, etc.
            </p>
            <div className="mb-10 max-w-md text-[14px] font-normal leading-normal">
              </div><Link
              href="https://www.linkedin.com/in/chrisxliu/"
              target="_blank"
              rel="noopener noreferrer"
              className="block underline"
              style={{ color: "rgba(0, 0, 0, 0.7)" }}
            >
              LinkedIn
            </Link>
            <Link
              href="mailto:chrisxliu@icloud.com"
              className="block underline"
              style={{ color: "rgba(0, 0, 0, 0.7)" }}
            >
              Email
            </Link>
            <p className="mb-0">&nbsp;</p>
            <p className="mb-0" style={{ color: "rgba(0, 0, 0, 0.7)" }}>
              Please contact for work samples.
            </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
            <div className="flex h-[45px] w-[200px] items-stretch overflow-hidden rounded-[8px] border-0 bg-black/20 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_0_20px_6px_rgba(255,255,255,0.35),0_0_40px_12px_rgba(255,255,255,0.15)]">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`shrink-0 border-0 bg-transparent text-center text-[14px] text-white placeholder:text-white focus:outline-none ${password.length > 0 ? "w-[152px] pl-[48px] pr-2" : "w-full min-w-0 px-2"}`}
                autoComplete="current-password"
              />
              {password.length > 0 && (
                <button
                  type="submit"
                  className="flex h-full w-[48px] shrink-0 items-center justify-end pr-2 text-white focus:outline-none focus:ring-inset focus:ring-2 focus:ring-white/30"
                  style={{ color: LANDING_TEXT_COLOR }}
                  aria-label="Submit password"
                >
                  <svg
                    className="h-5 w-5 shrink-0"
                    viewBox="0 0 21 21"
                    fill="white"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.5 0C16.299 0 21 4.70101 21 10.5C21 16.299 16.299 21 10.5 21C4.70101 21 0 16.299 0 10.5C0 4.70101 4.70101 0 10.5 0ZM11.4443 5.30664C10.9922 4.7851 10.2023 4.72858 9.68066 5.18066C9.15963 5.63272 9.10319 6.42183 9.55469 6.94336L11.5537 9.25H6.70801C6.0178 9.25018 5.45801 9.80975 5.45801 10.5C5.45801 11.1902 6.0178 11.7498 6.70801 11.75H11.5537L9.55469 14.0566C9.10319 14.5782 9.15963 15.3673 9.68066 15.8193C10.2023 16.2714 10.9922 16.2149 11.4443 15.6934L15.2363 11.3184C15.6431 10.8487 15.6431 10.1513 15.2363 9.68164L11.4443 5.30664Z"
                    />
                  </svg>
                </button>
              )}
            </div>
            {error && (
              <p className="text-[14px]" style={{ color: LANDING_TEXT_COLOR }}>
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
