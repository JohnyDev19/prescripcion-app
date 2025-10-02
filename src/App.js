import React, { useState, useEffect } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import Select from "react-select";

function App() {
  // Idioma
  const [lang, setLang] = useState("es");

  const translations = {
    es: {
      title: "📋 Formato de Prescripción",
      patientCode: "Código paciente",
      consultation: "Número de consulta",
      name: "Nombre",
      age: "Edad",
      sex: "Sexo",
      female: "Femenino",
      male: "Masculino",
      weight: "Peso (kg)",
      height: "Altura (cm)",
      disease: "Enfermedad",
      diagnosis: "Diagnóstico",
      products: "🧴 Productos",
      selectProduct: "Seleccionar producto",
      presentation: "Presentación",
      dose: "Dosis (ml)",
      timesPerDay: "Veces al día",
      duration: "Duración",
      durationType: "Tipo de duración",
      days: "Días",
      months: "Meses",
      observations: "Observaciones",
      addProduct: "➕ Agregar producto",
      product: "Producto",
      bottles: "Frascos",
      actions: "Acciones",
      remove: "❌",
      exportWord: "📄 Exportar a Word",
      recipe: "RECETA MÉDICA",
      prescription: "Prescripción:",
    },
    en: {
      title: "📋 Prescription Form",
      patientCode: "Patient Code",
      consultation: "Consultation Number",
      name: "Name",
      age: "Age",
      sex: "Sex",
      female: "Female",
      male: "Male",
      weight: "Weight (kg)",
      height: "Height (cm)",
      disease: "Disease",
      diagnosis: "Diagnosis",
      products: "🧴 Products",
      selectProduct: "Select product",
      presentation: "Presentation",
      dose: "Dose (ml)",
      timesPerDay: "Times per day",
      duration: "Duration",
      durationType: "Duration type",
      days: "Days",
      months: "Months",
      observations: "Observations",
      addProduct: "➕ Add product",
      product: "Product",
      bottles: "Bottles",
      actions: "Actions",
      remove: "❌",
      exportWord: "📄 Export to Word",
      recipe: "MEDICAL PRESCRIPTION",
      prescription: "Prescription:",
    },
  };

  const t = translations[lang];

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
          const nombre = r.c[2]?.v || "";
          return { nombre };
        });
        setProductos(rows);
      })
      .catch((err) => console.error(err));
  }, []);

  // Opciones para react-select (solo nombre)
  const opcionesProductos = productos.map((p) => ({
    value: p.nombre,
    label: p.nombre,
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
      duracion: `${duracion} ${
        duracionTipo === "dias" ? t.days : t.months
      }`,
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
              children: [
                new TextRun({ text: t.recipe, bold: true, size: 28 }),
              ],
            }),
            new Paragraph(" "),
            new Paragraph(`${t.patientCode}: ${codigoPaciente}`),
            new Paragraph(`${t.consultation}: ${numeroConsulta}`),
            new Paragraph(`${t.name}: ${nombre}`),
            new Paragraph(`${t.age}: ${edad} | ${t.sex}: ${sexo}`),
            new Paragraph(`${t.weight}: ${peso} kg | ${t.height}: ${altura} cm`),
            new Paragraph(`${t.disease}: ${enfermedad}`),
            new Paragraph(`${t.diagnosis}: ${diagnostico}`),
            new Paragraph(" "),
            new Paragraph({ text: t.prescription, bold: true }),
            ...productosAgregados.map(
              (p, i) =>
                new Paragraph(
                  `${i + 1}. ${p.producto} (${p.presentacion} ml) → ${p.dosis} ml, ${p.veces} ${t.timesPerDay} por ${p.duracion} → ${p.frascos} ${t.bottles} ${
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        {/* Switch idioma */}
        <button
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          className="bg-gray-300 px-3 py-1 rounded"
        >
          {lang === "es" ? "EN" : "ES"}
        </button>
      </div>

      {/* Datos del paciente */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <label>{t.patientCode}:</label>
          <input
            type="text"
            value={codigoPaciente}
            onChange={(e) => setCodigoPaciente(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.consultation}:</label>
          <input
            type="number"
            value={numeroConsulta}
            onChange={(e) => setNumeroConsulta(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.name}:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.age}:</label>
          <input
            type="number"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.sex}:</label>
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            className="border p-2 rounded w-full text-center"
          >
            <option value="">{`-- ${t.selectProduct} --`}</option>
            <option value={t.female}>{t.female}</option>
            <option value={t.male}>{t.male}</option>
          </select>
        </div>
        <div>
          <label>{t.weight}:</label>
          <input
            type="number"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.height}:</label>
          <input
            type="number"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
      </div>

      <div>
        <label>{t.disease}:</label>
        <input
          type="text"
          value={enfermedad}
          onChange={(e) => setEnfermedad(e.target.value)}
          className="border p-2 rounded w-full text-center"
        />
      </div>

      <div>
        <label>{t.diagnosis}:</label>
        <textarea
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          className="border p-2 rounded w-full text-center"
        />
      </div>

      {/* Productos */}
      <h2 className="text-xl font-semibold">{t.products}</h2>
      <div>
        <label>{t.selectProduct}:</label>
        <Select
          options={opcionesProductos}
          value={producto}
          onChange={setProducto}
          placeholder={t.selectProduct}
          isClearable
          isSearchable
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <label>{t.presentation}:</label>
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
          <label>{t.dose}:</label>
          <input
            type="number"
            value={dosis}
            onChange={(e) => setDosis(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.timesPerDay}:</label>
          <input
            type="number"
            value={veces}
            onChange={(e) => setVeces(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.duration}:</label>
          <input
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="border p-2 rounded w-full text-center"
          />
        </div>
        <div>
          <label>{t.durationType}:</label>
          <select
            value={duracionTipo}
            onChange={(e) => setDuracionTipo(e.target.value)}
            className="border p-2 rounded w-full text-center"
          >
            <option value="dias">{t.days}</option>
            <option value="meses">{t.months}</option>
          </select>
        </div>
        <div className="col-span-2">
          <label>{t.observations}:</label>
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
        {t.addProduct}
      </button>

      {/* Tabla de productos */}
      <table className="w-full border mt-4 text-center">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">{t.product}</th>
            <th className="border p-2">{t.presentation}</th>
            <th className="border p-2">{t.dose}</th>
            <th className="border p-2">{t.timesPerDay}</th>
            <th className="border p-2">{t.duration}</th>
            <th className="border p-2">{t.bottles}</th>
            <th className="border p-2">{t.observations}</th>
            <th className="border p-2">{t.actions}</th>
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
                  {t.remove}
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
        {t.exportWord}
      </button>
    </div>
  );
}

export default App;


