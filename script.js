
let rawData = [];
let chart;

document.addEventListener("DOMContentLoaded", () => {
  const kpiGrid = document.getElementById("kpiGrid");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const emailDropdown = document.getElementById("emailDropdown");

  const fetchData = async () => {
    const response = await fetch("https://opensheet.elk.sh/1DeKJrF1_6vm749WTDmsjWS4BdvEMJsQYAQgpmWq0XQE/RD");
    rawData = await response.json();
    populateDropdown(rawData);
    renderKPIs(rawData); // Initial team-wide view
  };

  
const populateDropdown = (data) => {
  const firstRow = data[0] || {};
  const emailKey = Object.keys(firstRow).find(k =>
    k.toLowerCase().includes("email") || k.toLowerCase().includes("correo")
  );

  if (!emailKey) {
    console.error("No email-like column found in sheet data.");
    return;
  }

  const emails = [...new Set(data.map(row => row[emailKey]).filter(Boolean))];
  emails.sort();

  const dropdown = document.getElementById("emailDropdown");
  dropdown.innerHTML = '<option value="">-- All --</option>';

  emails.forEach(email => {
    const option = document.createElement("option");
    option.value = email;
    option.textContent = email;
    dropdown.appendChild(option);
  });
}

    const emails = [...new Set(data.map(row => row.Email).filter(Boolean))];
    emails.sort();
    emails.forEach(email => {
      const option = document.createElement("option");
      option.value = email;
      option.textContent = email;
      emailDropdown.appendChild(option);
    });
  };

  const parseDate = (str) => new Date(str + "T00:00:00");

  const filterData = () => {
    let data = rawData;
    const email = emailDropdown.value;
    const from = startDate.value ? parseDate(startDate.value) : null;
    const to = endDate.value ? parseDate(endDate.value) : null;

    if (email) {
      data = data.filter(row => row.Email === email);
    }

    if (from) {
      data = data.filter(row => parseDate(row.Date) >= from);
    }

    if (to) {
      data = data.filter(row => parseDate(row.Date) <= to);
    }

    return data;
  };

  const renderKPIs = (data) => {
    const kpiGrid = document.getElementById("kpiGrid");
    const aggregate = {
      WorkedCases: 0,
      TTR: 0,
      DWR: 0,
      R2: 0,
      QA: 0,
      ADH: 0,
      count: 0
    };

    data.forEach(row => {
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

    renderChart(kpis);
  };

  const renderChart = (kpis) => {
    const ctx = document.getElementById('kpiChart').getContext('2d');
    const labels = kpis.map(k => k.title);
    const values = kpis.map(k => parseFloat(k.value.replace(/[^0-9.]/g, '')) || 0);

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'KPI Values',
          data: values,
          backgroundColor: '#ff3008',
          borderColor: '#ff5333',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#fff'
            }
          },
          x: {
            ticks: {
              color: '#fff'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          }
        }
      }
    });
  };

  document.getElementById("downloadCSV").addEventListener("click", () => {
    exportToCSV(filterData());
  });

  [startDate, endDate, emailDropdown].forEach(input => {
    input.addEventListener("change", () => {
      const filtered = filterData();
      renderKPIs(filtered);
    });
  });

  const exportToCSV = (data) => {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    data.forEach(row => {
      const values = headers.map(h => JSON.stringify(row[h] || ""));
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], {{ type: 'text/csv' }});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'kpi_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  fetchData();
});
