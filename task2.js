
const MAX_SELECTED = 6;
const ROW_COUNT = 5;
const SEATS_PER_ROW = 8;

const PRICES = {
  standard: 2000,
  premium: 3000,
  vip: 4000
};

const ROW_LABELS = ["A", "B", "C", "D", "E"];

const BOOKED_SEATS = ["A3", "B5", "C2", "D6", "E1", "E7"];

const seatMap = document.getElementById("seat-map");
const zoneFilter = document.getElementById("zone-filter");
const selectedSeatsText = document.getElementById("selected-seats");
const seatCountText = document.getElementById("seat-count");
const totalPriceText = document.getElementById("total-price");
const messageText = document.getElementById("message");
const bestSeatsButton = document.getElementById("best-seats");
const clearSeatsButton = document.getElementById("clear-seats");

let selectedSeats = [];
let currentFilter = "all";
let seats = [];

function createSeats() {
  const result = [];

  for (let row = 0; row < ROW_COUNT; row++) {
    const seatRow = [];

    for (let number = 1; number <= SEATS_PER_ROW; number++) {
      const id = ROW_LABELS[row] + number;

      let zone;

      if (row < 2) {
        zone = "standard";
      } else if (row < 4) {
        zone = "premium";
      } else {
        zone = "vip";
      }

      const seat = {
        id: id,
        row: ROW_LABELS[row],
        number: number,
        zone: zone,
        price: PRICES[zone],
        booked: BOOKED_SEATS.includes(id),
        selected: false
      };

      seatRow.push(seat);
    }

    result.push(seatRow);
  }

  return result;
}

function findSeat(id) {
  for (const row of seats) {
    for (const seat of row) {
      if (seat.id === id) {
        return seat;
      }
    }
  }

  return null;
}

function showMessage(text, type = "info") {
  messageText.textContent = text;
  messageText.className = type;
}

function calculateTotal() {
  let total = 0;

  for (const row of seats) {
    for (const seat of row) {
      if (seat.selected) {
        total += seat.price;
      }
    }
  }

  return total;
}

function updateBooking() {
  const total = calculateTotal();

  seatCountText.textContent = selectedSeats.length;

  totalPriceText.textContent =
    total.toLocaleString("en-US") + " ₸";

  if (selectedSeats.length === 0) {
    selectedSeatsText.textContent = "No seats selected";
  } else {
    selectedSeatsText.textContent =
      "Selected seats: " + selectedSeats.join(", ");
  }
}

function render() {
  seatMap.replaceChildren();

  let visibleCount = 0;

  for (const row of seats) {
    const rowElement = document.createElement("div");
    rowElement.className = "seat-row";

    const rowLabel = document.createElement("span");
    rowLabel.className = "row-label";
    rowLabel.textContent = row[0].row;

    rowElement.appendChild(rowLabel);

    for (const seat of row) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "seat";
      button.dataset.id = seat.id;
      button.textContent = seat.number;

      button.classList.add(seat.zone);

      if (seat.booked) {
        button.classList.add("booked");
        button.disabled = true;
      }

      if (seat.selected) {
        button.classList.add("selected");
      }

      const matchesFilter =
        currentFilter === "all" ||
        seat.zone === currentFilter;

      if (!matchesFilter) {
        button.disabled = true;
        button.classList.add("filtered-out");
        button.setAttribute("aria-hidden", "true");
      } else {
        visibleCount++;
      }

      button.setAttribute(
        "aria-label",
        `${seat.id}, ${seat.zone}, ${seat.price} tenge, ${
          seat.booked ? "booked" :
          seat.selected ? "selected" : "available"
        }`
      );

      button.setAttribute(
        "aria-pressed",
        String(seat.selected)
      );

      rowElement.appendChild(button);
    }

    seatMap.appendChild(rowElement);
  }

  updateBooking();
  bestSeatsButton.disabled = selectedSeats.length >= MAX_SELECTED;

  if (visibleCount === 0) {
    showMessage("No seats found for this filter.", "error");
  }
}

function selectSeat(id) {
  const seat = findSeat(id);

  if (!seat) {
    showMessage("Seat not found.", "error");
    return;
  }

  if (seat.booked) {
    showMessage("This seat is already booked.", "error");
    return;
  }

  if (currentFilter !== "all" && seat.zone !== currentFilter) {
    showMessage("This seat is outside the selected zone.", "error");
    return;
  }

  if (seat.selected) {
    seat.selected = false;
    selectedSeats = selectedSeats.filter(item => item !== id);

    showMessage(`Seat ${id} removed.`, "info");
    render();
    return;
  }

  if (selectedSeats.length >= MAX_SELECTED) {
    showMessage(
      `You can select a maximum of ${MAX_SELECTED} seats.`,
      "error"
    );
    return;
  }

  seat.selected = true;
  selectedSeats.push(id);

  showMessage(`Seat ${id} selected!`, "success");
  render();
}

function findBestSeats() {
  const needed = MAX_SELECTED - selectedSeats.length;

  if (needed <= 0) {
    showMessage("Maximum number of seats selected.", "error");
    return;
  }

  let bestGroup = [];
  let bestScore = Infinity;

  const centerColumn = (SEATS_PER_ROW + 1) / 2;
  const centerRow = (ROW_COUNT - 1) / 2;

  for (let rowIndex = 0; rowIndex < seats.length; rowIndex++) {
    const row = seats[rowIndex];

    if (
      currentFilter !== "all" &&
      row[0].zone !== currentFilter
    ) {
      continue;
    }

    for (let start = 0; start < row.length; start++) {
      const group = [];

      for (
        let index = start;
        index < row.length && group.length < needed;
        index++
      ) {
        const seat = row[index];

        if (seat.booked || seat.selected) {
          break;
        }

        group.push(seat);
      }

      if (group.length === 0) {
        continue;
      }

      const groupCenter =
        (group[0].number + group[group.length - 1].number) / 2;

      const score =
        Math.abs(groupCenter - centerColumn) +
        Math.abs(rowIndex - centerRow);

      if (
        group.length > bestGroup.length ||
        (group.length === bestGroup.length && score < bestScore)
      ) {
        bestGroup = group;
        bestScore = score;
      }
    }
  }

  if (bestGroup.length === 0) {
    showMessage("No suitable free seats found.", "error");
    return;
  }

  for (const seat of bestGroup) {
    seat.selected = true;
    selectedSeats.push(seat.id);
  }

  if (bestGroup.length < needed) {
    showMessage(
      `Only ${bestGroup.length} adjacent seats were available.`,
      "info"
    );
  } else {
    showMessage("Best available seats selected!", "success");
  }

  render();
}

function clearSelection() {
  for (const row of seats) {
    for (const seat of row) {
      seat.selected = false;
    }
  }

  selectedSeats = [];

  showMessage("Selection cleared.", "info");
  render();
}

seatMap.addEventListener("click", function(event) {
  const button = event.target.closest("button[data-id]");

  if (!button || !seatMap.contains(button)) {
    return;
  }

  selectSeat(button.dataset.id);
});

zoneFilter.addEventListener("change", function(event) {
  currentFilter = event.target.value;

  showMessage("Filter updated.", "info");
  render();
});

bestSeatsButton.addEventListener("click", findBestSeats);

clearSeatsButton.addEventListener("click", clearSelection);

seats = createSeats();

showMessage("Select up to 6 seats.", "info");
render();
