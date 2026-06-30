type AuthBrandMarkProps = Readonly<{
  className?: string;
}>;

export function AuthBrandMark({
  className = "size-12 rounded-xl",
}: AuthBrandMarkProps) {
  return (
    <span
      className={`auth-btn-glow flex items-center justify-center ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="relative z-10 size-1/2"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2c1.07 0 2.1.17 3.06.49L13 7h-2L8.94 4.49A7.96 7.96 0 0 1 12 4zM7.5 5.38 9.5 8.5 7 10H4.23A8.02 8.02 0 0 1 7.5 5.38zM4.23 14H7l2.5 1.5-2 3.12A8.02 8.02 0 0 1 4.23 14zm4.71 4.51L11 15.5h2l2.06 3.01A7.96 7.96 0 0 1 12 20a7.96 7.96 0 0 1-3.06-.49zm7.56-.39-2-2.62L17 14h2.77a8.02 8.02 0 0 1-3.27 4.12zM19.77 12H17l-2.5-1.5 2-3.12A8.02 8.02 0 0 1 19.77 12z" />
      </svg>
    </span>
  );
}
