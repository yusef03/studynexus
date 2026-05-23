import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminExamRegDetailPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminExamReg, useAdminModules } from "@/hooks/admin/useAdminModules";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Mocks
jest.mock("@/hooks/admin/useAdminModules");
jest.mock("@/hooks/useAdminSession");
jest.mock("@/lib/adminFetch");
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("next-intl", () => {
  const actual = jest.requireActual("next-intl");
  return {
    ...actual,
    useLocale: () => "de",
  };
});

const mockMessages = {
  admin: {
    common: {
      edit: "Edit",
      yes: "Yes",
      no: "No",
      noSession: "No session",
      restore: "Restore"
    },
    formModal: {
      create: "Create",
      save: "Save",
      cancel: "Cancel",
      saving: "Saving"
    },
    archiveDialog: {
      reasonPlaceholder: "Reason",
      confirm: "Confirm Archive",
      cancel: "Cancel"
    },
    examRegs: {
      notFound: "Not found",
      back: "Back",
      istAktuell: "Current",
      moduleCount: "{count} modules",
      infoSection: "Info",
      version: "Version",
      gueltigAb: "Valid From",
      programLabel: "Program",
      searchPlaceholder: "Search...",
      jsonImport: "JSON Import",
      addModule: "Add Module",
      noModules: "No modules",
      colKuerzel: "Short",
      colName: "Name",
      colEcts: "ECTS",
      colSem: "Sem",
      colTyp: "Type",
      colPA: "Exam",
      colStatus: "Status",
      filterAll: "All",
      filterActive: "Active",
      filterArchived: "Archived",
      archiveEr: "Archive ER",
      jsonImportTitle: "JSON Import Title",
      jsonImportDesc: "Import JSON",
      jsonImportPlaceholder: "Paste JSON",
      jsonImportResult: "{created} created, {skipped} skipped",
      form: {
        editTitle: "Edit ER",
        version: "Version",
        gueltigAb: "Valid from",
        gueltigAbPlaceholder: "YYYY-MM-DD",
        istAktuell: "Is Current"
      }
    },
    modules: {
      title: "Module Catalog",
      form: {
        createTitle: "Create Module",
        name: "Name",
        namePlaceholder: "Module Name",
        kuerzel: "Short",
        kuerzelPlaceholder: "Short code",
        ects: "ECTS",
        semEmpfehlung: "Sem",
        modulTyp: "Type",
        pflicht: "PFLICHT",
        wahlpflicht: "WAHLPFLICHT",
        ergaenzend: "ERGAENZEND",
        pruefungsart: "Exam",
        pruefungsartPlaceholder: "Exam type",
        maxVersuche: "Attempts",
        gewichtung: "Weight",
        sws: "SWS",
        istBenotet: "Graded",
        hasPrereqs: "Prereqs"
      }
    },
    status: {
      archived: "Archived"
    }
  }
};

const mockEr = {
  id: "er-1",
  program_id: "prog-1",
  version: "PO 2023",
  gueltig_ab: "2023-10-01",
  ist_aktuell: true,
  is_archived: false,
  archive_reason: null,
  module_count: 2
};

const mockModules = [
  {
    id: "mod-1",
    name: "Math 1",
    kuerzel: "M1",
    ects: 5,
    semester_empfehlung: 1,
    modul_typ: "PFLICHT",
    pruefungsart: "Klausur",
    is_archived: false
  },
  {
    id: "mod-2",
    name: "Physics 1",
    kuerzel: "P1",
    ects: 6,
    semester_empfehlung: null,
    modul_typ: "WAHLPFLICHT",
    pruefungsart: null,
    is_archived: true
  },
  {
    id: "mod-3",
    name: "Art 1",
    kuerzel: null,
    ects: 3,
    semester_empfehlung: 2,
    modul_typ: "ERGAENZEND",
    pruefungsart: "Project",
    is_archived: false
  }
];

