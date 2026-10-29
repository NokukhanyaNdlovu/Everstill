import { Link } from 'react-router-dom';

export default function Splash() {
  return (
    <section className="splash">
      <p className="eyebrow">Photo sharing</p>
      <h1>Keep the pictures that belong together, and find the people who took them.</h1>
      <p className="lede">
        Post a photo with a caption and tags, follow friends, browse a local or global feed, and keep public albums
        without turning the site into a marketplace.
      </p>
      <div className="cta-row">
        <Link className="btn" to="/register">
          Create an account
        </Link>
        <Link className="btn ghost" to="/login">
          Sign in
        </Link>
      </div>
    </section>
  );
}
