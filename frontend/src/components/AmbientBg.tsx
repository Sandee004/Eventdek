export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background select-none">
      <div className="absolute -top-32 -left-32 size-[30rem] rounded-full bg-going/[0.07] blur-[140px]" />
      <div className="absolute -bottom-32 -right-32 size-[32rem] rounded-full bg-pass/[0.05] blur-[140px]" />
    </div>
  );
}
