import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModuleList } from "../ModuleList";
import type { StudentModulesBySemester } from "@/types/study";

jest.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, params?: Record<string, unknown>) => {
    if (params && key === "semesterN") return `Semester ${params.n}`;
    return `${ns}.${key}`;
  },
}));

const mockGroups: StudentModulesBySemester[] = [
  {
    semester: 1,
    modules: [
      {
        id: "sm-1",
        user_id: "u-1",
        module_id: "mod-1",
        custom_name: null,
        custom_ects: null,
        status: "PASSED",
        note: 2.3,
        versuch_nummer: 1,
        anmelde_datum: null,
        pruefungs_datum: null,
        semester: "WS2024/25",
        module: {
          id: "mod-1",
          exam_regulation_id: "er-1",
          name: "Programmieren 1",
          kuerzel: "BIN-101",
          ects: 6,
          semester_empfehlung: 1,
          modul_typ: "PFLICHT",
          ist_benotet: true,
          max_versuche: 3,
          gewichtung: 1.0,
          has_prerequisites: false,
        },
      },
      {
        id: "sm-2",
        user_id: "u-1",
        module_id: "mod-2",
        custom_name: null,
        custom_ects: null,
        status: "PLANNED",
        note: null,
        versuch_nummer: 1,
        anmelde_datum: null,
        pruefungs_datum: null,
        semester: null,
        module: {
          id: "mod-2",
          exam_regulation_id: "er-1",
          name: "Grundlagen der Informatik",
          kuerzel: "BIN-102",
          ects: 6,
          semester_empfehlung: 1,
          modul_typ: "PFLICHT",
          ist_benotet: true,
          max_versuche: 3,
          gewichtung: 1.0,
          has_prerequisites: false,
        },
      },
    ],
  },
];

function mockFetch(data: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => data,
  });
}

const createTestQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithClient(ui: React.ReactElement) {
  return render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>);
}

describe("ModuleList", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows loading text initially", () => {
    mockFetch(mockGroups);
    renderWithClient(<ModuleList />);
    expect(screen.getByText("dashboard.modules.loading")).toBeInTheDocument();
  });

  it("renders semester heading and modules", async () => {
    mockFetch(mockGroups);
    renderWithClient(<ModuleList />);
    await waitFor(() => {
      expect(screen.getByText("Semester 1")).toBeInTheDocument();
      expect(screen.getByText("Programmieren 1")).toBeInTheDocument();
      expect(screen.getByText("Grundlagen der Informatik")).toBeInTheDocument();
    });
  });

  it("renders kuerzel for modules that have it", async () => {
    mockFetch(mockGroups);
    renderWithClient(<ModuleList />);
    await waitFor(() => {
      expect(screen.getByText("BIN-101")).toBeInTheDocument();
    });
  });

  it("renders PASSED status badge", async () => {
    mockFetch(mockGroups);
    renderWithClient(<ModuleList />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.modules.status.PASSED")).toBeInTheDocument();
    });
  });

  it("renders note for passed modules", async () => {
    mockFetch(mockGroups);
    renderWithClient(<ModuleList />);
    await waitFor(() => {
      expect(screen.getByText("2.3")).toBeInTheDocument();
    });
  });

  it("shows empty state when no modules", async () => {
    mockFetch([]);
    renderWithClient(<ModuleList />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.modules.noModules")).toBeInTheDocument();
    });
  });

  it("shows error on fetch failure", async () => {
    mockFetch({}, false);
    renderWithClient(<ModuleList />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.modules.loadError")).toBeInTheDocument();
    });
  });

  it("opens modal when module row is clicked", async () => {
    mockFetch(mockGroups);
    renderWithClient(<ModuleList />);
    await waitFor(() => screen.getByText("Programmieren 1"));

    fireEvent.click(screen.getByText("Programmieren 1").closest("button")!);
    expect(screen.getByText("dashboard.modal.title")).toBeInTheDocument();
  });

  it("shows add module button after loading", async () => {
    mockFetch(mockGroups);
    renderWithClient(<ModuleList />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.modules.addButton")).toBeInTheDocument();
    });
  });

  it("opens modal, saves module, and closes modal", async () => {
    const saved = { ...mockGroups[0].modules[0], status: "PASSED" as const, note: 2.0 };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockGroups })
      .mockResolvedValueOnce({ ok: true, json: async () => saved })
      .mockResolvedValue({ ok: true, json: async () => mockGroups });

    renderWithClient(<ModuleList />);
    await waitFor(() => screen.getByText("Programmieren 1"));

    fireEvent.click(screen.getByText("Programmieren 1").closest("button")!);
    expect(screen.getByText("dashboard.modal.title")).toBeInTheDocument();

    fireEvent.click(screen.getByText("dashboard.modal.save"));

    await waitFor(() => {
      expect(screen.queryByText("dashboard.modal.title")).not.toBeInTheDocument();
    });
  });
});
