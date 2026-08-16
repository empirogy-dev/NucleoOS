import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, Plus, Trash2, FileSpreadsheet, Gauge, Upload } from "lucide-react";
import { useIdioma } from "../idioma/IdiomaProvider";
import { Selector } from "../components/Selector";
import { AyudaTip } from "../components/AyudaTip";
import { sinRobarFoco } from "../components/cierreDeFondo";
import { CampoFecha } from "../components/CampoFecha";
import { hoyLocal } from "../lib/fechas";
import { fmtMoney, type Category } from "./types";
import { LINEA_AUTO, lineaPorNumero, type PaisImpuestos } from "./impuestos";
import { usePaisImpuestos } from "./paisImpuestos";
import { updateCategoryBusinessPct } from "./data";
import {
  bitacoraCSV, borrarLectura, borrarViaje, guardarLectura, guardarVehiculo, guardarViaje,
  guardarViajes, listarLecturas, listarVehiculos, listarViajes, usoDelAuto,
  type Lectura, type UsoDelAuto, type Vehiculo, type Viaje,
} from "./auto";
import {
  leerArchivoKm, quitarRepetidos, reinterpretarUnidad, resumirImportacion,
  type LecturaReporte, type Unidad,
} from "./importarKm";
import { leerXlsx } from "./xlsx";
import { leerXls } from "./xls";

// El auto y sus kilómetros.
//
// Lo que se deduce de un auto no es lo que costó: es la parte de sus gastos
// que corresponde al trabajo, y esa parte se mide en kilómetros. Sin bitácora
// no hay porcentaje, y sin porcentaje la deducción no se sostiene por mucho
// que los gastos estén bien anotados. Esta pantalla existe para que llevar la
// bitácora cueste diez segundos y no sea lo primero que se abandona.


/** Un requisito y cómo va: cumplido, todavía no toca, o falta. */
type Punto = { estado: "listo" | "espera" | "falta"; detalle: string };

