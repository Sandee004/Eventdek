/** Deterministic pseudo-QR rendered from the ticket reference — no scanner backend needed. */
export function QrBlock({
  value,
  size = 132,
}: {
  value: string;
  size?: number;
}) {
  const cells = 21;
  let seed = 0;
  for (let i = 0; i < value.length; i++)
    seed = (seed * 31 + value.charCodeAt(i)) % 99991;
  const on = (x: number, y: number) => {
    const isFinder =
      (x < 7 && y < 7) || (x > cells - 8 && y < 7) || (x < 7 && y > cells - 8);
    if (isFinder) {
      const lx = x > cells - 8 ? x - (cells - 7) : x;
      const ly = y > cells - 8 ? y - (cells - 7) : y;
      const ring = Math.max(Math.abs(lx - 3), Math.abs(ly - 3));
      return ring === 3 || ring <= 1;
    }
    const n = (seed * (x + 3) * (y + 7) + x * 13 + y * 29) % 100;
    return n % 3 === 0;
  };

  return (
    <svg
      role="img"
      aria-label={`Check-in code ${value}`}
      viewBox={`0 0 ${cells} ${cells}`}
      width={size}
      height={size}
      className="rounded bg-background"
      shapeRendering="crispEdges"
    >
      {Array.from({ length: cells }).map((_, y) =>
        Array.from({ length: cells }).map((__, x) =>
          on(x, y) ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
