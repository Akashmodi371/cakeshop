import CakeCard from './CakeCard'

interface Props {
  cakes: any[]
  onWishlistToggle?: () => void
}

export default function CakeGrid({ cakes, onWishlistToggle }: Props) {
  if (!cakes?.length) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🎂</div>
      <p className="text-gray-400 font-medium">No cakes found</p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {cakes.map((cake, i) => (
        <div key={cake.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
          <CakeCard cake={cake} onWishlistToggle={onWishlistToggle} />
        </div>
      ))}
    </div>
  )
}
