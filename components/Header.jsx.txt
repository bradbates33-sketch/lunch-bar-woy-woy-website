export default function Header() {
  return (
    <header className="p-4 shadow-md flex justify-between items-center">
      <h1 className="text-xl font-bold">Lunch Bar Woy Woy</h1>
      <nav className="space-x-4">
        <a href="/">Home</a>
        <a href="/menu">Menu</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
  );
}
