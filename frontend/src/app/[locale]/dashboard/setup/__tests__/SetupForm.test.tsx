import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SetupForm } from "../SetupForm";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

const mockUniversity = [{ id: "uni-1", name: "Hochschule Hannover" }];
const mockFaculties = [{ id: "fac-1", name: "Fakultät IV" }];
const mockPrograms = [{ id: "prog-1", name: "Informatik", abschluss: "Bachelor" }];
const mockExamRegs = [{ id: "er-1", version: "PO2021" }];

function mockFetchChain() {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => mockUniversity })
    .mockResolvedValueOnce({ ok: true, json: async () => mockFaculties });
}

describe("SetupForm", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows loading state initially", () => {
    mockFetchChain();
    render(<SetupForm locale="de" />);
    expect(screen.getByText("dashboard.setup.loading")).toBeInTheDocument();
  });

  it("renders form after university and faculties load", async () => {
    mockFetchChain();
    render(<SetupForm locale="de" />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.setup.title")).toBeInTheDocument();
      expect(screen.getByText("Hochschule Hannover")).toBeInTheDocument();
      expect(screen.getByText("Fakultät IV")).toBeInTheDocument();
    });
  });

  it("shows load error when universities fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(<SetupForm locale="de" />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.setup.loadError")).toBeInTheDocument();
    });
  });

  it("loads programs when faculty is selected", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockUniversity })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFaculties })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPrograms });

    render(<SetupForm locale="de" />);
    await waitFor(() => screen.getByText("Fakultät IV"));

    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectFaculty"), {
      target: { value: "fac-1" },
    });

    await waitFor(() => {
      expect(screen.getByText("Informatik (Bachelor)")).toBeInTheDocument();
    });
  });

  it("loads exam regulations when program is selected", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockUniversity })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFaculties })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPrograms })
      .mockResolvedValueOnce({ ok: true, json: async () => mockExamRegs });

    render(<SetupForm locale="de" />);
    await waitFor(() => screen.getByText("Fakultät IV"));

    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectFaculty"), {
      target: { value: "fac-1" },
    });
    await waitFor(() => screen.getByText("Informatik (Bachelor)"));

    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectProgram"), {
      target: { value: "prog-1" },
    });
    await waitFor(() => {
      expect(screen.getByText("PO2021")).toBeInTheDocument();
    });
  });

  it("confirm button is disabled until exam reg and semester are selected", async () => {
    mockFetchChain();
    render(<SetupForm locale="de" />);
    await waitFor(() => screen.getByText("dashboard.setup.title"));
    expect(screen.getByText("dashboard.setup.confirm")).toBeDisabled();
  });

  it("calls POST and redirects on successful confirm", async () => {
    delete (window as any).location;
    window.location = { href: "" } as any;

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockUniversity })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFaculties })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPrograms })
      .mockResolvedValueOnce({ ok: true, json: async () => mockExamRegs })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ exam_regulation_id: "er-1" }) });

    render(<SetupForm locale="de" />);
    await waitFor(() => screen.getByText("Fakultät IV"));

    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectFaculty"), {
      target: { value: "fac-1" },
    });
    await waitFor(() => screen.getByText("Informatik (Bachelor)"));

    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectProgram"), {
      target: { value: "prog-1" },
    });
    await waitFor(() => screen.getByText("PO2021"));

    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectExamReg"), {
      target: { value: "er-1" },
    });
    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectSemester"), {
      target: { value: "WS2024/25" },
    });

    fireEvent.click(screen.getByText("dashboard.setup.confirm"));

    await waitFor(() => {
      expect(window.location.href).toBe("/de/dashboard");
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/study/program",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows save error when POST fails", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockUniversity })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFaculties })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPrograms })
      .mockResolvedValueOnce({ ok: true, json: async () => mockExamRegs })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: "Bereits vorhanden" }) });

    render(<SetupForm locale="de" />);
    await waitFor(() => screen.getByText("Fakultät IV"));

    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectFaculty"), {
      target: { value: "fac-1" },
    });
    await waitFor(() => screen.getByText("Informatik (Bachelor)"));
    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectProgram"), {
      target: { value: "prog-1" },
    });
    await waitFor(() => screen.getByText("PO2021"));
    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectExamReg"), {
      target: { value: "er-1" },
    });
    fireEvent.change(screen.getByDisplayValue("dashboard.setup.selectSemester"), {
      target: { value: "WS2024/25" },
    });

    fireEvent.click(screen.getByText("dashboard.setup.confirm"));

    await waitFor(() => {
      expect(screen.getByText("Bereits vorhanden")).toBeInTheDocument();
    });
  });
});
