import { fetchMenuItems } from '../../lib/square';
 
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const items = await fetchMenuItems();
  res.status(200).json({ items });
}
}
