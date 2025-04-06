function insert(targetId, text) {
  const input = document.getElementById(targetId);
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const current = input.value;
  input.value = current.substring(0, start) + text + current.substring(end);
  input.focus();
  input.setSelectionRange(start + text.length, start + text.length);
}

let campoActivo = null;

document.getElementById("equation").addEventListener("focus", () => campoActivo = "equation");
document.getElementById("exactSolution").addEventListener("focus", () => campoActivo = "exactSolution");

function insertSymbol(symbol) {
  const campo = document.getElementById(campoActivo);
  if (campo) {
    const start = campo.selectionStart;
    const end = campo.selectionEnd;
    const texto = campo.value;
    campo.value = texto.substring(0, start) + symbol + texto.substring(end);
    campo.focus();
    campo.selectionStart = campo.selectionEnd = start + symbol.length;
  }
}

function borrar() {
  const campo = document.getElementById(campoActivo);
  if (campo) {
    const start = campo.selectionStart;
    const end = campo.selectionEnd;
    const texto = campo.value;
    if (start === end && start > 0) {
      campo.value = texto.substring(0, start - 1) + texto.substring(end);
      campo.selectionStart = campo.selectionEnd = start - 1;
    } else {
      campo.value = texto.substring(0, start) + texto.substring(end);
      campo.selectionStart = campo.selectionEnd = start;
    }
    campo.focus();
  }
}

// ... aquí va todo tu código ya existente de cálculo (parseFunction, rungeKutta2, mostrarTabla, graficar, calcular)
// Puedes dejarlo tal como lo tenías en tu `rk2.js`, solo agrega esta parte de arriba al inicio del archivo.


function parseFunction(equation) {
  return (x, y) => {
    return math.evaluate(equation, { x, y }); // ❌ sin alert, deja que el error se propague
  };
}


function redondear(num) {
  if (!isFinite(num)) return '∞';
  return parseFloat(num.toFixed(4));
}

function rungeKutta2(f, x0, y0, h, xFinal, exactFunc = null) {
  const results = [];
  let x = x0, y = y0, i = 0;

  while (x <= xFinal + 1e-8) {
    const k1 = f(x, y);
    const k2 = f(x + h, y + h * k1);
    if (!isFinite(k1) || !isFinite(k2)) {
      alert(`⚠️ Cálculo inválido en la iteración ${i}`);
      break;
    }

    const yNextRaw = y + (h / 2) * (k1 + k2);

    let yRealRaw = "", errorRaw = "";
    if (exactFunc) {
      try {
        const xNext = x + h;
        yRealRaw = exactFunc(xNext);
        if (!isFinite(yRealRaw)) throw new Error("yReal no válido");
        errorRaw = Math.abs(yRealRaw - yNextRaw);
      } catch {
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

function graficar(data) {
  const ctx = document.getElementById('graph').getContext('2d');
  if (window.miGrafica) window.miGrafica.destroy();

  const h = parseFloat(document.getElementById('h').value.replace(",", "."));
  const xs = data.map(p => parseFloat((p.x + h).toFixed(4)));
  const ysAprox = data.map(p => parseFloat(p.yNext));
  const ysReal = data.every(p => p.yReal !== "") ? data.map(p => parseFloat(p.yReal)) : null;
  const errores = data.every(p => p.error !== "") ? data.map(p => parseFloat(p.error)) : null;

  const datasets = [
    { label: "y(x) aproximado", data: ysAprox, borderColor: "green", fill: false, tension: 0.1, yAxisID: 'y' }
  ];

  if (ysReal) datasets.push({ label: "y real", data: ysReal, borderColor: "black", borderDash: [5, 5], fill: false, tension: 0.1, yAxisID: 'y' });
  if (errores) datasets.push({ label: "Error absoluto", data: errores, borderColor: "red", fill: false, tension: 0.1, pointRadius: 3, yAxisID: 'error' });

  window.miGrafica = new Chart(ctx, {
    type: "line",
    data: { labels: xs, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const value = parseFloat(context.raw).toFixed(5);
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: "x" } },
        y: { title: { display: true, text: "y" }, position: "left" },
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

function calcular() {
  const eq = document.getElementById('equation').value.trim();
  const exactRaw = document.getElementById('exactSolution').value.trim();
  const x0 = document.getElementById('x0').value.trim();
  const y0 = document.getElementById('y0').value.trim();
  const hRaw = document.getElementById('h').value.trim().replace(",", ".");
  const xFinal = document.getElementById('xFinal').value.trim();

  const numRegex = /^-?\d+(\.\d+)?$/;
  if (!numRegex.test(x0) || !numRegex.test(y0) || !numRegex.test(hRaw) || !numRegex.test(xFinal)) {
    alert("⚠️ Los campos numéricos no deben contener letras ni estar vacíos.");
    return;
  }

  const x0Val = parseFloat(x0);
  const y0Val = parseFloat(y0);
  const h = parseFloat(hRaw);
  const xFinalVal = parseFloat(xFinal);

  if (x0Val === 0 && y0Val === 0 && h === 0) {
    alert("⚠️ No puedes ingresar x₀, y₀ y h todos en cero.");
    return;
  }

  if (h <= 0) {
    alert("⚠️ El paso h debe ser mayor que 0.");
    return;
  }

  if (xFinalVal <= x0Val) {
    alert("⚠️ x final debe ser mayor que x₀.");
    return;
  }

  if ((xFinalVal - x0Val) / h > 1000) {
    alert("⚠️ El número de pasos sería demasiado alto.");
    return;
  }

  const validCharsEq = /^[0-9+\-*/^(). xye]*$/i;
  if (!validCharsEq.test(eq)) {
    alert("⚠️ La ecuación contiene caracteres no válidos.");
    return;
  }

  const exprSinEspacios = eq.replace(/\s+/g, "");
  if (/^[-+]?\d+(\.\d+)?$/.test(exprSinEspacios)) {
    alert("⚠️ La ecuación no puede ser una constante.");
    return;
  }

  if (!/[xy]/i.test(exprSinEspacios)) {
    alert("⚠️ La ecuación debe depender de x o y.");
    return;
  }

  if (exactRaw !== "" && !validCharsEq.test(exactRaw)) {
    alert("⚠️ La solución exacta contiene caracteres no válidos.");
    return;
  }

  try {
    const f = parseFunction(eq);
    let exactFunc = null;
  
    if (exactRaw !== "") {
      try {
        const prueba = math.evaluate(exactRaw, { x: 1 });
        if (!isFinite(prueba)) throw new Error("Solución exacta inválida");
        exactFunc = (x) => math.evaluate(exactRaw, { x });
      } catch (e) {
        if (e.message.includes("Undefined symbol")) {
          alert("⚠️ La solución exacta contiene símbolos no válidos o no definidos.");
        } else {
          alert("⚠️ Error en la solución exacta: " + e.message);
        }
        return;
      }
    }
  
    const resultados = rungeKutta2(f, x0Val, y0Val, h, xFinalVal, exactFunc);
    mostrarTabla(resultados);
    graficar(resultados);
  
  } catch (error) {
    if (error.message.includes("Undefined symbol")) {
      alert("⚠️ La ecuación contiene símbolos no válidos o no definidos. Usa solo x, y, e, operadores y funciones.");
    } else {
      alert("⚠️ Hubo un error al calcular: " + error.message);
    }
    console.error(error);
  }
  
}
