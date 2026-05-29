import { useStore } from "../store.jsx";

export default function Terms() {
  const { data } = useStore();
  const t = data.terms;

  return (
    <section className="section legal-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Legal</p>
          <h2>Terms &amp; Conditions and Refund Policy</h2>
          <p className="lead">
            These terms govern your use of {t.entity}. Last updated {t.lastUpdated} · Effective {t.effectiveDate}.
          </p>
        </div>
      </div>

      <div className="legal-layout">
        <aside className="legal-toc">
          <p className="legal-toc__title">On this page</p>
          <nav aria-label="Terms sections">
            <a href="#highlights">The short version</a>
            {t.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="legal-body">
          <div id="highlights" className="legal-highlights">
            <h3>The short version</h3>
            <p className="muted">A plain-language summary — the full terms below control if there's any conflict.</p>
            <ul>
              {t.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          {t.sections.map((s) => (
            <article id={s.id} className="legal-section" key={s.id}>
              <h3>{s.title}</h3>
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {s.list && (
                <ul className="legal-list">
                  {s.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}

              {s.id === "cancellation" && (
                <div className="cancel-table-wrap">
                  <table className="cancel-table">
                    <thead>
                      <tr>
                        <th>Policy</th>
                        <th>Full refund of space fee</th>
                        <th>50% refund of space fee</th>
                        <th>No refund</th>
                        <th>When it's used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.cancellationTiers.map((tier) => (
                        <tr key={tier.name}>
                          <td>
                            <strong>{tier.name}</strong>
                          </td>
                          <td>{tier.full}</td>
                          <td>{tier.partial}</td>
                          <td>{tier.none}</td>
                          <td className="muted">{tier.usedFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="muted small">
                    The space fee is the listing subtotal. The {t.serviceFeeRate} service fee is handled separately, as described above.
                  </p>
                </div>
              )}
            </article>
          ))}

          <p className="legal-footer-note muted small">
            Accepted payment methods: {data.legal.payments.join(", ")}. Governing law: {t.governingLaw}. Contact:{" "}
            <a href={`mailto:${t.contactEmail}`}>{t.contactEmail}</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
