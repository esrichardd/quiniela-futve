import "@/features/auth/auth.css";

type AuthRouteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  return children;
}
