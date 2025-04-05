// Convierte una cadena en una función evaluable usando math.js
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
  
  // Redondea a 4 decimales y evita "Infinity"
function redondear(num) {
    if (Math.abs(num) === Infinity) {
      return '∞'; // En lugar de mostrar infinito, lo mostramos como un string "∞"
    }
    return parseFloat(num.toFixed(4)); // Redondea a 4 decimales
  }
  
  // Implementación del método Runge-Kutta de segundo orden (Heun)
  function rungeKutta2(f, x0, y0, h, xFinal) {
    const results = [];
    let x = x0, y = y0, i = 0;
  
    while (x <= xFinal + 1e-8) {
      const k1 = f(x, y);
      const k2 = f(x + h, y + h * k1);
      const yNext = y + (h / 2) * (k1 + k2);
  
      results.push({
        i,
        x: redondear(x),
        y: redondear(y),
        yNext: redondear(yNext)
      });
  
      y = yNext;
      x = redondear(x + h);
      i++;
    }
  
    return results;
  }
  
  // Muestra una tabla con los resultados de cada iteración
  function mostrarTabla(data) {
    let html = '<h3>Tabla de Resultados</h3><table><tr><th>i</th><th>xᵢ</th><th>yᵢ</th><th>yᵢ₊₁</th></tr>';
  
    data.forEach(p => {
      html += `<tr>
        <td>${p.i}</td>
        <td>${p.x.toFixed(4)}</td>
        <td>${p.y.toFixed(4)}</td>
        <td>${p.yNext.toFixed(4)}</td>
      </tr>`;
    });
  
    html += '</table>';
    document.getElementById('tablaResultados').innerHTML = html;
  }
  
  // Genera una gráfica de la solución y(x)
  function graficar(data) {
    const ctx = document.getElementById('graph').getContext('2d');
    if (window.miGrafica) window.miGrafica.destroy();
  
    window.miGrafica = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(p => p.x.toFixed(4)),
        datasets: [{
          label: 'y(x)',
          data: data.map(p => p.y.toFixed(4)),
          borderColor: 'green',
          backgroundColor: 'lightgreen',
          tension: 0.1,
          fill: false
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'x' } },
          y: { title: { display: true, text: 'y' } }
        }
      }
    });
  }
  
  // Función principal que recoge datos y lanza los cálculos
  function calcular() {
    const eq = document.getElementById('equation').value.trim();
    const x0 = parseFloat(document.getElementById('x0').value);
    const y0 = parseFloat(document.getElementById('y0').value);
    const h = parseFloat(document.getElementById('h').value);
    const xFinal = parseFloat(document.getElementById('xFinal').value);
  
    // validación para campo vacío de ecuación
    if (eq === "") {
      alert("Por favor, ingresa una ecuación.");
      return;
    }
  
    // Validación de campos numéricos
    if (isNaN(x0) || isNaN(y0) || isNaN(h) || isNaN(xFinal)) {
      alert("Por favor completa todos los campos numéricos con valores válidos.");
      return;
    }
  
    try {
      const f = parseFunction(eq);
      const resultados = rungeKutta2(f, x0, y0, h, xFinal);
      mostrarTabla(resultados);
      graficar(resultados);
    } catch (error) {
      console.error(error);
    }
  }
  