export function AutoTab({ categories, onCambio }: {
  categories: Category[];
  onCambio: () => void;
}) {
  const { t: tr } = useIdioma();
  const [pais] = usePaisImpuestos();

  const [autos, setAutos] = useState<Vehiculo[]>([]);
  const [autoId, setAutoId] = useState("");
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nuevoAuto, setNuevoAuto] = useState(false);
  const [importando, setImportando] = useState(false);
  const [guia, setGuia] = useState(false);

  const anioHoy = String(new Date().getFullYear());
  const [anio, setAnio] = useState(anioHoy);

  const auto = autos.find((a) => a.id === autoId) ?? null;

  const cargarAutos = useCallback(async () => {
    try {
      const lista = await listarVehiculos();
      setAutos(lista);
      setAutoId((id) => (lista.some((a) => a.id === id) ? id : lista[0]?.id ?? ""));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarDetalle = useCallback(async (id: string) => {
    if (!id) { setLecturas([]); setViajes([]); return; }
    try {
      const [l, v] = await Promise.all([listarLecturas(id), listarViajes(id)]);
      setLecturas(l);
      setViajes(v);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => { void cargarAutos(); }, [cargarAutos]);
  useEffect(() => { void cargarDetalle(autoId); }, [autoId, cargarDetalle]);

  const anios = useMemo(() => {
    const set = new Set<string>([anioHoy]);
    for (const l of lecturas) set.add(l.date.slice(0, 4));
    for (const v of viajes) set.add(v.date.slice(0, 4));
    return [...set].sort().reverse();
  }, [lecturas, viajes, anioHoy]);

  const uso = useMemo(() => usoDelAuto(anio, lecturas, viajes), [anio, lecturas, viajes]);

  // Las categorías que van a la línea del auto: son las que este porcentaje
  // puede corregir. Si no hay ninguna, ofrecerlo no serviría de nada.
  const lineaAuto = LINEA_AUTO[pais];
  const catsDelAuto = useMemo(
    () => (lineaAuto ? categories.filter((c) => c.type === "expense" && c.tax_line === lineaAuto) : []),
    [categories, lineaAuto],
  );

  async function aplicarPorcentaje() {
    try {
      setAviso(null);
      for (const c of catsDelAuto) {
        await updateCategoryBusinessPct(c.id, uso.porcentaje === 100 ? null : uso.porcentaje);
      }
      onCambio();
      setAviso(`${tr("Listo: ahora esas categorías se deducen al")} ${uso.porcentaje}%.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  function exportar() {
    if (!auto) return;
    const url = URL.createObjectURL(new Blob([bitacoraCSV(auto, uso, viajes)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bitacora-${auto.name.replace(/\s+/g, "-").toLowerCase()}-${anio}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  if (cargando) return <p style={{ color: "var(--muted)" }}>{tr("cargando")}</p>;

  if (err) {
    return (
      <div className="card pad" style={{ borderLeft: "3px solid var(--err)" }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{err}</p>
      </div>
    );
  }

  if (autos.length === 0 && !nuevoAuto) {
    return (
      <div className="card pad">
        <h3 style={{ marginBottom: 8 }}>{tr("Todavía no hay ningún auto")}</h3>
        <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 12, maxWidth: "62ch" }}>
          {tr("Si usas el auto para trabajar, puedes deducir la parte de sus gastos que corresponde al trabajo. Esa parte se mide en kilómetros, y por eso hace falta llevar la cuenta: sin ella no hay proporción que mostrar.")}
        </p>
        <button className="btn primary" {...sinRobarFoco} onClick={() => setNuevoAuto(true)}>
          <Plus size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {tr("Agregar el auto")}
        </button>
      </div>
    );
  }

  return (
    <>
      {aviso && (
        <div className="card pad" style={{ borderLeft: "3px solid var(--ok)", marginBottom: 14, fontSize: 13.5 }}>
          {aviso}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        {autos.length > 0 && (
          <div style={{ minWidth: 190, flex: 1, maxWidth: 280 }}>
            <Selector compacto value={autoId} ariaLabel={tr("Auto")}
              opciones={autos.map((a) => ({ value: a.id, label: a.plate ? `${a.name} · ${a.plate}` : a.name }))}
              onChange={setAutoId} />
          </div>
        )}
        <div style={{ width: 110 }}>
          <Selector compacto value={anio} ariaLabel={tr("Año")}
            opciones={anios.map((a) => ({ value: a, label: a }))} onChange={setAnio} />
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn ghost" disabled={!autoId} onClick={() => setImportando(true)}>
          <Upload size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("Importar de otra app")}
        </button>
        <button className="btn ghost" onClick={() => setNuevoAuto(true)}>
          <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("Otro auto")}
        </button>
      </div>

      <ResumenUso uso={uso} tr={tr} />

      <RequisitosDelFisco uso={uso} anio={anio} pais={pais} tr={tr} />

      {uso.estado === "listo" && catsDelAuto.length > 0 && (
        <div className="card pad" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
            {tr("Tienes")} {catsDelAuto.length}{" "}
            {catsDelAuto.length === 1 ? tr("categoría en") : tr("categorías en")}{" "}
            <b>{lineaPorNumero(lineaAuto, pais)?.es ?? tr("gastos del auto")}</b>
            {": "}{catsDelAuto.map((c) => c.name).join(", ")}.{" "}
            {tr("Puedo dejarlas deduciendo justo este porcentaje.")}
          </p>
          <button className="btn primary" {...sinRobarFoco} onClick={() => void aplicarPorcentaje()}>
            {tr("Usar el")} {uso.porcentaje}% {tr("en esas categorías")}
          </button>
        </div>
      )}

      <div className="panelgrid">
        <PanelViajes viajes={viajes} anio={anio} autoId={autoId} tr={tr}
          onCambio={() => void cargarDetalle(autoId)} onError={setErr} />
        <PanelOdometro lecturas={lecturas} anio={anio} autoId={autoId} tr={tr}
          onCambio={() => void cargarDetalle(autoId)} onError={setErr} />
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button className="btn ghost" {...sinRobarFoco} disabled={!auto || viajes.length === 0} onClick={exportar}>
            <FileSpreadsheet size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            {tr("Exportar la bitácora del año")}
          </button>
        </div>
        <button type="button" className="linklike" style={{ fontSize: 12.5, fontWeight: 600 }}
          onClick={() => setGuia(!guia)}>
          {guia ? "▾" : "▸"} {tr("¿Qué pide exactamente el fisco?")}
        </button>
        {guia && <Guia tr={tr} pais={pais} auto={auto} />}
      </div>

      {importando && auto && (
        <ModalImportar auto={auto} viajes={viajes} tr={tr}
          onClose={() => setImportando(false)}
          onImportado={(n) => {
            setImportando(false);
            setAviso(`${tr("Se importaron")} ${n} ${n === 1 ? tr("viaje") : tr("viajes")}.`);
            void cargarDetalle(autoId);
          }} />
      )}

      {nuevoAuto && (
        <ModalAuto tr={tr} onClose={() => setNuevoAuto(false)}
          onGuardado={() => { setNuevoAuto(false); void cargarAutos(); }}
          onError={setErr} />
      )}
    </>
  );
}

function ResumenUso({ uso, tr }: { uso: UsoDelAuto; tr: (k: string) => string }) {
  const mensajes: Record<UsoDelAuto["estado"], string> = {
    listo: "De cada cien kilómetros del año, esos fueron de trabajo. Es la proporción con la que se deducen los gastos del auto.",
    faltanLecturas: "Falta saber cuántos kilómetros anduvo el auto en total. Hay dos formas: dos lecturas del odómetro, una al empezar y otra al terminar, o importar la bitácora de tu app de kilómetros con los viajes personales incluidos. Sin una de las dos no hay porcentaje, y prefiero no inventarte uno.",
    sinViajes: "El odómetro está, pero no hay ningún viaje de trabajo anotado. Anota los que hiciste y el porcentaje aparece solo.",
    incoherente: "Los viajes de trabajo suman más kilómetros que los que marcó el odómetro, así que hay algo mal anotado. Revisa las lecturas o los viajes antes de usar este número.",
  };
  const tono: Record<UsoDelAuto["estado"], string> = {
    listo: "var(--ok)", faltanLecturas: "var(--muted)", sinViajes: "var(--muted)", incoherente: "var(--err)",
  };

  return (
    <>
      <div className="statrow" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="card stat">
          <div className="k">
            {tr("Uso de trabajo")}
            <AyudaTip etiqueta={tr("Qué significa")} texto={tr("Los kilómetros de trabajo divididos por los kilómetros totales del año. Es la única forma de repartir los gastos del auto entre lo tuyo y lo del negocio, y es la que pide el formulario.")} />
          </div>
          <div className="v tnum" style={{ color: uso.estado === "listo" ? "var(--ok)" : "var(--muted)" }}>
            {uso.estado === "listo" ? `${uso.porcentaje}%` : "—"}
          </div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Kilómetros de trabajo")}</div>
          <div className="v tnum">{uso.kmNegocio.toLocaleString("es-CL")}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Kilómetros del año")}</div>
          <div className="v tnum">{uso.kmTotales ? uso.kmTotales.toLocaleString("es-CL") : "—"}</div>
        </div>
        <div className="card stat">
          <div className="k">{tr("Viajes anotados")}</div>
          <div className="v tnum">{uso.viajes}</div>
        </div>
      </div>
      <p style={{
        fontSize: 12.5, color: tono[uso.estado], lineHeight: 1.55,
        marginBottom: uso.fuenteTotales === "bitacora" ? 4 : 14, maxWidth: "70ch",
      }}>
        {tr(mensajes[uso.estado])}
      </p>
      {/* De dónde salió el total no es un detalle: con el odómetro se prueba
          con el tablero, y con la bitácora se prueba con el registro. */}
      {uso.fuenteTotales === "bitacora" && (
        <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 14, maxWidth: "70ch" }}>
          {tr("Los kilómetros del año salen de sumar todos los viajes de la bitácora, incluidos los personales. Si además anotas dos lecturas del odómetro, mandan esas: cubren también lo que la app no alcanzó a registrar.")}
        </p>
      )}
    </>
  );
}

function PanelViajes({ viajes, anio, autoId, tr, onCambio, onError }: {
  viajes: Viaje[];
  anio: string;
  autoId: string;
  tr: (k: string) => string;
  onCambio: () => void;
  onError: (m: string) => void;
}) {
  const [fecha, setFecha] = useState(hoyLocal());
  const [km, setKm] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const suyos = viajes.filter((v) => v.date.startsWith(anio));

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      await guardarViaje({
        vehicle_id: autoId, date: fecha, km: Number(km),
        destination: destino.trim() || null, purpose: motivo.trim() || null,
      });
      // La fecha se deja como está: cuando uno se pone al día anota varios
      // viajes seguidos del mismo día o de días cercanos.
      setKm(""); setDestino(""); setMotivo("");
      onCambio();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="card panel">
      <h3 style={{ marginBottom: 4 }}>{tr("Viajes de trabajo")}</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("Solo los de trabajo. Los personales salen por resta, y pedirte que anotes cada ida al supermercado es la forma segura de que dejes de anotar.")}
      </p>

      <form onSubmit={(e) => void agregar(e)} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 132, flex: 1 }}>
            <CampoFecha value={fecha} onChange={setFecha} ariaLabel={tr("Fecha")} conBorrar={false} />
          </div>
          <input type="number" min={1} step="any" inputMode="numeric" required value={km}
            onChange={(e) => setKm(e.target.value)} placeholder={tr("Km")} aria-label={tr("Kilómetros")}
            style={{ width: 90 }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <input type="text" maxLength={80} value={destino} onChange={(e) => setDestino(e.target.value)}
            placeholder={tr("A dónde")} aria-label={tr("A dónde")} style={{ flex: 1, minWidth: 120 }} />
          <input type="text" maxLength={80} value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder={tr("Para qué")} aria-label={tr("Para qué")} style={{ flex: 1, minWidth: 120 }} />
        </div>
        <button className="btn primary" {...sinRobarFoco} disabled={ocupado}
          style={{ marginTop: 8, fontSize: 13, padding: "7px 15px" }}>
          <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          {tr("Anotar el viaje")}
        </button>
      </form>

      {suyos.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{tr("Ningún viaje anotado en")} {anio}.</p>
      )}
      {suyos.map((v) => (
        <div key={v.id} style={{
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
          borderTop: "1px solid var(--line-soft)", padding: "8px 0", fontSize: 13,
        }}>
          <span className="tnum" style={{ color: "var(--muted)", fontSize: 12, minWidth: 82 }}>{v.date}</span>
          <span style={{ flex: 1, minWidth: 110 }}>
            {v.destination || tr("Sin destino")}
            {v.purpose && <span style={{ color: "var(--muted)", fontSize: 11.5 }}> · {v.purpose}</span>}
          </span>
          <b className="tnum" style={{ whiteSpace: "nowrap" }}>{Number(v.km).toLocaleString("es-CL")} km</b>
          <button className="xdel" aria-label={tr("Borrar el viaje")}
            onClick={async () => {
              try { await borrarViaje(v.id); onCambio(); }
              catch (ex) { onError(ex instanceof Error ? ex.message : String(ex)); }
            }}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function PanelOdometro({ lecturas, anio, autoId, tr, onCambio, onError }: {
  lecturas: Lectura[];
  anio: string;
  autoId: string;
  tr: (k: string) => string;
  onCambio: () => void;
  onError: (m: string) => void;
}) {
  const [fecha, setFecha] = useState(hoyLocal());
  const [km, setKm] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      await guardarLectura(autoId, fecha, Number(km), null);
      setKm("");
      onCambio();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="card panel">
      <h3 style={{ marginBottom: 4 }}>
        <Gauge size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
        {tr("Lecturas del odómetro")}
      </h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {tr("El número que marca el tablero. Con una al empezar el año y otra al terminarlo basta: de la resta salen los kilómetros totales.")}
      </p>

      <form onSubmit={(e) => void agregar(e)} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 132, flex: 1 }}>
            <CampoFecha value={fecha} onChange={setFecha} ariaLabel={tr("Fecha")} conBorrar={false} />
          </div>
          <input type="number" min={0} step="any" inputMode="numeric" required value={km}
            onChange={(e) => setKm(e.target.value)} placeholder={tr("Km del tablero")}
            aria-label={tr("Km del tablero")} style={{ width: 118 }} />
          <button className="btn primary" {...sinRobarFoco} disabled={ocupado}
            style={{ fontSize: 13, padding: "7px 15px" }}>{tr("Anotar")}</button>
        </div>
      </form>

      {lecturas.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{tr("Todavía no hay lecturas.")}</p>
      )}
      {lecturas.map((l) => (
        <div key={l.id} style={{
          display: "flex", gap: 10, alignItems: "center",
          borderTop: "1px solid var(--line-soft)", padding: "8px 0", fontSize: 13,
          opacity: l.date.startsWith(anio) ? 1 : 0.6,
        }}>
          <span className="tnum" style={{ color: "var(--muted)", fontSize: 12, flex: 1 }}>{l.date}</span>
          <b className="tnum" style={{ whiteSpace: "nowrap" }}>{Number(l.km).toLocaleString("es-CL")} km</b>
          <button className="xdel" aria-label={tr("Borrar la lectura")}
            onClick={async () => {
              try { await borrarLectura(l.id); onCambio(); }
              catch (ex) { onError(ex instanceof Error ? ex.message : String(ex)); }
            }}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function Guia({ tr, pais, auto }: {
  tr: (k: string) => string;
  pais: string;
  auto: Vehiculo | null;
}) {
  return (
    <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-soft)", maxWidth: "68ch" }}>
      <p style={{ marginBottom: 8 }}>
        <b>{tr("La bitácora.")}</b>{" "}
        {tr("De cada viaje de trabajo se pide la fecha, a dónde fuiste, para qué y cuántos kilómetros. Por eso están esos cuatro campos y no solo el número.")}
      </p>
      <p style={{ marginBottom: 8 }}>
        <b>{tr("El odómetro.")}</b>{" "}
        {tr("Los kilómetros totales del año se prueban con la lectura del tablero al empezar y al terminar. Anótala el primero de enero y el treinta y uno de diciembre, o el día que compraste el auto si fue a mitad de año.")}
      </p>
      <p style={{ marginBottom: 8 }}>
        <b>{tr("Lo que se deduce.")}</b>{" "}
        {tr("La bencina, la mantención, el seguro y el permiso de circulación, multiplicados por el porcentaje de uso de trabajo. Por eso el botón de aquí arriba pone ese porcentaje en las categorías del auto.")}
      </p>
      <p style={{ marginBottom: 8, color: "var(--warn)" }}>
        <b>{tr("Lo que compraste no es un gasto.")}</b>{" "}
        {tr("El precio del auto no se deduce el año que lo compras: se reparte en varios años por depreciación, y eso tiene reglas propias. Guarda la fecha y el monto de la compra y pregúntaselo a tu contador.")}
        {auto?.purchase_price ? ` (${tr("el tuyo")}: ${fmtMoney(Number(auto.purchase_price), auto.currency)}${auto.purchase_date ? `, ${auto.purchase_date}` : ""})` : ""}
      </p>
      {pais === "CL" && (
        <p style={{ marginBottom: 8, color: "var(--warn)" }}>
          <b>{tr("Ojo en Chile.")}</b>{" "}
          {tr("Los gastos de automóviles tienen restricciones especiales y muchas veces no se aceptan como gasto, salvo que tu actividad los requiera. Antes de usar esto en tu declaración, confírmalo con tu contador.")}
        </p>
      )}
      <p style={{ color: "var(--muted)", fontSize: 11.5 }}>
        {tr("NucleoOS no es un asesor tributario. La app lleva la cuenta y hace la división; qué se deduce y cómo lo decides tú o tu contador.")}
      </p>
    </div>
  );
}

function ModalAuto({ tr, onClose, onGuardado, onError }: {
  tr: (k: string) => string;
  onClose: () => void;
  onGuardado: () => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [fecha, setFecha] = useState("");
  const [precio, setPrecio] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      await guardarVehiculo({
        name: name.trim(),
        plate: plate.trim() || null,
        purchase_date: fecha || null,
        purchase_price: precio ? Number(precio) : null,
        currency: "CAD",
        notes: null,
      });
      onGuardado();
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : String(ex));
      setOcupado(false);
    }
  }

  return (
    <div className="tp-overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 4 }}>
          <Car size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
          {tr("El auto")}
        </h3>
        <p style={{ lineHeight: 1.55, marginBottom: 12 }}>
          {tr("La compra no se deduce como gasto del año, pero conviene tenerla anotada: la depreciación se calcula desde ahí.")}
        </p>
        <form onSubmit={(e) => void guardar(e)}>
          <div className="field">
            <label htmlFor="auto-nombre">{tr("Nombre")}</label>
            <input id="auto-nombre" type="text" required maxLength={60} value={name}
              placeholder={tr("Honda Civic")} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="auto-patente">{tr("Patente (opcional)")}</label>
            <input id="auto-patente" type="text" maxLength={20} value={plate}
              onChange={(e) => setPlate(e.target.value)} />
          </div>
          <div className="field">
            <label>{tr("Fecha de compra (opcional)")}</label>
            <CampoFecha value={fecha} onChange={setFecha} ariaLabel={tr("Fecha de compra")} />
          </div>
          <div className="field">
            <label htmlFor="auto-precio">{tr("Cuánto costó (opcional)")}</label>
            <input id="auto-precio" type="number" min={0} step="any" inputMode="decimal" value={precio}
              onChange={(e) => setPrecio(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button type="button" className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
            <button className="btn primary" {...sinRobarFoco} disabled={ocupado}>{tr("com.guardar")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Traer la bitácora desde una app que rastrea el auto.
 *
 *  Ella paga MileIQ, que ya hace el rastreo y ya clasifica cada viaje. Volver
 *  a escribir eso a mano no tiene sentido, y dejar de pagarlo tampoco si
 *  significa perder el registro. Importarlo resuelve las dos cosas.
 *
 *  La pantalla enseña lo que entendió ANTES de guardar nada: cuántos viajes,
 *  en qué unidad y qué categorías quedaron como personales. Un importador que
 *  guarda primero y explica después es como se meten mil filas malas. */
function ModalImportar({ auto, viajes, tr, onClose, onImportado }: {
  auto: Vehiculo;
  viajes: Viaje[];
  tr: (k: string) => string;
  onClose: () => void;
  onImportado: (n: number) => void;
}) {
  const [lectura, setLectura] = useState<LecturaReporte | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [unidad, setUnidad] = useState<Unidad>("mi");
  const [conPersonales, setConPersonales] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function elegir(f: File | null) {
    if (!f) return;
    setError(null);
    setNombreArchivo(f.name);
    try {
      // El lector de Excel se le pasa como parámetro para que el archivo que
      // interpreta reportes no dependa de las APIs del navegador y se pueda
      // probar suelto.
      const r = await leerArchivoKm(f, leerXlsx, leerXls);
      setLectura(r);
      setUnidad(r.unidad);
    } catch (e) {
      setLectura(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Si se corrige la unidad a mano, los kilómetros se recalculan desde lo que
  // decía el archivo, no encima de la conversión anterior.
  const viajesConUnidad = useMemo(
    () => (lectura ? reinterpretarUnidad(lectura.viajes, lectura.unidad, unidad) : []),
    [lectura, unidad],
  );
  const elegidos = useMemo(
    () => viajesConUnidad.filter((v) => conPersonales || v.is_business),
    [viajesConUnidad, conPersonales],
  );
  const { aImportar, repetidos } = useMemo(
    () => quitarRepetidos(elegidos, viajes),
    [elegidos, viajes],
  );
  const resumen = useMemo(() => resumirImportacion(viajesConUnidad), [viajesConUnidad]);

  async function importar() {
    setOcupado(true);
    try {
      const n = await guardarViajes(auto.id, aImportar.map((v) => ({
        date: v.date,
        km: Number(v.km.toFixed(2)),
        destination: v.destination,
        purpose: v.purpose,
        is_business: v.is_business,
      })));
      onImportado(n);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  }

  return (
    <div className="tp-overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 style={{ marginBottom: 4 }}>
          <Upload size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
          {tr("Importar la bitácora")}
        </h3>
        <p style={{ lineHeight: 1.55, marginBottom: 12 }}>
          {tr("Pide en tu app de kilómetros el reporte de viajes y súbelo aquí, en Excel o en CSV. Está probado con MileIQ, y sirve cualquier archivo que traiga fecha, distancia y categoría.")}
        </p>

        <input type="file" accept=".csv,.xlsx,.xls,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          aria-label={tr("El archivo del reporte")}
          onChange={(e) => void elegir(e.target.files?.[0] ?? null)} />

        {error && (
          <p style={{ fontSize: 12.5, color: "var(--err)", marginTop: 10, lineHeight: 1.55 }}>{error}</p>
        )}

        {lectura && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
              {nombreArchivo} · {lectura.desde} → {lectura.hasta}
            </p>

            {/* La unidad primero, porque es lo que puede salir mal en grande y
                en silencio. Millas metidas como kilómetros dan un número un
                tercio más bajo, y ese número va a una declaración. */}
            <div className="field">
              <label>{tr("El archivo viene en")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className={"btn " + (unidad === "mi" ? "primary" : "ghost")}
                  style={{ fontSize: 13, padding: "6px 14px" }}
                  onClick={() => setUnidad("mi")}>{tr("Millas")}</button>
                <button type="button" className={"btn " + (unidad === "km" ? "primary" : "ghost")}
                  style={{ fontSize: 13, padding: "6px 14px" }}
                  onClick={() => setUnidad("km")}>{tr("Kilómetros")}</button>
              </div>
              <p style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5,
                color: lectura.unidadSegura ? "var(--muted)" : "var(--warn)" }}>
                {lectura.unidadSegura
                  ? tr("Lo dice el propio archivo. Cámbialo solo si sabes que está mal.")
                  : tr("El archivo no dice la unidad, así que supuse millas, que es lo que usan estas apps por defecto. Revísalo: convertir de la unidad equivocada cambia todos los números.")}
              </p>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 10 }}>
              <tbody>
                {resumen.porCategoria.map((c) => (
                  <tr key={c.categoria} style={{ borderTop: "1px solid var(--line-soft)" }}>
                    <td style={{ padding: "7px 6px 7px 0" }}>
                      {c.categoria}
                      <span style={{ fontSize: 11.5, color: c.negocio ? "var(--ok)" : "var(--muted)" }}>
                        {" · "}{c.negocio ? tr("cuenta como trabajo") : tr("no cuenta como trabajo")}
                      </span>
                    </td>
                    <td className="tnum" style={{ textAlign: "right", padding: "7px 0", whiteSpace: "nowrap" }}>
                      {Math.round(c.km).toLocaleString("es-CL")} km
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.cuantos}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* La casilla solo si el archivo trae personales. Ofrecer traer
                algo que no existe hace creer que los kilómetros totales
                quedaron cubiertos, y no es así. */}
            {resumen.personales.cuantos > 0 ? (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12.5,
                cursor: "pointer", lineHeight: 1.45, marginBottom: 10 }}>
                <input type="checkbox" checked={conPersonales}
                  onChange={(e) => setConPersonales(e.target.checked)}
                  style={{ width: 15, height: 15, marginTop: 2, accentColor: "var(--accent)" }} />
                <span>
                  {tr("Traer también los viajes personales")}{" "}
                  <span style={{ color: "var(--muted)" }}>
                    {tr("Conviene: con ellos los kilómetros del año salen de la propia bitácora y ya no dependes de acordarte de mirar el tablero en enero. No aparecen en la lista ni se deducen.")}
                  </span>
                </span>
              </label>
            ) : (
              <p style={{ fontSize: 12, color: "var(--warn)", marginBottom: 10, lineHeight: 1.5 }}>
                {tr("Este reporte trae solo viajes de trabajo, ninguno personal. Con eso sé cuántos kilómetros hiciste trabajando, pero no cuántos hiciste en total, y el porcentaje sale de dividir uno por el otro. Vas a necesitar las dos lecturas del odómetro, o exportar el reporte incluyendo todas las categorías.")}
              </p>
            )}

            {lectura.descartadas.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--warn)", marginBottom: 8, lineHeight: 1.5 }}>
                {lectura.descartadas.length} {tr("filas no se pudieron leer y quedan fuera:")}{" "}
                {lectura.descartadas.slice(0, 4).map((d) => `${tr("fila")} ${d.fila} (${d.motivo})`).join(", ")}
                {lectura.descartadas.length > 4 ? "…" : ""}
              </p>
            )}

            <p style={{ fontSize: 13, lineHeight: 1.55 }}>
              {tr("Se van a guardar")} <b>{aImportar.length}</b>{" "}
              {aImportar.length === 1 ? tr("viaje") : tr("viajes")}
              {repetidos > 0 && (
                <span style={{ color: "var(--muted)" }}>
                  {", "}{repetidos} {tr("ya estaban y no se repiten")}
                </span>
              )}.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button type="button" className="btn ghost" onClick={onClose}>{tr("Cancelar")}</button>
          <button type="button" className="btn primary" {...sinRobarFoco}
            disabled={ocupado || aImportar.length === 0}
            onClick={() => void importar()}>
            {ocupado ? tr("com.guardando") : tr("Importar")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Lo que el fisco pide, y cuánto de eso ya tienes.
 *
 * La deducción del auto no se pierde por gastar mal: se pierde por no poder
 * probar la proporción. Y lo que se pide son tres cosas concretas, no una
 * sensación: los kilómetros totales del año, los de trabajo, y una bitácora
 * con fecha, destino, motivo y distancia de cada viaje.
 *
 * Por eso esto es una lista y no un párrafo. Un párrafo se lee una vez; una
 * lista con lo que falta se puede ir cerrando.
 */
function RequisitosDelFisco({ uso, anio, pais, tr }: {
  uso: UsoDelAuto;
  anio: string;
  pais: PaisImpuestos;
  tr: (k: string) => string;
}) {
  const esAnioEnCurso = anio === String(new Date().getFullYear());
  const km = (n: number) => `${Math.round(n).toLocaleString("es-CL")} km`;

  // La lectura de cierre no se puede tener antes de que termine el año, así
  // que en el año en curso se muestra pendiente y no como algo que falta.
  const hayCierre = uso.lecturaFin && uso.lecturaFin.id !== uso.lecturaInicio?.id;
  const cierre: Punto = hayCierre
    // Una lectura de agosto no es la del cierre del año. Marcarla como
    // cumplida haría creer que ya está, y en diciembre nadie se acordaría.
    ? (esAnioEnCurso && uso.lecturaFin!.date < `${anio}-12-25`
      ? {
        estado: "espera",
        detalle: `${tr("Por ahora")} ${uso.lecturaFin!.date} · ${km(uso.lecturaFin!.km)}. ${tr("Vuelve a anotarlo al terminar el año.")}`,
      }
      : { estado: "listo", detalle: `${uso.lecturaFin!.date} · ${km(uso.lecturaFin!.km)}` })
    : esAnioEnCurso
      ? { estado: "espera", detalle: tr("Se anota el 31 de diciembre.") }
      : { estado: "falta", detalle: tr("Sin ella no se puede probar el recorrido del año.") };

  const puntos: Array<{ que: string } & Punto> = [
    {
      que: tr("Odómetro al empezar"),
      ...(uso.lecturaInicio
        ? { estado: "listo" as const, detalle: `${uso.lecturaInicio.date} · ${km(uso.lecturaInicio.km)}` }
        : { estado: "falta" as const, detalle: tr("Anótalo abajo, con el número del tablero.") }),
    },
    { que: tr("Odómetro al terminar"), ...cierre },
    {
      que: tr("Kilómetros del año"),
      ...(uso.kmTotales > 0
        ? {
          estado: "listo" as const,
          detalle: uso.fuenteTotales === "odometro"
            ? `${km(uso.kmTotales)} · ${tr("del odómetro")}`
            : `${km(uso.kmTotales)} · ${tr("de la bitácora, personales incluidos")}`,
        }
        : { estado: "falta" as const, detalle: tr("Salen del odómetro, o de una bitácora que traiga los viajes personales.") }),
    },
    {
      que: tr("Kilómetros de trabajo"),
      ...(uso.kmNegocio > 0
        ? { estado: "listo" as const, detalle: `${km(uso.kmNegocio)} · ${uso.viajes} ${uso.viajes === 1 ? tr("viaje") : tr("viajes")}` }
        : { estado: "falta" as const, detalle: tr("Anota o importa los viajes de trabajo.") }),
    },
    {
      que: tr("Bitácora de cada viaje"),
      ...(uso.viajes > 0
        ? { estado: "listo" as const, detalle: tr("Fecha, destino, motivo y distancia de cada uno.") }
        : { estado: "falta" as const, detalle: tr("Es lo que se muestra si te la piden.") }),
    },
  ];

  // Cuando hay las dos fuentes, la diferencia es plata: son kilómetros que el
  // auto anduvo y la app no vio, y cuentan como personales.
  const noRegistrados = uso.fuenteTotales === "odometro" && uso.kmBitacora > 0
    ? uso.kmTotales - uso.kmBitacora
    : 0;

  return (
    <div className="card panel" style={{ marginBottom: 14 }}>
      <h3 style={{ marginBottom: 4 }}>{tr("Lo que te van a pedir")}</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {pais === "CA"
          ? tr("Para deducir el auto hay que poder probar la proporción, y eso son cuatro datos. Esto es lo que tienes de este año.")
          : tr("Aunque las reglas cambien según el país, la proporción siempre se prueba igual: kilómetros de trabajo sobre kilómetros totales, con la bitácora detrás.")}
      </p>

      {puntos.map((p) => (
        <div key={p.que} style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          borderTop: "1px solid var(--line-soft)", padding: "9px 0",
        }}>
          <span aria-hidden style={{
            width: 17, flex: "none", textAlign: "center", fontSize: 13,
            color: p.estado === "listo" ? "var(--ok)" : p.estado === "espera" ? "var(--muted)" : "var(--warn)",
          }}>
            {p.estado === "listo" ? "✓" : p.estado === "espera" ? "·" : "!"}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
            {p.que}
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{p.detalle}</div>
          </span>
        </div>
      ))}

      {noRegistrados > 1 && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {tr("El odómetro dice")} <b>{km(uso.kmTotales)}</b> {tr("y la bitácora suma")} <b>{km(uso.kmBitacora)}</b>.{" "}
          {tr("Esos")} <b>{km(noRegistrados)}</b>{" "}
          {tr("de diferencia son viajes que el auto hizo y la app no registró. Cuentan como personales, que es lo correcto: si no se registró para qué fue, no se deduce.")}
        </p>
      )}
      {noRegistrados < -1 && (
        <p style={{ fontSize: 12, color: "var(--err)", marginTop: 10, lineHeight: 1.55 }}>
          {tr("La bitácora suma más kilómetros que el odómetro. Revisa las lecturas: puede que le falte un dígito a alguna.")}
        </p>
      )}
    </div>
  );
}
