const stays = [
  {
    id: 1,
    name: "Daku Tidefront Villa",
    area: "General Luna",
    type: "Private Villa",
    price: 8900,
    rating: 4.92,
    image: "assets/villa.png",
    summary: "A quiet villa with direct beach access, outdoor shower, and breakfast for two.",
    amenities: ["Beach access", "Breakfast", "Airport pickup", "Aircon"],
  },
  {
    id: 2,
    name: "Cloud 9 Surf Loft",
    area: "Cloud 9",
    type: "Surf",
    price: 4200,
    rating: 4.86,
    image: "assets/surf-loft.png",
    summary: "Compact loft near the boardwalk with board racks, fast Wi-Fi, and scooter parking.",
    amenities: ["Board racks", "Wi-Fi", "Scooter parking", "Cafe nearby"],
  },
  {
    id: 3,
    name: "Pacifico Palm Rooms",
    area: "Pacifico",
    type: "Beachfront",
    price: 3600,
    rating: 4.75,
    image: "assets/palm-rooms.png",
    summary: "Simple beachfront rooms for slow mornings, reef walks, and quieter north-island days.",
    amenities: ["Beachfront", "Fan room", "Shared kitchen", "Laundry"],
  },
  {
    id: 4,
    name: "Dapa Dockside Inn",
    area: "Dapa",
    type: "Budget",
    price: 1800,
    rating: 4.61,
    image: "assets/dockside.png",
    summary: "Budget-friendly private room close to the port, market, and early island transfers.",
    amenities: ["Private room", "Near port", "Hot shower", "Market nearby"],
  },
  {
    id: 5,
    name: "Tourism Road Studio",
    area: "General Luna",
    type: "Budget",
    price: 2700,
    rating: 4.69,
    image: "assets/studio.png",
    summary: "Walkable studio near restaurants, surf schools, and nightlife without needing a motorbike.",
    amenities: ["Kitchenette", "Walkable", "Aircon", "Self check-in"],
  },
  {
    id: 6,
    name: "Secret Beach Casita",
    area: "General Luna",
    type: "Beachfront",
    price: 6200,
    rating: 4.88,
    image: "assets/casita.png",
    summary: "A breezy casita for couples, with garden seating and quick tricycle access to town.",
    amenities: ["Garden", "Beach path", "Queen bed", "Concierge"],
  },
];

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const state = {
  type: "all",
  area: "all",
  budget: "all",
  guests: 2,
  selectedStay: null,
  piUser: null,
  piReady: false,
};

const stayList = document.querySelector("#stayList");
const resultCount = document.querySelector("#resultCount");
const areaFilter = document.querySelector("#areaFilter");
const budgetFilter = document.querySelector("#budgetFilter");
const guestCount = document.querySelector("#guestCount");
const checkIn = document.querySelector("#checkIn");
const checkOut = document.querySelector("#checkOut");
const bookingSheet = document.querySelector("#bookingSheet");
const confirmationText = document.querySelector("#confirmationText");
const piConnect = document.querySelector("#piConnect");

const PI_SANDBOX = true;
const PI_DEPOSIT_AMOUNT = 1;

function setupDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + 3);
  checkIn.value = toDateInput(tomorrow);
  checkOut.value = toDateInput(nextDay);
  checkIn.min = toDateInput(today);
  checkOut.min = toDateInput(tomorrow);
}

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function getNights() {
  const start = new Date(checkIn.value);
  const end = new Date(checkOut.value);
  const difference = end - start;
  return Math.max(1, Math.round(difference / 86400000));
}

function applyFilters() {
  return stays.filter((stay) => {
    const typeMatch = state.type === "all" || stay.type === state.type;
    const areaMatch = state.area === "all" || stay.area === state.area;
    const budgetMatch = state.budget === "all" || stay.price <= Number(state.budget);
    return typeMatch && areaMatch && budgetMatch;
  });
}

function renderStays() {
  const filtered = applyFilters();
  resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "stay" : "stays"} found`;

  if (!filtered.length) {
    stayList.innerHTML = '<div class="empty-state">No stays match those filters. Try another area or budget.</div>';
    return;
  }

  stayList.innerHTML = filtered
    .map(
      (stay) => `
        <article class="stay-card">
          <img src="${stay.image}" alt="${stay.name} in ${stay.area}" loading="lazy">
          <div class="stay-card-body">
            <div class="rating-row">
              <span class="tag">${stay.type}</span>
              <span class="rating">${stay.rating.toFixed(2)} rating</span>
            </div>
            <h3>${stay.name}</h3>
            <p class="muted">${stay.area} - ${stay.summary}</p>
            <div class="stay-card-footer">
              <div class="price">${peso.format(stay.price)} <small>/ night</small></div>
              <button class="book-button" data-book="${stay.id}">View</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function openSheet(stay) {
  state.selectedStay = stay;
  confirmationText.hidden = true;
  confirmationText.classList.remove("success");
  document.querySelector("#sheetImage").src = stay.image;
  document.querySelector("#sheetImage").alt = stay.name;
  document.querySelector("#sheetArea").textContent = `${stay.area} - ${stay.type}`;
  document.querySelector("#sheetTitle").textContent = stay.name;
  document.querySelector("#sheetDescription").textContent = stay.summary;
  document.querySelector("#sheetAmenities").innerHTML = stay.amenities.map((item) => `<span>${item}</span>`).join("");
  updatePriceBreakdown(stay);
  bookingSheet.classList.add("is-open");
  bookingSheet.setAttribute("aria-hidden", "false");
}

