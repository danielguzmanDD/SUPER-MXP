document.addEventListener("DOMContentLoaded", () => {
  const kpiGrid = document.getElementById("kpiGrid");
  const dateInput = document.getElementById("filterDate");
  const emailInput = document.getElementById("filterEmail");
  const periodSelect = document.getElementById("filterPeriod");

  let rawData = [];

  const fetchData = async () => {
    const response = await fetch("https://opensheet.elk.sh/1DeKJrF1_6vm749WTDmsjWS4BdvEMJsQYAQgpmWq0XQE/RD");
    rawData = await response.json();
    filterAndRender();
  };

  const filterAndRender = () => {
    const filterDate = dateInput.value;
    const filterEmail = emailInput.value.toLowerCase();
    const period = periodSelect.value;

    let filtered = rawData.filter(row => {
      const matchesEmail = !filterEmail || (row.Email && row.Email.toLowerCase().includes(filterEmail));
      return matchesEmail;
    });

    if (filterDate) {
      const selectedDate = new Date(filterDate);
      filtered = filtered.filter(row => {
        const rowDate = new Date(row.Date);
        if (period === "day") {
          return rowDate.toDateString() === selectedDate.toDateString();
        } else if (period === "week") {
          const rowWeekStart = new Date(rowDate);
          rowWeekStart.setDate(rowDate.getDate() - rowDate.getDay());
          const selectedWeekStart = new Date(selectedDate);
          selectedWeekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
          return rowWeekStart.toDateString() === selectedWeekStart.toDateString();
        } else if (period === "month") {
          return (
            rowDate.getMonth() === selectedDate.getMonth() &&
            rowDate.getFullYear() === selectedDate.getFullYear()
          );
        }
        return true;
      });
    }

    const aggregate = {
      WorkedCases: 0,
      TTR: 0,
      DWR: 0,
      R2: 0,
      QA: 0,
      ADH: 0,
      count: 0
    };

    filtered.forEach(row => {
      const parseNum = val => parseFloat(val.replace('%','').replace(',','.')) || 0;
      aggregate.WorkedCases += parseNum(row.Cases);
      aggregate.TTR += parseNum(row.TTR);
      aggregate.DWR += parseNum(row.DWR);
      aggregate.R2 += parseNum(row["R+2"]);
      aggregate.QA += parseNum(row.QA);
      aggregate.ADH += parseNum(row.ADH);
      aggregate.count += 1;
    });

    const avg = (val) => aggregate.count ? (val / aggregate.count).toFixed(2) : "N/A";

    const kpis = [
      { title: "Worked Cases", value: aggregate.WorkedCases },
      { title: "TTR (Time To Resolution)", value: avg(aggregate.TTR) + " hrs" },
      { title: "DWR (Did We Resolve)", value: avg(aggregate.DWR) + "%" },
      { title: "R+2 (Repeated Contacts)", value: avg(aggregate.R2) + "%" },
      { title: "QA (Quality Assurance)", value: avg(aggregate.QA) + "%" },
      { title: "ADH (Adherence)", value: avg(aggregate.ADH) + "%" }
    ];

    kpiGrid.innerHTML = "";
    kpis.forEach(kpi => {
      const card = document.createElement("div");
      card.className = "kpi-card";

      const title = document.createElement("div");
      title.className = "kpi-title";
      title.textContent = kpi.title;

      const value = document.createElement("div");
      value.className = "kpi-value";
      value.textContent = kpi.value;

      card.appendChild(title);
      card.appendChild(value);
      kpiGrid.appendChild(card);
    });
  };

  dateInput.addEventListener("change", filterAndRender);
  emailInput.addEventListener("input", filterAndRender);
  periodSelect.addEventListener("change", filterAndRender);

  fetchData();
});
