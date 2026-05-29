const data = window.PHRAZS_DATA;
const media = window.PHRAZS_MEDIA || [];

const state = {
  query: "",
  category: "All",
  sort: "featured",
  adminTab: "overview"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function money(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function byId(id) {
  return document.getElementById(id);
}

function renderTags() {
  byId("quickTags").innerHTML = data.tags.slice(0, 6).map((tag) => `<button type="button" data-tag="${tag}">${tag}</button>`).join("");
}

function renderCategoryOptions() {
  const categories = ["All", ...new Set(data.listings.map((item) => item.category))];
  byId("categorySelect").innerHTML = categories.map((category) => `<option value="${category}">${category === "All" ? "All Categories" : category}</option>`).join("");
}

function renderCategories() {
  byId("categoryGrid").innerHTML = data.categories.map((category) => `
    <article class="category-tile">
      <img src="${category.image}" alt="${category.name}">
      <div>
        <span>${category.count} Listings</span>
        <h3>${category.name}</h3>
        <p>${category.description}</p>
      </div>
    </article>
  `).join("");
}

function renderFilterButtons() {
  const categories = ["All", ...new Set(data.listings.map((item) => item.category))];
  byId("filterButtons").innerHTML = categories.map((category) => `
    <button type="button" class="${state.category === category ? "active" : ""}" data-filter="${category}">${category}</button>
  `).join("");
}

function filteredListings() {
  const query = state.query.toLowerCase().trim();
  let listings = data.listings.filter((item) => {
    const matchesCategory = state.category === "All" || item.category === state.category;
    const haystack = [item.title, item.category, item.pets, item.host, item.description, ...(item.tags || [])].join(" ").toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });

  listings = listings.slice();
  if (state.sort === "priceLow") listings.sort((a, b) => a.price - b.price);
  if (state.sort === "priceHigh") listings.sort((a, b) => b.price - a.price);
  if (state.sort === "spaceHigh") listings.sort((a, b) => (b.sqft || 0) - (a.sqft || 0));
  if (state.sort === "ratingHigh") listings.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return listings;
}

function listingCard(item) {
  const rating = item.rating ? `<span class="rating">${item.rating.toFixed(1)} (${item.reviews || 0})</span>` : `<span class="rating quiet">New</span>`;
  const stats = [
    item.sqft ? `Sq Footage: ${item.sqft.toLocaleString()}` : "",
    item.crew ? `Crew/People: ${item.crew}` : "",
    item.hours ? `Hours cap: ${item.hours}` : "",
    item.pets ? `Pets: ${item.pets}` : ""
  ].filter(Boolean);

  return `
    <article class="property-card">
      <a href="${item.url}" target="_blank" rel="noreferrer">
        <img src="${item.image}" alt="${item.title}">
      </a>
      <div class="property-body">
        <div class="card-meta">
          ${rating}
          <span>${item.category}</span>
        </div>
        <h3>${item.title}</h3>
        <p class="date">Added on ${item.added}</p>
        <ul>${stats.map((stat) => `<li>${stat}</li>`).join("")}</ul>
        <div class="property-footer">
          <strong>${item.priceLabel}</strong>
          <a href="${item.url}" target="_blank" rel="noreferrer">View</a>
        </div>
      </div>
    </article>
  `;
}

function renderListings() {
  const listings = filteredListings();
  byId("propertyGrid").innerHTML = listings.length
    ? listings.map(listingCard).join("")
    : `<p class="empty-state">No spaces match that search yet.</p>`;
}

function renderHosts() {
  byId("hostGrid").innerHTML = data.hosts.map((host) => `
    <article class="host-card">
      <img src="${host.image}" alt="${host.name}">
      <div>
        <h3>${host.name}</h3>
        <p>Member since ${host.memberSince}</p>
        <p>${host.rating ? `${host.rating} (${host.reviews})` : "No public rating yet"}</p>
        <p>${host.languages.length ? `Languages: ${host.languages.join(", ")}` : "Languages not listed"}</p>
        <strong>${host.listings} Listings</strong>
      </div>
    </article>
  `).join("");
}

function renderTestimonials() {
  byId("testimonialGrid").innerHTML = data.testimonials.map((item) => `
    <blockquote>
      <p>${item.quote}</p>
      <footer>${item.name}<span>${item.role}</span></footer>
    </blockquote>
  `).join("");
}

function renderBlog() {
  byId("blogGrid").innerHTML = data.blog.slice(0, 6).map((post) => `
    <article class="blog-card">
      <img src="${post.image}" alt="${post.title}">
      <div>
        <p class="card-meta">${post.categories.join(" · ")}</p>
        <h3>${post.title}</h3>
        <p>${post.date} · By ${post.author}</p>
        <p>${post.comments}</p>
      </div>
    </article>
  `).join("");
}

function renderMedia() {
  byId("mediaGrid").innerHTML = media.map((item) => `
    <a class="media-card" href="${item.url}" target="_blank" rel="noreferrer">
      <img src="${item.url}" alt="${item.page}">
      <span>${item.page}</span>
    </a>
  `).join("");
}

function renderMetrics() {
  const totalValue = data.listings.reduce((sum, item) => sum + (item.price || 0), 0);
  const paidGross = data.payments.reduce((sum, item) => sum + (item.gross || 0), 0);
  const activeBookings = data.bookings.filter((item) => ["Active", "Confirmed", "Pending Payment"].includes(item.status)).length;
  const completedBookings = data.bookings.filter((item) => item.status === "Completed").length;
  const stats = [
    ["Listings", data.listings.length],
    ["Hosts", data.hosts.length],
    ["Users", data.users.length],
    ["Active", activeBookings],
    ["Completed", completedBookings],
    ["Payment Gross", money(paidGross)],
    ["Avg. Price", money(Math.round(totalValue / data.listings.length))],
    ["Images", media.length]
  ];
  byId("metricGrid").innerHTML = stats.map(([label, value]) => `
    <article>
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function adminTable(items, columns) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${column.label}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>${columns.map((column) => `<td>${column.render(item)}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminPanel() {
  const panel = byId("adminPanel");
  if (state.adminTab === "overview") {
    const upcoming = data.bookings.filter((item) => item.status !== "Completed");
    panel.innerHTML = `
      <div class="admin-overview">
        <article>
          <h3>Booking Structure</h3>
          <ul>${data.bookingStructure.statuses.map((item) => `<li>${item}</li>`).join("")}</ul>
        </article>
        <article>
          <h3>Payment Structure</h3>
          <ul>${data.bookingStructure.paymentFields.map((item) => `<li>${item}</li>`).join("")}</ul>
        </article>
        <article>
          <h3>Calendar Rules</h3>
          <ul>${data.bookingStructure.calendarRules.map((item) => `<li>${item}</li>`).join("")}</ul>
        </article>
      </div>
      <h3 class="panel-heading">Upcoming Work</h3>
      ${adminTable(upcoming, [
        { label: "Booking", render: (item) => `<strong>${item.id}</strong><small>${item.property}</small>` },
        { label: "Guest", render: (item) => `${item.guest}<small>${item.guestEmail}</small>` },
        { label: "Host", render: (item) => item.host },
        { label: "Date", render: (item) => `${item.date}<small>${item.start} - ${item.end}</small>` },
        { label: "Status", render: (item) => `<span class="status">${item.status}</span>` },
        { label: "Payment", render: (item) => `<span class="status">${item.paymentStatus}</span>` },
        { label: "Total", render: (item) => money(item.total) }
      ])}
    `;
  }
  if (state.adminTab === "bookings") {
    panel.innerHTML = adminTable(data.bookings, [
      { label: "Booking", render: (item) => `<strong>${item.id}</strong><small>${item.property}</small>` },
      { label: "Guest", render: (item) => `${item.guest}<small>${item.guestEmail}</small>` },
      { label: "Host", render: (item) => item.host },
      { label: "Schedule", render: (item) => `${item.start}<small>${item.end}</small>` },
      { label: "Crew", render: (item) => item.crew },
      { label: "Hours", render: (item) => item.hours },
      { label: "Status", render: (item) => `<span class="status">${item.status}</span>` },
      { label: "Payment", render: (item) => `<span class="status">${item.paymentStatus}</span>` },
      { label: "Total", render: (item) => money(item.total) },
      { label: "Notes", render: (item) => item.notes }
    ]);
  }
  if (state.adminTab === "active") {
    const active = data.bookings.filter((item) => ["Active", "Confirmed", "Pending Payment"].includes(item.status));
    panel.innerHTML = adminTable(active, [
      { label: "Booking", render: (item) => `<strong>${item.id}</strong><small>${item.property}</small>` },
      { label: "Date", render: (item) => item.date },
      { label: "Status", render: (item) => `<span class="status">${item.status}</span>` },
      { label: "Payment", render: (item) => `<span class="status">${item.paymentStatus}</span>` },
      { label: "Guest", render: (item) => item.guest },
      { label: "Host", render: (item) => item.host },
      { label: "Host Payout", render: (item) => money(item.hostPayout) },
      { label: "Total", render: (item) => money(item.total) }
    ]);
  }
  if (state.adminTab === "completed") {
    const completed = data.bookings.filter((item) => item.status === "Completed");
    panel.innerHTML = adminTable(completed, [
      { label: "Booking", render: (item) => `<strong>${item.id}</strong><small>${item.property}</small>` },
      { label: "Completed", render: (item) => item.date },
      { label: "Guest", render: (item) => item.guest },
      { label: "Host", render: (item) => item.host },
      { label: "Payment", render: (item) => `<span class="status">${item.paymentStatus}</span>` },
      { label: "Platform Fee", render: (item) => money(item.platformFee) },
      { label: "Host Payout", render: (item) => money(item.hostPayout) },
      { label: "Total", render: (item) => money(item.total) }
    ]);
  }
  if (state.adminTab === "payments") {
    panel.innerHTML = adminTable(data.payments, [
      { label: "Payment", render: (item) => `<strong>${item.id}</strong><small>${item.bookingId}</small>` },
      { label: "Processor", render: (item) => item.processor },
      { label: "Method", render: (item) => `${item.method}<small>${item.cardBrand} ending ${item.last4}</small>` },
      { label: "Gross", render: (item) => money(item.gross) },
      { label: "Fees", render: (item) => money(item.fees) },
      { label: "Net", render: (item) => money(item.net) },
      { label: "Refunded", render: (item) => money(item.refunded) },
      { label: "Status", render: (item) => `<span class="status">${item.status}</span>` },
      { label: "Captured", render: (item) => item.capturedAt }
    ]);
  }
  if (state.adminTab === "payouts") {
    panel.innerHTML = adminTable(data.payouts, [
      { label: "Payout", render: (item) => `<strong>${item.id}</strong><small>${item.bookingId}</small>` },
      { label: "Host", render: (item) => item.host },
      { label: "Amount", render: (item) => money(item.amount) },
      { label: "Status", render: (item) => `<span class="status">${item.status}</span>` },
      { label: "Payout Date", render: (item) => item.payoutDate }
    ]);
  }
  if (state.adminTab === "calendar") {
    panel.innerHTML = `
      <div class="calendar-grid">
        ${data.calendar.map((item) => `
          <article class="calendar-card">
            <span>${item.date}</span>
            <strong>${item.property}</strong>
            <p>${item.time}</p>
            <em>${item.status}${item.bookingId ? ` | ${item.bookingId}` : ""}</em>
          </article>
        `).join("")}
      </div>
    `;
  }
  if (state.adminTab === "users") {
    panel.innerHTML = adminTable(data.users, [
      { label: "User", render: (item) => `<strong>${item.name}</strong><small>${item.id}</small>` },
      { label: "Email", render: (item) => `<a href="mailto:${item.email}">${item.email}</a>` },
      { label: "Role", render: (item) => item.role },
      { label: "Status", render: (item) => `<span class="status">${item.status}</span>` },
      { label: "Joined", render: (item) => item.joined },
      { label: "Bookings", render: (item) => item.bookings },
      { label: "Lifetime Value", render: (item) => money(item.lifetimeValue) }
    ]);
  }
  if (state.adminTab === "listings") {
    panel.innerHTML = adminTable(data.listings, [
      { label: "Listing", render: (item) => `<strong>${item.title}</strong><small>${item.id}</small>` },
      { label: "Category", render: (item) => item.category },
      { label: "Price", render: (item) => item.priceLabel },
      { label: "Space", render: (item) => item.sqft ? item.sqft.toLocaleString() : "N/A" },
      { label: "Crew", render: (item) => item.crew || "N/A" },
      { label: "Pets", render: (item) => item.pets },
      { label: "Host", render: (item) => item.host || "N/A" },
      { label: "Source", render: (item) => `<a href="${item.url}" target="_blank" rel="noreferrer">Open</a>` }
    ]);
  }
  if (state.adminTab === "hosts") {
    panel.innerHTML = adminTable(data.hosts, [
      { label: "Host", render: (host) => `<strong>${host.name}</strong>` },
      { label: "Member Since", render: (host) => host.memberSince },
      { label: "Rating", render: (host) => host.rating ? `${host.rating} (${host.reviews})` : "N/A" },
      { label: "Languages", render: (host) => host.languages.join(", ") || "N/A" },
      { label: "Services", render: (host) => host.services.join(", ") || "N/A" },
      { label: "Listings", render: (host) => host.listings }
    ]);
  }
  if (state.adminTab === "media") {
    panel.innerHTML = adminTable(media, [
      { label: "Preview", render: (item) => `<img class="table-thumb" src="${item.url}" alt="${item.page}">` },
      { label: "Page / Use", render: (item) => `<strong>${item.page}</strong>` },
      { label: "Image URL", render: (item) => `<a href="${item.url}" target="_blank" rel="noreferrer">${item.url}</a>` }
    ]);
  }
  if (state.adminTab === "content") {
    panel.innerHTML = `
      <div class="content-columns">
        <article>
          <h3>Booking Structure</h3>
          <pre>${JSON.stringify(data.bookingStructure, null, 2)}</pre>
        </article>
        <article>
          <h3>Brand</h3>
          <pre>${JSON.stringify(data.brand, null, 2)}</pre>
        </article>
        <article>
          <h3>Media</h3>
          <pre>${JSON.stringify(media, null, 2)}</pre>
        </article>
        <article>
          <h3>Blog</h3>
          <pre>${JSON.stringify(data.blog, null, 2)}</pre>
        </article>
        <article>
          <h3>Legal</h3>
          <pre>${JSON.stringify(data.legal, null, 2)}</pre>
        </article>
      </div>
    `;
  }
  if (state.adminTab === "inquiries") {
    panel.innerHTML = adminTable(data.inquiries, [
      { label: "ID", render: (lead) => lead.id },
      { label: "Name", render: (lead) => lead.name },
      { label: "Email", render: (lead) => `<a href="mailto:${lead.email}">${lead.email}</a>` },
      { label: "Interest", render: (lead) => lead.interest },
      { label: "Status", render: (lead) => `<span class="status">${lead.status}</span>` },
      { label: "Message", render: (lead) => lead.message }
    ]);
  }
  if (state.adminTab === "raw") {
    panel.innerHTML = `<pre class="raw-data">${JSON.stringify({ ...data, mediaLibrary: media }, null, 2)}</pre>`;
  }
}

function unlockAdmin() {
  byId("adminLock").hidden = true;
  byId("adminDashboard").hidden = false;
  renderMetrics();
  renderAdminPanel();
}

function lockAdmin() {
  sessionStorage.removeItem("phrazsAdminUnlocked");
  byId("adminLock").hidden = false;
  byId("adminDashboard").hidden = true;
  byId("adminPasscode").value = "";
}

function initEvents() {
  byId("heroSearch").addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = byId("searchInput").value;
    state.category = byId("categorySelect").value;
    renderFilterButtons();
    renderListings();
    document.location.hash = "properties";
  });

  byId("quickTags").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tag]");
    if (!button) return;
    byId("searchInput").value = button.dataset.tag;
    state.query = button.dataset.tag;
    renderListings();
    document.location.hash = "properties";
  });

  byId("filterButtons").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.category = button.dataset.filter;
    byId("categorySelect").value = state.category;
    renderFilterButtons();
    renderListings();
  });

  byId("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderListings();
  });

  byId("adminLogin").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = byId("adminEmail").value.trim().toLowerCase();
    const passcode = byId("adminPasscode").value;
    if (email === ADMIN_EMAIL.toLowerCase() && passcode === ADMIN_PASSCODE) {
      sessionStorage.setItem("phrazsAdminUnlocked", "true");
      byId("adminMessage").textContent = "";
      unlockAdmin();
    } else {
      byId("adminMessage").textContent = "That email or passcode is not authorized for admin access.";
    }
  });

  byId("lockAdmin").addEventListener("click", lockAdmin);

  byId("downloadData").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ ...data, mediaLibrary: media }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "phrazs-extracted-data.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  $$(".admin-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      state.adminTab = button.dataset.adminTab;
      $$(".admin-tabs button").forEach((item) => item.classList.toggle("active", item === button));
      renderAdminPanel();
    });
  });

  $("[data-open-auth]").addEventListener("click", () => {
    byId("authModal").hidden = false;
  });

  $("[data-close-auth]").addEventListener("click", () => {
    byId("authModal").hidden = true;
  });

  byId("authModal").addEventListener("click", (event) => {
    if (event.target.id === "authModal") byId("authModal").hidden = true;
  });

  $$(".contact-form, .modal-panel").forEach((form) => {
    form.addEventListener("submit", (event) => event.preventDefault());
  });
}

function init() {
  renderTags();
  renderCategoryOptions();
  renderCategories();
  renderFilterButtons();
  renderListings();
  renderHosts();
  renderTestimonials();
  renderBlog();
  renderMedia();
  initEvents();
  if (sessionStorage.getItem("phrazsAdminUnlocked") === "true") unlockAdmin();
}

init();
