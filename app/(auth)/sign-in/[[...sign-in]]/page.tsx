import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Left — branding panel */}
      <div
        className="flex flex-col justify-between p-12"
        style={{ background: "#1c0509" }}
      >
        <div>
          <Image
            src="/logo.png"
            alt="The Rosary School"
            width={160}
            height={48}
            priority
            style={{ height: "48px", width: "auto", objectFit: "contain" }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "#ba2032" }}
            >
              TRS School OS
            </div>
            <h1
              className="text-4xl font-bold leading-tight"
              style={{
                color: "#f0dede",
                fontFamily: "var(--font-kumbh), sans-serif",
              }}
            >
              The operating system
              <br />
              for The Rosary School.
            </h1>
            <p
              className="text-sm leading-relaxed max-w-sm"
              style={{ color: "rgba(240,222,222,0.5)" }}
            >
              Content management, period scheduling, teacher operations
              and performance analytics — all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              "Structured lesson plans and MCQs for every chapter",
              "Live period coverage tracking across all classes",
              "Weekly performance reports for every teacher",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(186,32,50,0.3)" }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#ba2032" }}
                  />
                </div>
                <span
                  className="text-xs leading-relaxed"
                  style={{ color: "rgba(240,222,222,0.6)" }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="text-xs"
          style={{ color: "rgba(240,222,222,0.25)" }}
        >
          © {new Date().getFullYear()} The Rosary School. Internal use only.
        </div>
      </div>

      {/* Right — sign in form */}
      <div
        className="flex flex-col items-center justify-center p-12"
        style={{ background: "#f5f2eb" }}
      >
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h2
              className="text-2xl font-bold"
              style={{
                color: "#1a1714",
                fontFamily: "var(--font-kumbh), sans-serif",
              }}
            >
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: "#7a7266" }}>
              Sign in to access your dashboard
            </p>
            <Link
              href="/sign-up"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-[#d4cfc6] bg-white px-3.5 py-2 text-sm font-semibold text-[#1a1714] transition-colors hover:bg-[#f0ede6]"
            >
              Sign up
            </Link>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 bg-transparent w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                header: "hidden",
                socialButtonsBlockButton:
                  "border border-[#d4cfc6] bg-white hover:bg-[#f0ede6] text-[#1a1714] text-sm font-medium rounded-lg h-10 transition-colors",
                socialButtonsBlockButtonText: "text-sm font-medium",
                dividerLine: "bg-[#d4cfc6]",
                dividerText: "text-[#7a7266] text-xs",
                formFieldLabel:
                  "text-[11px] font-semibold uppercase tracking-wider text-[#7a7266]",
                formFieldInput:
                  "h-10 border border-[#d4cfc6] rounded-lg text-sm bg-white focus:border-[#ba2032] focus:ring-2 focus:ring-[#ba2032]/10 outline-none px-3",
                formButtonPrimary:
                  "bg-[#ba2032] hover:bg-[#a01b2b] text-white text-sm font-semibold rounded-lg h-10 transition-colors shadow-none",
                footerAction: "hidden",
                identityPreviewText: "text-sm text-[#1a1714]",
                identityPreviewEditButton: "text-[#ba2032] text-xs",
                formFieldInputShowPasswordButton: "text-[#7a7266]",
                alertText: "text-sm text-red-600",
                formResendCodeLink: "text-[#ba2032] text-sm",
              },
              variables: {
                colorPrimary: "#ba2032",
                colorText: "#1a1714",
                colorTextSecondary: "#7a7266",
                colorBackground: "transparent",
                colorInputBackground: "#ffffff",
                colorInputText: "#1a1714",
                borderRadius: "8px",
                fontFamily: "var(--font-poppins), sans-serif",
              },
            }}
          />
          <p className="text-center text-xs" style={{ color: "#7a7266" }}>
  Don't have an account?{" "}
  
    href="/sign-up"
    className="font-medium hover:underline"
    style={{ color: "#ba2032" }}
  >
    Create account
  </a>
</p>
        </div>
      </div>
    </div>
  );
}
