import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModuleModal } from "../ModuleModal";
import type { StudentModuleResponse } from "@/types/study";

jest.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

function makeModule(overrides: Partial<StudentModuleResponse> = {}): StudentModuleResponse {
  return {
    id: "sm-1",
    user_id: "user-1",
    module_id: "mod-1",
    custom_name: null,
    custom_ects: null,
    status: "PLANNED",
    note: null,
    versuch_nummer: 1,
    anmelde_datum: null,
    pruefungs_datum: null,
    semester: null,
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
    ...overrides,
  };
}

const noop = () => {};

describe("ModuleModal", () => {
  afterEach(() => jest.clearAllMocks());

  it("does not render when closed", () => {
    render(<ModuleModal studentModule={makeModule()} open={false} onClose={noop} onSave={noop} />);
    expect(screen.queryByText("dashboard.modal.title")).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    render(<ModuleModal studentModule={makeModule()} open={true} onClose={noop} onSave={noop} />);
    expect(screen.getByText("dashboard.modal.title")).toBeInTheDocument();
    expect(screen.getByText("Programmieren 1")).toBeInTheDocument();
  });

  it("shows note input for graded module", () => {
    render(<ModuleModal studentModule={makeModule()} open={true} onClose={noop} onSave={noop} />);
    expect(screen.getByLabelText("dashboard.modal.note")).toBeInTheDocument();
  });

  it("hides note input and shows badge for ungraded module", () => {
    const sm = makeModule({ module: { ...makeModule().module!, ist_benotet: false } });
    render(<ModuleModal studentModule={sm} open={true} onClose={noop} onSave={noop} />);
    expect(screen.queryByLabelText("dashboard.modal.note")).not.toBeInTheDocument();
    expect(screen.getByText("dashboard.modal.noteUngraded")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = jest.fn();
    render(<ModuleModal studentModule={makeModule()} open={true} onClose={onClose} onSave={noop} />);
    fireEvent.click(screen.getByLabelText("dashboard.modal.close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSave with updated module after successful PUT", async () => {
    const updated = makeModule({ status: "PASSED", note: 2.3 });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => updated,
    });

    const onSave = jest.fn();
    render(<ModuleModal studentModule={makeModule()} open={true} onClose={noop} onSave={onSave} />);

    fireEvent.click(screen.getByText("dashboard.modal.save"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(updated);
    });
  });

  it("shows error message on failed PUT", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Validation error" }),
    });

    render(<ModuleModal studentModule={makeModule()} open={true} onClose={noop} onSave={noop} />);
    fireEvent.click(screen.getByText("dashboard.modal.save"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Validation error");
    });
  });
});
