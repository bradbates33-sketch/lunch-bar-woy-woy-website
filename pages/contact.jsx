import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Contact() {
  return (
    <>
      <Header />
      <main className="p-6">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p>Address: Woy Woy, NSW</p>
        <p>Phone: 0400 000 000</p>
      </main>
      <Footer />
    </>
  );
}
