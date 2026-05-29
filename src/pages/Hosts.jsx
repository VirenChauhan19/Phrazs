import { useStore } from "../store.jsx";

export default function Hosts() {
  const { hosts } = useStore();
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Meet Our Hosts</p>
          <h2>Trusted and experienced hosts.</h2>
        </div>
      </div>
      <p className="lead">Hosts, studios, and property owners provide spaces for shoots, events, podcasts, and intimate productions.</p>
      <div className="host-grid">
        {hosts.map((host) => (
          <article className="host-card" key={host.name}>
            <img src={host.image} alt={host.name} />
            <div>
              <h3>{host.name}</h3>
              <p>Member since {host.memberSince}</p>
              <p>{host.rating ? `★ ${host.rating} (${host.reviews})` : "No public rating yet"}</p>
              <p>{host.languages.length ? `Languages: ${host.languages.join(", ")}` : "Languages not listed"}</p>
              {host.services.length > 0 && <p>Services: {host.services.join(", ")}</p>}
              <strong>{host.listings} Listings</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
