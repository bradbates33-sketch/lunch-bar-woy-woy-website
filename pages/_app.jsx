import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/next';
import { CartProvider } from '../components/CartContext';
import CartDrawer from '../components/CartDrawer';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
      <CartDrawer />
      {/* Cookie-free visitor stats. Switch on under Analytics in the Vercel project. */}
      <Analytics />
    </CartProvider>
  );
}
