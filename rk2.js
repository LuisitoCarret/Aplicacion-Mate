function parseFunction(equation) {
  return (x, y) => {
    try {
      return math.evaluate(equation, { x, y });
    } catch (e) {
      alert("Error en la ecuación: " + e.message);
      throw e;
    }
  };
}

function redondear(num) {
  if (Math.abs(num) === Infinity) {
    return '∞';
  }
  return parseFloat(num.toFixed(4));
}

// ✅ Método RK2 (Heun) con error absoluto bien calculado
function rungeKutta2(f, x0, y0, h, xFinal, exactFunc = null) {
  const results = [];
  let x = x0, y = y0, i = 0;

  while (x <= xFinal + 1e-8) {
    const k1 = f(x, y);
    const k2 = f(x + h, y + h * k1);
    const yNextRaw = y + (h / 2) * (k1 + k2);

    let yRealRaw = "";
    let errorRaw = "";
    if (exactFunc) {
      try {
        const xNext = x + h;
        yRealRaw = exactFunc(xNext);
        errorRaw = Math.abs(yRealRaw - yNextRaw);
      } catch (e) {
        yRealRaw = "";
        errorRaw = "";
      }
    }

    results.push({
      i,
      x: redondear(x),
      y: Number(y).toFixed(5),
      yNext: Number(yNextRaw).toFixed(5),
      yReal: yRealRaw !== "" ? Number(yRealRaw).toFixed(5) : "",
      error: errorRaw !== "" ? Number(errorRaw).toFixed(5) : ""
    });

    y = yNextRaw;
    x = redondear(x + h);
    i++;
  }

  return results;
}

// ✅ Mostrar tabla con columnas completas
function mostrarTabla(data) {
  let html = '<h3>Tabla de Resultados</h3><table><tr><th>i</th><th>xᵢ</th><th>yᵢ</th><th>yᵢ₊₁</th><th>y real</th><th>Error abs</th></tr>';

  data.forEach(p => {
    html += `<tr>
      <td>${p.i}</td>
      <td>${p.x}</td>
      <td>${p.y}</td>
      <td>${p.yNext}</td>
      <td>${p.yReal}</td>
      <td>${p.error}</td>
    </tr>`;
  });

  html += '</table>';
  document.getElementById('tablaResultados').innerHTML = html;
}

// ✅ Gráfica con tooltip y error absoluto
function graficar(data) {
  const ctx = document.getElementById('graph').getContext('2d');
  if (window.miGrafica) window.miGrafica.destroy();

  const xs = data.map(p => parseFloat((p.x + parseFloat(document.getElementById('h').value.replace(",", "."))).toFixed(4)));
  const ysAprox = data.map(p => parseFloat(p.yNext)); // ✅ yᵢ₊₁ (valor correcto)
  const ysReal = data.every(p => p.yReal !== "") ? data.map(p => parseFloat(p.yReal)) : null;
  const errores = data.every(p => p.error !== "") ? data.map(p => parseFloat(p.error)) : null;

  const datasets = [
    {
      label: "y(x) aproximado",
      data: ysAprox,
      borderColor: "green",
      fill: false,
      tension: 0.1,
      yAxisID: 'y'
    }
  ];

  if (ysReal) {
    datasets.push({
      label: "y real",
      data: ysReal,
      borderColor: "black",
      borderDash: [5, 5],
      fill: false,
      tension: 0.1,
      yAxisID: 'y'
    });
  }

  if (errores) {
    datasets.push({
      label: "Error absoluto",
      data: errores,
      borderColor: "red",
      fill: false,
      tension: 0.1,
      pointRadius: 3,
      yAxisID: 'error'
    });
  }

  window.miGrafica = new Chart(ctx, {
    type: "line",
    data: {
      labels: xs,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = parseFloat(context.raw).toFixed(5);
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: "x" } },
        y: {
          title: { display: true, text: "y" },
          position: "left"
        },
        error: {
          title: { display: true, text: "Error absoluto" },
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { color: "red" }
        }
      }
    }
  });
}

// ✅ Lógica principal con coma o punto para h
function calcular() {
  const eq = document.getElementById('equation').value.trim();
  const exactRaw = document.getElementById('exactSolution').value.trim();
  const x0 = parseFloat(document.getElementById('x0').value);
  const y0 = parseFloat(document.getElementById('y0').value);

  const hRaw = document.getElementById('h').value.trim().replace(",", ".");
  const h = parseFloat(hRaw);
  const xFinal = parseFloat(document.getElementById('xFinal').value);

  if (eq === "") {
    alert("Por favor, ingresa una ecuación.");
    return;
  }

  if (isNaN(x0) || isNaN(y0) || isNaN(h) || isNaN(xFinal)) {
    alert("Por favor completa todos los campos numéricos con valores válidos.");
    return;
  }

  try {
    const f = parseFunction(eq);
    let exactFunc = null;

    if (exactRaw !== "") {
      exactFunc = (x) => math.evaluate(exactRaw, { x });
    }

    const resultados = rungeKutta2(f, x0, y0, h, xFinal, exactFunc);
    mostrarTabla(resultados);
    graficar(resultados);
  } catch (error) {
    console.error(error);
  }
}
