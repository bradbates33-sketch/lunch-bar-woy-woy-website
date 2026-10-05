import { illustrationKeyFor, illustrationMarkup } from '../lib/illustrations';

// Stencil-style drawing for a menu item. The SVG markup comes from our own
// static drawings in lib/illustrations.js (never from Square or user input).
export default function FoodIllustration({ item }) {
  return (
    <svg
      viewBox="0 0 200 150"
      aria-hidden="true"
      focusable="false"
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: illustrationMarkup(illustrationKeyFor(item)) }}
    />
  );
}
