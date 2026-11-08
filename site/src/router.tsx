import { useEffect, useState } from "react";

/** Hash routing so every page works on GitHub Pages without server rewrites. */
export function useRoute() {
  const read = () => (location.hash.replace(/^#/, "") || "/");
  const [r, setR] = useState(read);
  useEffect(() => {
    const on = () => { setR(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}
export const go = (to: string) => { location.hash = to; };

export function A({ to, className, children, ...rest }: { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={`#${to}`} className={className} {...rest}>{children}</a>;
}
