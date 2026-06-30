type OrbProps = Readonly<{
  className: string;
  drift?: boolean;
}>;

// Decorative blurred background orb. Visual variants live in landing.css.
export function Orb({ className, drift = false }: OrbProps) {
  return (
    <div
      aria-hidden="true"
      className={`landing-orb ${className}${drift ? " landing-animate-orb-drift" : ""}`}
    />
  );
}
