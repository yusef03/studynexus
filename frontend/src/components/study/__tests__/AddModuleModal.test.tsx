import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddModuleModal } from "../AddModuleModal";
import type { ModuleResponse, StudentModuleResponse, UserProgramResponse } from "@/types/study";

jest.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

const mockProgram: Partial<UserProgramResponse> = {
  exam_regulation_id: "er-1",
};

const mockCatalogModules: ModuleResponse[] = [
  {
    id: "wpm-1",
    exam_regulation_id: "er-1",
    name: "Machine Learning Grundlagen",
    kuerzel: "BIN-213",
    ects: 6,
    semester_empfehlung: null,
    modul_typ: "WAHLPFLICHT",
    ist_benotet: true,
    max_versuche: 3,
    gewichtung: 1.0,
    has_prerequisites: true,
  },
  {
    id: "wpm-2",
    exam_regulation_id: "er-1",
    name: "IT-Sicherheit",
    kuerzel: "BIN-215",
    ects: 6,
    semester_empfehlung: null,
    modul_typ: "WAHLPFLICHT",
    ist_benotet: true,
    max_versuche: 3,
    gewichtung: 1.0,
    has_prerequisites: true,
  },
  {
    id: "pflicht-1",
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
];

function mockFetchChain(postOverride?: any) {
  global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === "/api/study/program") {
      return Promise.resolve({ ok: true, json: async () => mockProgram });
    }
    if (url.includes("/modules") && options?.method !== "POST") {
      return Promise.resolve({ ok: true, json: async () => [{ semester: 1, modules: mockCatalogModules }] });
    }
    if (url === "/api/study/modules" && options?.method === "POST") {
      if (postOverride) {
        return Promise.resolve(postOverride);
      }
      return Promise.resolve({ ok: true, json: async () => ({ id: "sm-new" }) });
    }
    return Promise.resolve({ ok: false, json: async () => ({}) });
  });
}

const noopClose = jest.fn();

const emptyIds = new Set<string>();

const createTestQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
function renderWithClient(ui: React.ReactElement) {
  return render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>);
}

describe("AddModuleModal", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows loading indicator initially", () => {
    mockFetchChain();
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={noopClose} />);
    // While loading, save button should be disabled
    expect(screen.getByText("dashboard.addModule.save")).toBeDisabled();
  });

  it("renders wahlpflicht dropdown after load (filters out PFLICHT modules)", async () => {
    mockFetchChain();
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={noopClose} />);
    await waitFor(() => {
      expect(screen.getByText(/Machine Learning/)).toBeInTheDocument();
      expect(screen.getByText(/IT-Sicherheit/)).toBeInTheDocument();
    });
    // PFLICHT module must not appear
    expect(screen.queryByText("Programmieren 1")).not.toBeInTheDocument();
  });

  it("filters out already-added modules", async () => {
    mockFetchChain();
    const alreadyAdded = new Set(["wpm-1"]);
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={alreadyAdded} onClose={noopClose} />);
    await waitFor(() => {
      expect(screen.getByText(/IT-Sicherheit/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Machine Learning/)).not.toBeInTheDocument();
  });

  it("shows custom form when mode is switched to Eigenes", async () => {
    mockFetchChain();
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={noopClose} />);
    await waitFor(() => screen.getByText(/Machine Learning/));

    fireEvent.click(screen.getByText("dashboard.addModule.modeCustom"));
    expect(screen.getByLabelText("dashboard.addModule.customName")).toBeInTheDocument();
    expect(screen.getByLabelText("dashboard.addModule.customEcts")).toBeInTheDocument();
  });

  it("calls POST with module_id when saving wahlpflicht", async () => {
    const newSm: Partial<StudentModuleResponse> = { id: "sm-new", module_id: "wpm-1" };
    mockFetchChain({ ok: true, json: async () => newSm });

    const onClose = jest.fn();
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={onClose} />);
    await waitFor(() => screen.getByText(/Machine Learning/));

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "wpm-1" } });
    fireEvent.click(screen.getByText("dashboard.addModule.save"));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/study/modules",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("calls POST with custom_name and custom_ects when saving custom module", async () => {
    const newSm: Partial<StudentModuleResponse> = { id: "sm-new", custom_name: "Planspiel" };
    mockFetchChain({ ok: true, json: async () => newSm });

    const onClose = jest.fn();
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={onClose} />);
    await waitFor(() => screen.getByText(/Machine Learning/));

    fireEvent.click(screen.getByText("dashboard.addModule.modeCustom"));
    fireEvent.change(screen.getByLabelText("dashboard.addModule.customName"), {
      target: { value: "Planspiel" },
    });
    fireEvent.change(screen.getByLabelText("dashboard.addModule.customEcts"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByText("dashboard.addModule.save"));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    const [, postOpts] = (global.fetch as jest.Mock).mock.calls[2];
    expect(JSON.parse(postOpts.body)).toEqual({ custom_name: "Planspiel", custom_ects: 2, custom_ist_benotet: true });
  });

  it("shows error message when POST fails", async () => {
    mockFetchChain({ ok: false, json: async () => ({ detail: "Modul bereits vorhanden" }) });

    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={noopClose} />);
    await waitFor(() => screen.getByText(/Machine Learning/));

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "wpm-1" } });
    fireEvent.click(screen.getByText("dashboard.addModule.save"));

    await waitFor(() => {
      expect(screen.getByText("Modul bereits vorhanden")).toBeInTheDocument();
    });
  });

  it("calls onClose when cancel button is clicked", async () => {
    mockFetchChain();
    const onClose = jest.fn();
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={onClose} />);
    fireEvent.click(screen.getByText("dashboard.addModule.close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows load error when fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    renderWithClient(<AddModuleModal alreadyAddedModuleIds={emptyIds} onClose={noopClose} />);
    await waitFor(() => {
      expect(screen.getAllByText("dashboard.addModule.loadError").length).toBeGreaterThan(0);
    });
  });
});
