"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, LogIn, Factory } from "lucide-react";

const ROLE_DASHBOARDS: Record<string, string> = {
  ACCOUNTANT: "/dashboard/accountant",
  SAMPLE_PRODUCTION_MANAGER: "/dashboard/sample-pm",
  PRODUCTION_MANAGER: "/dashboard/production",
  MERCHANDISER: "/dashboard/merchandiser",
  STORE_MANAGER: "/dashboard/manager",
  RUNNER: "/dashboard/runner",
  CEO: "/dashboard/ceo",
};

// --- 3D Globe Background Component ---
function GlobeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width: number;
    let height: number;

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) / (width / 2);
      mouseY = (e.clientY - height / 2) / (height / 2);
    };
    window.addEventListener("mousemove", handleMouseMove);

    const numPoints = 1200;
    const points: { x: number; y: number; z: number; baseSize: number; isLand: boolean }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const noise = Math.sin(x * 5) * Math.cos(y * 5) + Math.sin(z * 5);
      const isLand = noise > 0.2;

      points.push({
        x,
        y,
        z,
        baseSize: isLand ? Math.random() * 1.5 + 1.0 : Math.random() * 1.0 + 0.5,
        isLand,
      });
    }

    const routes = Array.from({ length: 30 }).map(() => ({
      startIndex: Math.floor(Math.random() * numPoints),
      endIndex: Math.floor(Math.random() * numPoints),
      progress: Math.random(),
      speed: Math.random() * 0.003 + 0.001,
      type: Math.random() > 0.5 ? "air" : "sea",
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);
    resize();

    let rotationY = 0;
    let rotationX = 0.3;
    let targetRotationY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      targetRotationY += 0.002;
      rotationY += (targetRotationY + mouseX * 0.5 - rotationY) * 0.05;
      rotationX += (0.3 + mouseY * 0.3 - rotationX) * 0.05;

      const globeRadius = Math.min(width, height) * 0.54;
      const fov = 400;
      const cameraZ = 2.5;

      const projectedPoints: { x: number; y: number; z: number; x2d: number; y2d: number; scale: number }[] = [];

      points.forEach((p) => {
        const rY = p.y * Math.cos(rotationX) - p.z * Math.sin(rotationX);
        const rZ = p.y * Math.sin(rotationX) + p.z * Math.cos(rotationX);
        const rX = p.x;

        const finalX = rX * Math.cos(rotationY) - rZ * Math.sin(rotationY);
        const finalZ = rX * Math.sin(rotationY) + rZ * Math.cos(rotationY);
        const finalY = rY;

        const scale = fov / (fov + finalZ + cameraZ);
        const x2d = width / 2 + finalX * scale * globeRadius;
        const y2d = height / 2 + finalY * scale * globeRadius;

        projectedPoints.push({ x: finalX, y: finalY, z: finalZ, x2d, y2d, scale });

        if (finalZ > -1.5) {
          const depthAlpha = Math.max(0.1, (finalZ + 1.5) / 2.5);
          ctx.beginPath();
          ctx.arc(x2d, y2d, p.baseSize * scale, 0, Math.PI * 2);
          ctx.fillStyle = p.isLand
            ? `rgba(99, 102, 241, ${depthAlpha * 0.6})`
            : `rgba(59, 130, 246, ${depthAlpha * 0.2})`;
          ctx.fill();
        }
      });

      routes.forEach((route) => {
        route.progress += route.speed;
        if (route.progress > 1) route.progress = 0;

        const p1 = projectedPoints[route.startIndex];
        const p2 = projectedPoints[route.endIndex];

        if (p1.z > -0.5 && p2.z > -0.5) {
          const arcMax = route.type === "air" ? 0.35 : 0.02;
          const arcHeight = Math.sin(route.progress * Math.PI) * arcMax;

          const curX = p1.x + (p2.x - p1.x) * route.progress;
          const curY = p1.y + (p2.y - p1.y) * route.progress - arcHeight;
          const curZ = p1.z + (p2.z - p1.z) * route.progress;

          const scale = fov / (fov + curZ + cameraZ);
          const x2d = width / 2 + curX * scale * globeRadius;
          const y2d = height / 2 + curY * scale * globeRadius;

          const nextProgress = route.progress + 0.01;
          const nextArcHeight = Math.sin(nextProgress * Math.PI) * arcMax;
          const nextX = p1.x + (p2.x - p1.x) * nextProgress;
          const nextY = p1.y + (p2.y - p1.y) * nextProgress - nextArcHeight;
          const nextZ = p1.z + (p2.z - p1.z) * nextProgress;
          const nextScale = fov / (fov + nextZ + cameraZ);
          const nextX2d = width / 2 + nextX * nextScale * globeRadius;
          const nextY2d = height / 2 + nextY * nextScale * globeRadius;

          const angle = Math.atan2(nextY2d - y2d, nextX2d - x2d);

          ctx.beginPath();
          ctx.moveTo(p1.x2d, p1.y2d);
          ctx.lineTo(x2d, y2d);
          ctx.strokeStyle =
            route.type === "air"
              ? `rgba(239, 68, 68, ${Math.sin(route.progress * Math.PI) * 0.3})`
              : `rgba(99, 102, 241, ${Math.sin(route.progress * Math.PI) * 0.4})`;
          ctx.lineWidth = route.type === "air" ? 1.5 : 1;
          ctx.stroke();

          ctx.save();
          ctx.translate(x2d, y2d);
          ctx.rotate(angle);

          if (route.type === "air") {
            ctx.fillStyle = `rgba(239, 68, 68, ${Math.sin(route.progress * Math.PI)})`;
            ctx.beginPath();
            ctx.moveTo(5 * scale, 0);
            ctx.lineTo(-4 * scale, 4 * scale);
            ctx.lineTo(-4 * scale, -4 * scale);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(99, 102, 241, ${Math.sin(route.progress * Math.PI)})`;
            ctx.fillRect(-3 * scale, -1.5 * scale, 6 * scale, 3 * scale);
          }

          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}

// --- Demo role credentials ---
const DEMO_ROLES = [
  { email: "accountant@cashflow.com", label: "Accountant" },
  { email: "sample.pm@cashflow.com", label: "Sample PM" },
  { email: "production@cashflow.com", label: "Production PM" },
  { email: "merch@cashflow.com", label: "Merchandiser" },
  { email: "manager@cashflow.com", label: "Store Mgr" },
  { email: "runner@cashflow.com", label: "Runner" },
];

// --- Main Login Page ---
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error === "CredentialsSignin" ? "Invalid credentials" : result.error);
        setLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (session?.user?.must_change_password) {
        router.push("/change-password");
        return;
      }

      toast.success("Signed in successfully");
      router.push(ROLE_DASHBOARDS[role] || "/dashboard/accountant");
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Change@123");
  };

  return (
    <div className="relative min-h-screen w-full bg-surface-0 flex items-center justify-center font-sans overflow-hidden selection:bg-brand-muted">
      {/* 3D Globe Background */}
      <GlobeBackground />

      <div className="absolute inset-0 z-0 pointer-events-none" />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-[420px] px-4">
        {/* Header / Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            The Manufacturer Club
          </h1>
          <p className="text-sm text-foreground-secondary font-medium mt-1 flex items-center gap-1.5">
            <Factory className="w-4 h-4" /> Global Production Tracking
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-1/80 backdrop-blur-md border border-border rounded-2xl p-8 shadow-premium-xl">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground-secondary block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-foreground-tertiary" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-all duration-200"
                  placeholder="you@manufacturer.club"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground-secondary block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-foreground-tertiary" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand hover:bg-brand-hover disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl shadow-premium-lg shadow-brand/20 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  Sign In
                  <LogIn className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-border-secondary">
            <p className="text-xs font-medium text-foreground-tertiary text-center mb-4 uppercase tracking-wider">
              Demo Roles (pw: Change@123)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => setDemoRole(cred.email)}
                  type="button"
                  className="text-xs font-medium text-foreground-secondary bg-surface-2 hover:bg-surface-3 border border-border py-2.5 rounded-lg transition-colors"
                >
                  {cred.label}
                </button>
              ))}
              <button
                onClick={() => setDemoRole("ceo@cashflow.com")}
                type="button"
                className="col-span-2 text-xs font-medium text-brand-hover bg-brand-muted hover:bg-brand/20 border border-brand/30 py-2.5 rounded-lg transition-colors"
              >
                CEO
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-foreground-muted mt-8 font-medium">
          &copy; 2026 The Manufacturer Club Systems
        </p>
      </div>
    </div>
  );
}
