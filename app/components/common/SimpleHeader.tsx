export default function SimpleHeader({ name }: { name?: string }) {
  return (
    <nav className="flex h-14 items-center justify-between border-b border-b-gray-200 bg-gray-50 px-4 md:px-8">
      <div className="relative grow-0">
        <div className="z-1 pointer-events-none cursor-default bg-gray-50 text-xl font-bold tracking-tight md:text-2xl">
          <span className="text-primary pointer-events-none">Snap</span>
          <span className="text-secondary pointer-events-none">Safe</span>
        </div>
      </div>
      <div>{name}</div>
    </nav>
  );
}
