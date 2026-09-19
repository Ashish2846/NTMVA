export function LoadingSkeleton(): JSX.Element {
  return (
    <div className="skeleton-grid" aria-label="Loading console">
      {Array.from({ length: 12 }, (_, index) => (
        <div className="skeleton-block" key={index} />
      ))}
    </div>
  );
}
