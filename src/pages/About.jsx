import { useState } from "react";
import { useStore } from "../store.jsx";
import { useBookingUI } from "../booking-ui.jsx";

export default function About() {
  const { data, media, submitInquiry } = useStore();
  const { showToast } = useBookingUI();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !/\S+@\S+\.\S+/.test(form.email)) return;
    submitInquiry({ ...form, interest: form.subject });
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    showToast("Message sent - it now appears in Admin → Inquiries.");
  };

  const featuredMedia = media.filter((m) => !m.url.includes("-32x32") && !m.url.includes("-180x180")).slice(0, 12);

  return (
    <>
      <section className="section contact-section">
        <form className="contact-form" onSubmit={submit}>
          <label>
            Your name
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Your email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Subject
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </label>
          <label>
            Your message
            <textarea rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </label>
          <button className="primary-button" type="submit">
            {sent ? "Sent ✓ Send another" : "Send Message"}
          </button>
        </form>
        <div>
          <p className="eyebrow">Contact</p>
          <h2>Have questions about finding the perfect rental space?</h2>
          <p>Whether you are a host or a guest, the Phrazs team is here to help you every step of the way.</p>
          <p>
            <strong>Email:</strong> <a href={`mailto:${data.brand.email}`}>{data.brand.email}</a>
          </p>
          <p>
            <strong>Based in:</strong> {data.brand.legalAddress}
          </p>
          <p>Reach out today. We are committed to making your experience smooth and hassle-free.</p>
        </div>
      </section>

      <section className="section media-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Original Images</p>
            <h2>Public Phrazs media from the live catalog.</h2>
          </div>
        </div>
        <div className="media-grid">
          {featuredMedia.map((item) => (
            <a className="media-card" href={item.url} target="_blank" rel="noreferrer" key={item.url}>
              <img src={item.url} alt={item.page} loading="lazy" />
              <span>{item.page}</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
