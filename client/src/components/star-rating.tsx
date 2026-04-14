interface StarRatingProps {
  rating: number | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function StarRating({ rating, size = "md", className = "" }: StarRatingProps) {
  const value = typeof rating === "string" ? parseFloat(rating) || 0 : rating;
  const sizeClass = sizeMap[size];

  return (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const half = !filled && value >= star - 0.5;

        return (
          <div key={star} className={`relative flex-shrink-0 ${sizeClass}`}>
            {/* Gray empty star base */}
            <svg
              viewBox="0 0 24 24"
              className={`absolute inset-0 ${sizeClass} text-gray-300`}
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>

            {/* Yellow filled overlay — full or half-clipped */}
            {(filled || half) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? "50%" : "100%" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`${sizeClass} text-yellow-400`}
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
