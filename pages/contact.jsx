import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Contact() {
  return (
    <>
      <Header />
      <main className="p-6">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p>Address: 35 Blackwall Road, Woy Woy NSW 2256</p>
        <p>Phone: 0422 430 033</p>
      </main>
      <Footer />
    </>
  );
}
