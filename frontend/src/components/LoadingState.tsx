export default function LoadingState() {
  return (
    <section aria-busy="true" aria-label="Loading restaurant recommendations" className="w-full">
      <div className="mb-lg mt-md">
        {/* Skeleton headline */}
        <div className="shimmer h-10 w-72 rounded-xl mb-3" />
        <div className="shimmer h-5 w-96 rounded-lg" />
      </div>

      {/* 3 skeleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="glass-card rounded-2xl overflow-hidden flex flex-col"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className="p-sm flex flex-col gap-3 flex-grow">
              {/* Name skeleton */}
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="shimmer h-6 w-3/4 rounded-lg mb-2" />
                  <div className="shimmer h-4 w-24 rounded-full" />
                </div>
                <div className="shimmer h-6 w-6 rounded" />
              </div>

              {/* Rating + Cost skeleton */}
              <div className="flex items-center gap-xs">
                <div className="shimmer h-4 w-24 rounded" />
                <div className="shimmer h-4 w-32 rounded" />
              </div>

              {/* Explanation skeleton */}
              <div className="mt-auto bg-surface-container-high/30 rounded-xl p-3 flex flex-col gap-2">
                <div className="shimmer h-4 w-16 rounded-full" />
                <div className="shimmer h-4 w-full rounded" />
                <div className="shimmer h-4 w-5/6 rounded" />
                <div className="shimmer h-4 w-4/6 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Working indicator */}
      <div className="mt-lg flex items-center justify-center gap-sm text-on-surface-variant font-body-md text-body-md">
        <span className="material-symbols-outlined text-primary animate-spin text-[20px]">
          progress_activity
        </span>
        <span>AI is finding your perfect matches…</span>
      </div>
    </section>
  )
}
