"use client";

type TournamentsEmptyStateProps = {
  title?: string;
  description?: string;
  icon?: string;
};

export function TournamentsEmptyState({
  title = "No tournaments found",
  description = "Try adjusting your search or filter",
  icon = "🔍",
}: TournamentsEmptyStateProps) {
  return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </div>
  );
}