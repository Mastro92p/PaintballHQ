"use client";

type TournamentsErrorStateProps = {
  error: string;
};

export function TournamentsErrorState({
  error,
}: TournamentsErrorStateProps) {
  return (
    <div className="text-center py-12 text-red-500">
      <p className="text-lg font-medium">Failed to load tournaments</p>
      <p className="text-sm mt-1">{error}</p>
    </div>
  );
}