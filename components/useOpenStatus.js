import { useEffect, useState } from 'react';
import { getStatus } from '../lib/hours';

// Live trading status, or null until the page has loaded in the browser.
// Pages are pre-built and cached, so "open now" can't be baked into the HTML —
// it's worked out on the visitor's device and refreshed every minute.
export default function useOpenStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const update = () => setStatus(getStatus());
    update();
    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return status;
}