describe("AdminExamRegDetailPage", () => {
  const mockInvalidateQueries = jest.fn();
  const mockBack = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: mockPush });
    (useAdminSession as jest.Mock).mockReturnValue({ token: "token", isActive: true });
    
    (useAdminExamReg as jest.Mock).mockReturnValue({ data: mockEr, isLoading: false, error: null });
    (useAdminModules as jest.Mock).mockReturnValue({ data: mockModules, isLoading: false });
    (adminMutate as jest.Mock).mockResolvedValue({});
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminExamRegDetailPage params={{ id: "er-1" }} />
      </NextIntlClientProvider>
    );
  };

  it("renders loading and error states for ER", () => {
    (useAdminExamReg as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null });
    const { container, rerender } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    (useAdminExamReg as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: new Error("Fail") });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminExamRegDetailPage params={{ id: "er-1" }} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Not found")).toBeInTheDocument();
    
    // Test back button
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("renders ER details and module table correctly", () => {
    renderPage();

    expect(screen.getAllByText("PO 2023")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Current")[0]).toBeInTheDocument();
    // Program link back
    expect(screen.getByText("prog-1")).toHaveAttribute("href", "/de/admin/programs/prog-1");

    // Modules
    expect(screen.getByText("Math 1")).toBeInTheDocument();
    expect(screen.getByText("Physics 1")).toBeInTheDocument();
    expect(screen.getByText("Art 1")).toBeInTheDocument();

    // Module row click
    fireEvent.click(screen.getByText("Math 1"));
    expect(mockPush).toHaveBeenCalledWith("/de/admin/modules/mod-1");
  });

  it("filters modules by status and search", async () => {
    const user = userEvent.setup();
    renderPage();

    // Active
    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(screen.getByText("Math 1")).toBeInTheDocument();
    expect(screen.queryByText("Physics 1")).not.toBeInTheDocument();

    // Archived
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(screen.queryByText("Math 1")).not.toBeInTheDocument();
    expect(screen.getByText("Physics 1")).toBeInTheDocument();

    // All & Search
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    await user.type(screen.getByPlaceholderText("Search..."), "Math");
    expect(screen.getByText("Math 1")).toBeInTheDocument();
    expect(screen.queryByText("Physics 1")).not.toBeInTheDocument();
  });

  it("handles Edit ER mutation", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const versionInput = screen.getAllByRole("textbox")[1]; // first is search, second is version
    fireEvent.change(versionInput, { target: { value: "PO 2024" } });

    const dateInput = screen.getAllByRole("textbox")[2];
    fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

    const checkbox = screen.getByRole("checkbox", { name: "Is Current" });
    fireEvent.click(checkbox); // uncheck it

    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]); // submit

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("exam-regulations/er-1", "PATCH", {
        body: { version: "PO 2024", gueltig_ab: "2024-01-01", ist_aktuell: false }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-exam-reg", "er-1"] });
    });
  });

  it("handles empty date gracefully in Edit ER", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const dateInput = screen.getAllByRole("textbox")[2];
    fireEvent.change(dateInput, { target: { value: "" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]);

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("exam-regulations/er-1", "PATCH", {
        body: { version: "PO 2023", gueltig_ab: null, ist_aktuell: true }
      });
    });
  });

  it("handles Add Module mutation", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Add Module" }));

    // Name (required)
    fireEvent.change(screen.getByPlaceholderText("Module Name"), { target: { value: "Chemistry 1" } });
    fireEvent.change(screen.getByPlaceholderText("Short code"), { target: { value: "C1" } });
    
    // Spinbuttons: ECTS, Sem, Max, Weight, SWS
    const [ectsInput, semInput, maxInput, gewichtInput, swsInput] = screen.getAllByRole("spinbutton");
    
    // ECTS
    fireEvent.change(ectsInput, { target: { value: "8" } });

    // SWS
    fireEvent.change(swsInput, { target: { value: "4" } });

    // Sem
    fireEvent.change(semInput, { target: { value: "2" } });

    // ModulTyp Select
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "WAHLPFLICHT" } });

    // Pruefungsart
    fireEvent.change(screen.getByPlaceholderText("Exam type"), { target: { value: "Oral" } });

    // Max Versuche
    fireEvent.change(maxInput, { target: { value: "2" } });

    // Gewichtung
    fireEvent.change(gewichtInput, { target: { value: "1.5" } });

    // Checkboxes
    const gradedBox = screen.getByRole("checkbox", { name: "Graded" });
    fireEvent.click(gradedBox); // Uncheck it
    
    const prereqBox = screen.getByRole("checkbox", { name: "Prereqs" });
    fireEvent.click(prereqBox); // Check it

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules", "POST", {
        body: {
          exam_regulation_id: "er-1",
          name: "Chemistry 1",
          kuerzel: "C1",
          ects: 8,
          semester_empfehlung: 2,
          modul_typ: "WAHLPFLICHT",
          ist_benotet: false,
          max_versuche: 2,
          gewichtung: 1.5,
          has_prerequisites: true,
          pruefungsart: "Oral",
          sws: 4
        }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-modules", "er-1", true] });
    });
  });

  it("handles Add Module with empty string fallbacks (nulls)", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Add Module" }));

    fireEvent.change(screen.getByPlaceholderText("Module Name"), { target: { value: "Basic" } });
    
    const [ectsInput, semInput, maxInput, gewichtInput, swsInput] = screen.getAllByRole("spinbutton");
    
    fireEvent.change(ectsInput, { target: { value: "" } }); // empty -> fallback 5
    fireEvent.change(swsInput, { target: { value: "" } }); // empty -> fallback null
    fireEvent.change(semInput, { target: { value: "" } }); // empty -> fallback null
    fireEvent.change(maxInput, { target: { value: "" } }); // empty -> fallback 3
    fireEvent.change(gewichtInput, { target: { value: "" } }); // empty -> fallback 1

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules", "POST", {
        body: expect.objectContaining({
          exam_regulation_id: "er-1",
          name: "Basic",
          kuerzel: null,
          ects: 5,
          semester_empfehlung: null,
          pruefungsart: null,
          max_versuche: 3,
          gewichtung: 1,
          sws: null,
        })
      });
    });
  });

  it("blocks Add Module if name is empty", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add Module" }));
    // Don't type anything in Name
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(adminMutate).not.toHaveBeenCalled();
  });

  it("handles JSON Import workflow", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "JSON Import" }));

    const textarea = screen.getByPlaceholderText("Paste JSON");

    // Invalid JSON
    fireEvent.change(textarea, { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" })); // Create is the generic button variant string
    expect(screen.getByText("Invalid JSON")).toBeInTheDocument();

    // Not an array
    fireEvent.change(textarea, { target: { value: '{"test": 1}' } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText("Expected a JSON array")).toBeInTheDocument();

    // Valid JSON
    (adminMutate as jest.Mock).mockResolvedValue({ created: 5, skipped: 0, errors: [] });
    fireEvent.change(textarea, { target: { value: '[{"name": "Valid"}]' } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules/import/json", "POST", {
        body: { exam_regulation_id: "er-1", modules: [{ name: "Valid" }] }
      });
      expect(screen.getByText("5 created, 0 skipped")).toBeInTheDocument();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-modules", "er-1", true] });
    });
  });

  it("handles JSON Import errors from server response", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "JSON Import" }));

    const textarea = screen.getByPlaceholderText("Paste JSON");
    
    (adminMutate as jest.Mock).mockResolvedValue({ created: 1, skipped: 1, errors: ["Missing ECTS"] });
    fireEvent.change(textarea, { target: { value: '[{"name": "Valid"}]' } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByText("(1 errors)")).toBeInTheDocument();
    });
  });

  it("handles Archiving workflow", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Archive ER" }));
    
    fireEvent.change(screen.getByPlaceholderText("Reason"), { target: { value: "Old format" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Confirm Archive" })[0]);

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("exam-regulations/er-1/archive", "POST", {
        body: { reason: "Old format" },
        adminToken: "token"
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-exam-reg", "er-1"] });
    });
  });

  it("handles Restore workflow", async () => {
    (useAdminExamReg as jest.Mock).mockReturnValue({
      data: { ...mockEr, is_archived: true, archive_reason: "Archived because old" },
      isLoading: false, error: null
    });
    renderPage();

    expect(screen.getByText("Archived because old")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("exam-regulations/er-1/restore", "POST", {
        adminToken: "token"
      });
    });
  });

  it("blocks Archive and Restore when session is inactive", () => {
    (useAdminSession as jest.Mock).mockReturnValue({ token: null, isActive: false });
    
    (useAdminExamReg as jest.Mock).mockReturnValue({
      data: { ...mockEr, is_archived: false },
      isLoading: false, error: null
    });
    
    const { rerender } = renderPage();
    
    expect(screen.getByText("No session")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive ER" })).toBeDisabled();

    // Now test restore blocked
    (useAdminExamReg as jest.Mock).mockReturnValue({
      data: { ...mockEr, is_archived: true },
      isLoading: false, error: null
    });

    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminExamRegDetailPage params={{ id: "er-1" }} />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("button", { name: "Restore" })).toBeDisabled();
  });

  it("renders empty module catalog properly", () => {
    (useAdminModules as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderPage();
    expect(screen.getByText("No modules")).toBeInTheDocument();
  });

  it("renders module loading skeletons", () => {
    (useAdminModules as jest.Mock).mockReturnValue({ data: [], isLoading: true });
    const { container } = renderPage();
    // 4 pulse elements
    expect(container.querySelectorAll(".animate-pulse").length).toBe(4);
  });

  it("handles modal cancellations (onClose handlers)", () => {
    renderPage();

    // 1. Edit ER Modal
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Edit ER")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);

    // 2. Add Module Modal
    fireEvent.click(screen.getByRole("button", { name: "Add Module" }));
    expect(screen.getByText("Create Module")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);

    // 3. JSON Import Modal
    fireEvent.click(screen.getByRole("button", { name: "JSON Import" }));
    expect(screen.getByText("JSON Import Title")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);

    // 4. Archive Dialog
    fireEvent.click(screen.getByRole("button", { name: "Archive ER" }));
    expect(screen.getAllByText("Archive ER")[0]).toBeInTheDocument();
    // We get all cancels because ArchiveDialog also renders a cancel
    const cancels = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancels[cancels.length - 1]);
  });
});
