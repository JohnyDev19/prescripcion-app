import React, { useState, useEffect } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import Select from "react-select";

function App() {
  // Datos del paciente
  const [codigoPaciente, setCodigoPaciente] = useState("");
  const [numeroConsulta, setNumeroConsulta] = useState("");
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [enfermedad, setEnfermedad] = useState("");

  // Productos
  const [productos, setProductos] = useState([]);
  const [producto, setProducto] = useState(null);
  const [presentacion, setPresentacion] = useState("120");
  const [dosis, setDosis] = useState("");
  const [veces, setVeces] = useState("");
  const [duracion, setDuracion] = useState("");
  const [duracionTipo, setDuracionTipo] = useState("dias");
  const [observaciones, setObservaciones] = useState("");
  const [productosAgregados, setProductosAgregados] = useState([]);

  // 🔹 Cargar productos desde Google Sheets
  useEffect(() => {
    fetch(
      `https://docs.google.com/spreadsheets/d/1WkMwaN_4IrmPtmmkdHkl1AW8ux-bqSvH3Ceq0BbCXHc/gviz/tq?tqx=out:json&sheet=Catalogo`
    )
      .then((res) => res.text())
      .then((text) => {
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows.map((r) => {
          // C = 2, D = 3, E = 4, F = 5 (índices empezando en 0)
          const nombre = r.c[2]?.v || "";
          const codigo = `${r.c[3]?.v || ""}${r.c[4]?.v || ""}${r.c[5]?.v || ""}`;
          return { nombre, codigo };
        });
        console.log(rows);
        setProductos(rows);
      })
      .catch((err) => console.error(err));
  }, []);

  // Opciones para react-select
  const opcionesProductos = productos.map((p) => ({
    value: p.codigo,
    label: `${p.codigo} - ${p.nombre}`,
  }));

  // Calcular cantidad de frascos
  const calcularFrascos = (presentacion, dosis, veces, duracion, tipo) => {
    const totalDias = tipo === "meses" ? duracion * 30 : duracion;
    const totalMl = dosis * veces * totalDias;
    return Math.ceil(totalMl / presentacion);
  };

  // Agregar producto
  const agregarProducto = () => {
    if (!producto || !dosis || !veces || !duracion) return;

    const frascos = calcularFrascos(
      parseInt(presentacion),
      parseInt(dosis),
      parseInt(veces),
      parseInt(duracion),
      duracionTipo
    );

    const nuevo = {
      producto: producto.label,
      presentacion,
      dosis,
      veces,
      duracion: `${duracion} ${duracionTipo}`,
      frascos,
      observaciones,
    };

    setProductosAgregados([...productosAgregados, nuevo]);

    // Limpiar campos del producto
    setProducto(null);
    setPresentacion("120");
    setDosis("");
    setVeces("");
    setDuracion("");
    setDuracionTipo("dias");
    setObservaciones("");
  };

  // Remover producto
  const removerProducto = (index) => {
    const nuevos = [...productosAgregados];
    nuevos.splice(index, 1);
    setProductosAgregados(nuevos);
  };

  // Exportar a Word
  const exportarWord = () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: "center",
              children: [new TextRun({ text: "RECETA MÉDICA", bold: true, size: 28 })],
            }),
            new Paragraph(" "),
            new Paragraph(`Código paciente: ${codigoPaciente}`),
            new Paragraph(`Consulta: ${numeroConsulta}`),
            new Paragraph(`Nombre: ${nombre}`),
            new Paragraph(`Edad: ${edad} | Sexo: ${sexo}`),
            new Paragraph(`Peso: ${peso} kg | Altura: ${altura} cm`),
            new Paragraph(`Enfermedad: ${enfermedad}`),
            new Paragraph(`Diagnóstico: ${diagnostico}`),
            new Paragraph(" "),
            new Paragraph({ text: "Prescripción:", bold: true }),
            ...productosAgregados.map(
              (p, i) =>
                new Paragraph(
                  `${i + 1}. ${p.producto} (${p.presentacion} ml) → ${p.dosis} ml, ${p.veces} veces/día por ${p.duracion} → ${p.frascos} frascos ${
                    p.observaciones ? " | Obs: " + p.observaciones : ""
                  }`
                )
            ),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `Receta_${nombre || "paciente"}.docx`);
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-center">
      <h1 className="text-2xl font-bold">📋 Formato de Prescripción</h1>

      {/* Datos del paciente */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <label>Código paciente:</label>
          <input
            type="text"
            value={codigoPaciente}
            onChange={(e) => setCodigoPaciente(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Número de consulta:</label>
          <input
            type="number"
            value={numeroConsulta}
            onChange={(e) => setNumeroConsulta(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Edad:</label>
          <input
            type="number"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Sexo:</label>
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            className="border p-2 rounded w-full text-center"
          >
            <option value="">-- Seleccionar --</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
          </select>
        </div>
        <div>
          <label>Peso (kg):</label>
          <input
            type="number"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Altura (cm):</label>
          <input
            type="number"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
      </div>

      <div>
        <label>Enfermedad:</label>
        <input
          type="text"
          value={enfermedad}
          onChange={(e) => setEnfermedad(e.target.value)}
          className="border p-2 rounded w-full text-center"
        />
      </div>

      <div>
        <label>Diagnóstico:</label>
        <textarea
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          className="border p-2 rounded w-full text-center"
        />
      </div>

      {/* Productos */}
      <h2 className="text-xl font-semibold">🧴 Productos</h2>
      <div>
        <label>Seleccionar producto:</label>
        <Select
          options={opcionesProductos}
          value={producto}
          onChange={setProducto}
          placeholder="Buscar o seleccionar producto..."
          isClearable
          isSearchable
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <label>Presentación:</label>
          <select
            value={presentacion}
            onChange={(e) => setPresentacion(e.target.value)}
            className="border p-2 rounded w-full text-center"
          >
            <option value="120">120 ml</option>
            <option value="240">240 ml</option>
          </select>
        </div>
        <div>
          <label>Dosis (ml):</label>
          <input
            type="number"
            value={dosis}
            onChange={(e) => setDosis(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Veces al día:</label>
          <input
            type="number"
            value={veces}
            onChange={(e) => setVeces(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Duración:</label>
          <input
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>Tipo de duración:</label>
          <select
            value={duracionTipo}
            onChange={(e) => setDuracionTipo(e.target.value)}
            className="border p-2 rounded w-full text-center"
          >
            <option value="dias">Días</option>
            <option value="meses">Meses</option>
          </select>
        </div>
        <div className="col-span-2">
          <label>Observaciones:</label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
      </div>

      <button
        onClick={agregarProducto}
        className="bg-green-500 text-white p-2 rounded mt-2"
      >
        ➕ Agregar producto
      </button>

      {/* Tabla de productos */}
      <table className="w-full border mt-4 text-center">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Producto</th>
            <th className="border p-2">Presentación</th>
            <th className="border p-2">Dosis</th>
            <th className="border p-2">Veces/día</th>
            <th className="border p-2">Duración</th>
            <th className="border p-2">Frascos</th>
            <th className="border p-2">Observaciones</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosAgregados.map((p, index) => (
            <tr key={index}>
              <td className="border p-2">{p.producto}</td>
              <td className="border p-2">{p.presentacion} ml</td>
              <td className="border p-2">{p.dosis} ml</td>
              <td className="border p-2">{p.veces}</td>
              <td className="border p-2">{p.duracion}</td>
              <td className="border p-2">{p.frascos}</td>
              <td className="border p-2">{p.observaciones}</td>
              <td className="border p-2">
                <button
                  onClick={() => removerProducto(index)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botón exportar */}
      <button
        onClick={exportarWord}
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        📄 Exportar a Word
      </button>
    </div>
  );
}

export default App;