function updatePriceBreakdown(stay) {
  const nights = getNights();
  const subtotal = stay.price * nights;
  const fee = Math.round(subtotal * 0.08);
  document.querySelector("#sheetRate").textContent = peso.format(stay.price);
  document.querySelector("#sheetNights").textContent = String(nights);
  document.querySelector("#sheetFee").textContent = peso.format(fee);
  document.querySelector("#sheetTotal").textContent = peso.format(subtotal + fee);
}

function closeSheet() {
  bookingSheet.classList.remove("is-open");
  bookingSheet.setAttribute("aria-hidden", "true");
}

function initPi() {
  if (!window.Pi) {
    setPiButton("Pi Browser");
    return;
  }

  try {
    window.Pi.init({ version: "2.0", sandbox: PI_SANDBOX });
    state.piReady = true;
  } catch (error) {
    showPaymentMessage("Pi SDK could not initialize. Open this app inside Pi Browser.", false);
  }
}

function setPiButton(label) {
  piConnect.textContent = label;
}

function showPaymentMessage(message, success = false) {
  confirmationText.hidden = false;
  confirmationText.textContent = message;
  confirmationText.classList.toggle("success", success);
}

function onIncompletePaymentFound(payment) {
  if (!payment || !payment.identifier) return;

  if (payment.transaction && payment.transaction.txid) {
    completePiPayment(payment.identifier, payment.transaction.txid).catch(() => {
      showPaymentMessage("Found a pending Pi payment. Backend completion is still needed.", false);
    });
  } else {
    showPaymentMessage("Found a pending Pi payment. Please finish or cancel it in Pi Browser.", false);
  }
}

async function connectPiAccount() {
  if (!state.piReady || !window.Pi) {
    showPaymentMessage("Open this app inside Pi Browser to connect your Pi account.", false);
    return null;
  }

  const auth = await window.Pi.authenticate(["username", "payments"], onIncompletePaymentFound);
  state.piUser = auth.user;
  setPiButton(`@${auth.user.username}`);
  return auth;
}

async function approvePiPayment(paymentId) {
  const response = await fetch("/api/pi/payments/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });

  if (!response.ok) throw new Error("Payment approval failed");
  return response.json();
}

async function completePiPayment(paymentId, txid) {
  const response = await fetch("/api/pi/payments/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, txid }),
  });

  if (!response.ok) throw new Error("Payment completion failed");
  return response.json();
}

async function reserveWithPi() {
  const stay = state.selectedStay;
  if (!stay) return;

  try {
    if (!state.piUser) await connectPiAccount();
    if (!state.piUser) return;

    showPaymentMessage("Opening Pi payment approval...", false);
    const paymentData = {
      amount: PI_DEPOSIT_AMOUNT,
      memo: `Reservation deposit for ${stay.name}`,
      metadata: {
        stayId: stay.id,
        stayName: stay.name,
        checkIn: checkIn.value,
        checkOut: checkOut.value,
        guests: state.guests,
        nights: getNights(),
      },
    };

    const paymentCallbacks = {
      onReadyForServerApproval: approvePiPayment,
      onReadyForServerCompletion: completePiPayment,
      onCancel: () => showPaymentMessage("Pi payment was canceled.", false),
      onError: () => showPaymentMessage("Pi payment did not complete. Please try again.", false),
    };

    await window.Pi.createPayment(paymentData, paymentCallbacks);
    showPaymentMessage(`Reservation request sent for ${stay.name}.`, true);
  } catch (error) {
    showPaymentMessage(error.message || "Pi payment is unavailable right now.", false);
  }
}

document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const start = new Date(checkIn.value);
  const end = new Date(checkOut.value);
  if (end <= start) {
    checkOut.setCustomValidity("Check out must be after check in.");
    checkOut.reportValidity();
    return;
  }
  checkOut.setCustomValidity("");
  state.area = areaFilter.value;
  state.budget = budgetFilter.value;
  state.guests = Number(guestCount.value);
  renderStays();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((item) => item.classList.remove("is-active"));
    chip.classList.add("is-active");
    state.type = chip.dataset.type;
    renderStays();
  });
});

stayList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book]");
  if (!button) return;
  const stay = stays.find((item) => item.id === Number(button.dataset.book));
  openSheet(stay);
});

document.querySelectorAll("[data-close-sheet]").forEach((button) => {
  button.addEventListener("click", closeSheet);
});

document.querySelector("#resetFilters").addEventListener("click", () => {
  state.type = "all";
  state.area = "all";
  state.budget = "all";
  areaFilter.value = "all";
  budgetFilter.value = "all";
  document.querySelectorAll(".chip").forEach((item) => item.classList.toggle("is-active", item.dataset.type === "all"));
  renderStays();
});

document.querySelector("#confirmBooking").addEventListener("click", () => {
  reserveWithPi();
});

piConnect.addEventListener("click", () => {
  connectPiAccount().catch(() => {
    showPaymentMessage("Pi sign-in did not complete.", false);
  });
});

checkIn.addEventListener("change", () => {
  const minimumCheckout = new Date(checkIn.value);
  minimumCheckout.setDate(minimumCheckout.getDate() + 1);
  checkOut.min = toDateInput(minimumCheckout);
  if (new Date(checkOut.value) <= new Date(checkIn.value)) {
    checkOut.value = toDateInput(minimumCheckout);
  }
  if (state.selectedStay) updatePriceBreakdown(state.selectedStay);
});

checkOut.addEventListener("change", () => {
  if (state.selectedStay) updatePriceBreakdown(state.selectedStay);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSheet();
});

setupDates();
initPi();
renderStays();
