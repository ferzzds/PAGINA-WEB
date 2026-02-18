const employees = [
  { name: "KENYO HUAMANI AÑARI", type: "Operario" },
  { name: "HECTOR FLORES", type: "Operario" },
  { name: "WALTER SANCHEZ", type: "Operario" },
  { name: "JOSE VELAZCO CARPIO", type: "Operario" },
  { name: "VICTOR NOA TICONA", type: "Operario" },
  { name: "HENRY PODESTAD", type: "Operario" },
  { name: "LUIS MANDRAGULA", type: "Operario" },
  { name: "ANTONIO QUISPE", type: "Operario" },
  { name: "YAFATH", type: "Operario" },
  { name: "EDWIN CHOQUETICO", type: "Administrativo" },
  { name: "CLAUDIA MAMANI", type: "Administrativo" },
  { name: "PATRICIA CONDORI", type: "Administrativo" },
  { name: "JULIO TORRES", type: "Administrativo" },
];

const state = {
  selectedDate: new Date(),
};

const refs = {
  tbody: document.getElementById("attendanceBody"),
  selectedDate: document.getElementById("selectedDate"),
  dayName: document.getElementById("dayName"),
  entryTime: document.getElementById("entryTime"),
  breakTime: document.getElementById("breakTime"),
  exitTime: document.getElementById("exitTime"),
  scheduleNotice: document.getElementById("scheduleNotice"),
  opCount: document.getElementById("opCount"),
  admCount: document.getElementById("admCount"),
  totalCount: document.getElementById("totalCount"),
  extraCount: document.getElementById("extraCount"),
  lateCount: document.getElementById("lateCount"),
  employeeTotal: document.getElementById("employeeTotal"),
  prevDay: document.getElementById("prevDay"),
  nextDay: document.getElementById("nextDay"),
  todayBtn: document.getElementById("todayBtn"),
  markAllEntry: document.getElementById("markAllEntry"),
  markAllExit: document.getElementById("markAllExit"),
};

const rowTemplate = document.getElementById("rowTemplate");

function formatDateLong(date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getSchedule(date) {
  const day = date.getDay();

  if (day === 0) {
    return {
      dayLabel: "Domingo",
      entry: "—",
      break: "Sin jornada",
      exit: "—",
      notice: "Domingo no laborable.",
      isOffday: true,
      lateLimit: null,
    };
  }

  if (day === 6) {
    return {
      dayLabel: "Sábado",
      entry: "08:00",
      break: "Sin refrigerio",
      exit: "13:30",
      notice: "Turno corto de sábado.",
      isOffday: false,
      lateLimit: "08:10",
    };
  }

  return {
    dayLabel: "Lunes a Viernes",
    entry: "08:00",
    break: "13:00 - 14:00",
    exit: "17:30",
    notice: "Horas extras disponibles después del horario regular.",
    isOffday: false,
    lateLimit: "08:10",
  };
}

function timeToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function buildRows() {
  refs.tbody.innerHTML = "";
  employees.forEach((emp, index) => {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");

    row.querySelector(".idx").textContent = index + 1;
    row.querySelector(".name").textContent = emp.name;
    const tag = row.querySelector(".tag");
    tag.textContent = emp.type;
    tag.classList.add(emp.type === "Operario" ? "operario" : "admin");

    [".entry-check", ".break-check", ".exit-check", ".time-input", ".extra-input"].forEach((selector) => {
      row.querySelector(selector).addEventListener("change", () => updateSummary());
    });

    refs.tbody.appendChild(fragment);
  });
  refs.employeeTotal.textContent = employees.length;
}

function updateSchedule() {
  const schedule = getSchedule(state.selectedDate);
  refs.selectedDate.textContent = formatDateLong(state.selectedDate);
  refs.dayName.textContent = schedule.dayLabel;
  refs.entryTime.textContent = schedule.entry;
  refs.breakTime.textContent = schedule.break;
  refs.exitTime.textContent = schedule.exit;
  refs.scheduleNotice.textContent = schedule.notice;

  const disabled = schedule.isOffday;
  refs.tbody.querySelectorAll("tr").forEach((row) => {
    row.querySelectorAll('input[type="checkbox"], input[type="time"], input[type="number"]').forEach((input) => {
      input.disabled = disabled;
      if (disabled) {
        if (input.type === "checkbox") input.checked = false;
        if (input.type === "number") input.value = 0;
      }
    });
  });

  if (disabled) {
    refs.scheduleNotice.textContent = "Domingo no laborable: no se registran marcas.";
  }

  updateSummary();
}

function updateSummary() {
  const schedule = getSchedule(state.selectedDate);
  const rows = [...refs.tbody.querySelectorAll("tr")];

  let op = 0;
  let adm = 0;
  let present = 0;
  let late = 0;
  let extras = 0;

  rows.forEach((row) => {
    const type = row.querySelector(".tag").textContent;
    const entry = row.querySelector(".entry-check").checked;
    const lunch = row.querySelector(".break-check").checked;
    const exit = row.querySelector(".exit-check").checked;
    const time = row.querySelector(".time-input").value;
    const extraValue = Number(row.querySelector(".extra-input").value || 0);
    const status = row.querySelector(".status");

    extras += extraValue;

    if (!entry && !lunch && !exit) {
      status.textContent = "Ausente";
      status.className = "status";
      return;
    }

    if (entry || lunch || exit) {
      present += 1;
      if (type === "Operario") op += 1;
      else adm += 1;
    }

    if (entry && exit && lunch) {
      status.textContent = "Completo";
      status.className = "status full";
    } else {
      status.textContent = "Parcial";
      status.className = "status partial";
    }

    if (entry && schedule.lateLimit && timeToMinutes(time) > timeToMinutes(schedule.lateLimit)) {
      status.textContent = "Tarde";
      status.className = "status late";
      late += 1;
    }

    if (entry && !schedule.lateLimit) {
      status.textContent = "Presente";
      status.className = "status present";
    }
  });

  refs.opCount.textContent = `${op}/9`;
  refs.admCount.textContent = `${adm}/4`;
  refs.totalCount.textContent = `${present}/13`;
  refs.extraCount.textContent = extras;
  refs.lateCount.textContent = late;
}

refs.prevDay.addEventListener("click", () => {
  const next = new Date(state.selectedDate);
  next.setDate(next.getDate() - 1);
  state.selectedDate = next;
  updateSchedule();
});

refs.nextDay.addEventListener("click", () => {
  const next = new Date(state.selectedDate);
  next.setDate(next.getDate() + 1);
  state.selectedDate = next;
  updateSchedule();
});

refs.todayBtn.addEventListener("click", () => {
  state.selectedDate = new Date();
  updateSchedule();
});

refs.markAllEntry.addEventListener("click", () => {
  refs.tbody.querySelectorAll(".entry-check:not(:disabled)").forEach((el) => {
    el.checked = true;
  });
  updateSummary();
});

refs.markAllExit.addEventListener("click", () => {
  refs.tbody.querySelectorAll(".exit-check:not(:disabled)").forEach((el) => {
    el.checked = true;
  });
  refs.tbody.querySelectorAll(".break-check:not(:disabled)").forEach((el) => {
    el.checked = true;
  });
  updateSummary();
});

buildRows();
updateSchedule();
