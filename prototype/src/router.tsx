import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
}

interface NavigateOptions {
  replace?: boolean;
}

type Navigate = (to: string, options?: NavigateOptions) => void;

interface RouterValue {
  location: RouterLocation;
  navigate: Navigate;
}

const RouterContext = createContext<RouterValue | null>(null);
const prototypeOrigin = "http://prototype.local";

function parseTarget(target: string): RouterLocation {
  const url = new URL(target, prototypeOrigin);
  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}

function locationHref(location: RouterLocation) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function browserLocation(): RouterLocation {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

function RouterProvider({
  children,
  location,
  navigate,
}: {
  children: ReactNode;
  location: RouterLocation;
  navigate: Navigate;
}) {
  const value = useMemo(() => ({ location, navigate }), [location, navigate]);
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(browserLocation);

  useEffect(() => {
    const handlePopState = () => setLocation(browserLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback<Navigate>((target, options = {}) => {
    const next = parseTarget(target);
    window.history[options.replace ? "replaceState" : "pushState"](
      {},
      "",
      locationHref(next),
    );
    setLocation(browserLocation());
  }, []);

  return (
    <RouterProvider location={location} navigate={navigate}>
      {children}
    </RouterProvider>
  );
}

export function MemoryRouter({
  children,
  initialEntries = ["/"],
}: {
  children: ReactNode;
  initialEntries?: string[];
}) {
  const [location, setLocation] = useState(() =>
    parseTarget(initialEntries[0] ?? "/"),
  );
  const navigate = useCallback<Navigate>((target) => {
    setLocation(parseTarget(target));
  }, []);

  return (
    <RouterProvider location={location} navigate={navigate}>
      {children}
    </RouterProvider>
  );
}

function useRouter() {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error("Router hooks must be used inside BrowserRouter or MemoryRouter");
  }
  return router;
}

export function useLocation() {
  return useRouter().location;
}

export function useNavigate() {
  return useRouter().navigate;
}

export function useSearchParams() {
  const { location, navigate } = useRouter();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const setSearchParams = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      navigate(`${location.pathname}${query ? `?${query}` : ""}`);
    },
    [location.pathname, navigate],
  );
  return [searchParams, setSearchParams] as const;
}

interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
}

export function Link({
  children,
  onClick,
  target,
  to,
  ...props
}: LinkProps) {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === "_blank"
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };

  return (
    <a {...props} href={to} onClick={handleClick} target={target}>
      {children}
    </a>
  );
}

interface NavLinkProps extends Omit<LinkProps, "className"> {
  className?: string | ((state: { isActive: boolean }) => string);
}

export function NavLink({ className, to, ...props }: NavLinkProps) {
  const { pathname } = useLocation();
  const isActive = pathname === parseTarget(to).pathname;
  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link
      {...props}
      aria-current={isActive ? "page" : undefined}
      className={resolvedClassName}
      to={to}
    />
  );
}
