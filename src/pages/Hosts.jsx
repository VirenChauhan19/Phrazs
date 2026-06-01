import { useStore } from "../store.jsx";
import { motion, Reveal, RevealGroup, fadeUp } from "../motion.jsx";

export default function Hosts() {
  const { hosts } = useStore();
  return (
    <section className="section">
      <Reveal className="section-heading">
        <div>
          <p className="eyebrow">Meet our hosts</p>
          <h2>Trusted, experienced hosts.</h2>
        </div>
      </Reveal>
      <Reveal as="p" className="lead">
        Hosts, studios, and property owners open their spaces for shoots, events, podcasts, and intimate productions.
      </Reveal>
      <RevealGroup className="host-grid">
        {hosts.map((host) => (
          <motion.article
            className="host-card"
            key={host.name}
            variants={fadeUp}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <img src={host.image} alt={host.name} />
            <div>
              <h3>{host.name}</h3>
              <p>Member since {host.memberSince}</p>
              <p>{host.rating ? `★ ${host.rating} (${host.reviews})` : "No public rating yet"}</p>
              <p>{host.languages.length ? `Languages: ${host.languages.join(", ")}` : "Languages not listed"}</p>
              {host.services.length > 0 && <p>Services: {host.services.join(", ")}</p>}
              <strong>{host.listings} Listings</strong>
            </div>
          </motion.article>
        ))}
      </RevealGroup>
    </section>
  );
}
