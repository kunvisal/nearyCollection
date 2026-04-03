interface SkeletonBoxProps {
  className?: string;
  width?: string;
  height?: string;
}

export function SkeletonBox({ className = "", width, height }: SkeletonBoxProps) {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{ width, height }}
    />
  );
}

interface SkeletonTextProps {
  className?: string;
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ className = "", lines = 1, lastLineWidth = "60%" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-box h-4 w-full"
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

interface SkeletonAvatarProps {
  className?: string;
  size?: string;
}

export function SkeletonAvatar({ className = "", size = "2.5rem" }: SkeletonAvatarProps) {
  return (
    <div
      className={`skeleton-box rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
