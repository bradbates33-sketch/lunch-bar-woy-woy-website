import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="p-6 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Fresh, Fast, Local — Lunch Bar Woy Woy
        </h2>
        <p className="mb-6">Order pickup today</p>
        <a
          href="/menu"
          className="px-6 py-3 bg-yellow-400 rounded-lg font-bold"
        >
          View Menu
        </a>
      </main>
      <Footer />
    </>
  );
}
