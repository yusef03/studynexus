export function mockFetchImplementation(url: string, options?: RequestInit) {
  if (url === "/api/study/program") {
    if (options?.method === "POST") return Promise.resolve({ ok: true, json: async () => ({}) });
    return Promise.resolve({ ok: true, json: async () => ({ exam_regulation_id: "er-1" }) });
  }
  if (url === "/api/study/catalog-modules") {
    return Promise.resolve({ ok: true, json: async () => [
      { id: "wpm-1", name: "Machine Learning Grundlagen", kuerzel: "BIN-213", ects: 6, modul_typ: "WAHLPFLICHT", ist_benotet: true, max_versuche: 3, gewichtung: 1.0, has_prerequisites: true },
      { id: "wpm-2", name: "IT-Sicherheit", kuerzel: "BIN-215", ects: 6, modul_typ: "WAHLPFLICHT", ist_benotet: true, max_versuche: 3, gewichtung: 1.0, has_prerequisites: true }
    ] });
  }
  return Promise.resolve({ ok: true, json: async () => ({}) });
}
