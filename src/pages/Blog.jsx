import { useStore } from "../store.jsx";

export default function Blog() {
  const { data } = useStore();
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">From the Blog</p>
          <h2>Recent articles from the Phrazs blog.</h2>
        </div>
      </div>
      <div className="blog-grid">
        {data.blog.map((post) => (
          <article className="blog-card" key={post.title + post.date}>
            <img src={post.image} alt={post.title} loading="lazy" />
            <div>
              <p className="card-meta">{post.categories.join(" · ")}</p>
              <h3>{post.title}</h3>
              <p className="muted small">
                {post.date} · By {post.author}
              </p>
              <p className="muted small">{post.comments}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
