import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Menu() {
  return (
    <>
      <Header />
      <main className="p-6">
        <h2 className="text-3xl font-bold mb-4">Menu</h2>
        <p>This page will show your Square menu items.</p>
      </main>
      <Footer />
    </>
  );
}
