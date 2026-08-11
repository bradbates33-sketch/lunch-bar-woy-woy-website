export default function MenuCard({ name, price }) {
  return (
    <div className="border p-4 rounded-lg shadow-sm">
      <h3 className="font-bold">{name}</h3>
      <p>${price}</p>
      <button className="mt-2 px-4 py-2 bg-yellow-400 rounded-lg">
        Add to Cart
      </button>
    </div>
  );
}
