export default function FormCard({
  children,
  header,
  subHeader,
}: {
  children: React.ReactNode;
  header: string;
  subHeader?: string;
}) {
  return (
    <div className="m-auto mt-4 max-w-md rounded border-gray-200 p-8 md:mt-10 md:border">
      <div className="pb-6">
        <div className="pb-4 text-center text-2xl font-bold tracking-tight">
          <span className="text-primary pointer-events-none">Snap</span>
          <span className="text-secondary pointer-events-none">Safe</span>
        </div>
        <div className="text-center text-2xl font-medium">{header}</div>
        {subHeader && (
          <div className="text-center text-gray-600 mt-2">{subHeader}</div>
        )}
      </div>
      {children}
    </div>
  );
}
