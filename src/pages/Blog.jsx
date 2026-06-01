import { useStore } from "../store.jsx";
import { motion, Reveal, RevealGroup, fadeUp } from "../motion.jsx";

export default function Blog() {
  const { data } = useStore();
  return (
    <section className="section">
      <Reveal className="section-heading">
        <div>
          <p className="eyebrow">From the blog</p>
          <h2>Stories, tips, and behind the scenes.</h2>
        </div>
      </Reveal>
      <RevealGroup className="blog-grid">
        {data.blog.map((post) => (
          <motion.article
            className="blog-card"
            key={post.title + post.date}
            variants={fadeUp}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <img src={post.image} alt={post.title} loading="lazy" />
            <div>
              <p className="card-meta">{post.categories.join(" · ")}</p>
              <h3>{post.title}</h3>
              <p className="muted small">
                {post.date} · By {post.author}
              </p>
              <p className="muted small">{post.comments}</p>
            </div>
          </motion.article>
        ))}
      </RevealGroup>
    </section>
  );
}
