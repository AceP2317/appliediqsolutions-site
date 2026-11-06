export default function StarRating({ rating }: { rating: number }) {
  return (
    <span className="tracking-tight text-sm" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-ra-star" : "text-ra-muted"}>
          ★
        </span>
      ))}
    </span>
  );
}
