/**
 * Root template — re-mounts on every navigation (unlike layout.tsx), so the
 * `.page-enter` animation (a soft fade + rise, defined in globals.css) plays on
 * each route change. Honours prefers-reduced-motion via the global guard.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
