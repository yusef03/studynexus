import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminModuleDetailPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminModule } from "@/hooks/admin/useAdminModules";
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
jest.mock("@/components/admin/ArchiveDialog", () => ({
  ArchiveDialog: ({ open, onConfirm, onClose, entityName }: any) => {
    if (!open) return null;
    return (
      <div data-testid="archive-dialog">
        <p>Archive {entityName}</p>
        <button onClick={() => onConfirm("Veraltet")} data-testid="confirm-archive">Confirm</button>
        <button onClick={onClose} data-testid="cancel-archive">Cancel</button>
      </div>
    );
  }
}));

const mockMessages = {
  admin: {
    modules: {
      detail: {
        notFound: "Module not found",
        back: "Back",
        infoSection: "Info",
        name: "Name",
        kuerzel: "Kürzel",
        ects: "ECTS",
        semEmpfehlung: "Sem. Empfehlung",
        modulTyp: "Modultyp",
        istBenotet: "Ist Benotet",
        maxVersuche: "Max. Versuche",
        gewichtung: "Gewichtung",
        pruefungsart: "Prüfungsart",
        sws: "SWS",
        hasPrereqs: "Hat Prerequisites",
        students: "{count} Students",
        prereqSection: "Prerequisites",
        noPrereqs: "No prerequisites",
        colPrereqType: "Type",
        colPrereqDesc: "Description",
        colPrereqEcts: "Min ECTS",
        colPrereqSems: "Req Sems",
        deletePrereq: "Delete",
        archiveBtn: "Archive"
      },
      form: {
        editTitle: "Edit Module",
        name: "Name",
        namePlaceholder: "Name PH",
        kuerzel: "Kürzel",
        kuerzelPlaceholder: "Kuerzel PH",
        ects: "ECTS",
        semEmpfehlung: "Sem. Empfehlung",
        modulTyp: "Modultyp",
        pflicht: "Pflicht",
        wahlpflicht: "Wahlpflicht",
        ergaenzend: "Ergänzend",
        pruefungsart: "Prüfungsart",
        pruefungsartPlaceholder: "Prüfungsart PH",
        maxVersuche: "Max. Versuche",
        gewichtung: "Gewichtung",
        sws: "SWS",
        istBenotet: "Ist Benotet",
        hasPrereqs: "Hat Prerequisites"
      }
    },
    prerequisites: {
      typeModule: "Module",
      typeEcts: "ECTS",
      typeSemester: "Semester",
      form: {
        createTitle: "Create Prereq",
        type: "Type",
        description: "Description",
        descriptionPlaceholder: "Desc PH",
        requiredModuleId: "Req Module ID",
        minimumEcts: "Min ECTS",
        requiredSemesters: "Req Sems",
        requiredSemestersPlaceholder: "Req Sems PH"
      }
    },
    common: {
      edit: "Edit",
      archive: "Archive",
      restore: "Restore",
      noSession: "Session expired",
      yes: "Yes",
      no: "No"
    },
    formModal: {
      cancel: "Cancel",
      create: "Create",
      save: "Save",
      saving: "Saving..."
    },
    status: {
      active: "Active",
      archived: "Archived"
    }
  }
};

const mockModule = {
  id: "mod-1",
  name: "Mathematik 1",
  kuerzel: "MAT1",
  ects: 5,
  semester_empfehlung: 1,
  modul_typ: "PFLICHT",
  ist_benotet: true,
  max_versuche: 3,
  gewichtung: 1,
  has_prerequisites: false,
  pruefungsart: "Klausur",
  sws: 4,
  is_archived: false,
  archive_reason: null,
  student_count: 42,
  exam_regulation_id: "er-1",
  prerequisites: [
    {
      id: "pre-1",
      prerequisite_type: "MODULE",
      description: "Needs MAT0",
      minimum_ects: null,
      required_semesters: null
    }
  ]
};

describe("AdminModuleDetailPage", () => {
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useAdminSession as jest.Mock).mockReturnValue({ token: "fake-token", isActive: true });
    (useAdminModule as jest.Mock).mockReturnValue({ data: mockModule, isLoading: false, error: null });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminModuleDetailPage params={{ id: "mod-1" }} />
      </NextIntlClientProvider>
    );
  };

  it("renders loading and error states", () => {
    (useAdminModule as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null });
    const { container, rerender } = render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminModuleDetailPage params={{ id: "mod-1" }} />
      </NextIntlClientProvider>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    (useAdminModule as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: true });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminModuleDetailPage params={{ id: "mod-1" }} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Module not found")).toBeInTheDocument();
  });

  it("renders module data and prereqs correctly", () => {
    renderPage();

    expect(screen.getAllByText("Mathematik 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MAT1").length).toBeGreaterThan(0);
    expect(screen.getByText("5 ECTS")).toBeInTheDocument();
    
    // Prereqs
    expect(screen.getByText("Needs MAT0")).toBeInTheDocument();
  });

  it("handles empty values for module data rendering", () => {
    (useAdminModule as jest.Mock).mockReturnValue({ 
      data: { 
        ...mockModule, 
        kuerzel: null, 
        semester_empfehlung: null, 
        pruefungsart: null, 
        sws: null, 
        prerequisites: [
          {
            id: "pre-2",
            prerequisite_type: "SEMESTER_COMPLETE",
            description: "JSON render",
            required_semesters: ["WS23"]
          }
        ]
      }, 
      isLoading: false, error: null 
    });
    
    renderPage();
    // Fallsbacks handled and JSON rendered
    expect(screen.getByText('["WS23"]')).toBeInTheDocument();
  });

  it("handles editing module (Happy Path)", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    
    // Change string fields
    await user.clear(screen.getByDisplayValue("Mathematik 1"));
    await user.type(screen.getByDisplayValue(""), "Mathematik 2");

    await user.clear(screen.getByDisplayValue("MAT1"));
    await user.type(screen.getByDisplayValue(""), "MAT2");

    await user.clear(screen.getByDisplayValue("Klausur"));
    await user.type(screen.getByDisplayValue(""), "Projekt");

    // Change number fields (ects, semEmpfehlung, maxVersuche, gewichtung, sws)
    const numberInputs = screen.getAllByRole("spinbutton");
    
    await user.clear(numberInputs[0]); // ECTS
    await user.type(numberInputs[0], "6");
    
    await user.clear(numberInputs[1]); // Sem Empf
    await user.type(numberInputs[1], "2");
    
    await user.clear(numberInputs[2]); // Max Versuche
    await user.type(numberInputs[2], "2");
    
    await user.clear(numberInputs[3]); // Gewichtung
    await user.type(numberInputs[3], "1.5");
    
    await user.clear(numberInputs[4]); // SWS
    await user.type(numberInputs[4], "3");

    // Change Select
    await user.selectOptions(screen.getByRole("combobox"), "WAHLPFLICHT");

    // Change Checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // ist_benotet -> false
    fireEvent.click(checkboxes[1]); // has_prerequisites -> true

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules/mod-1", "PATCH", {
        body: {
          name: "Mathematik 2",
          kuerzel: "MAT2",
          ects: 6,
          semester_empfehlung: 2,
          modul_typ: "WAHLPFLICHT",
          ist_benotet: false,
          max_versuche: 2,
          gewichtung: 1.5,
          has_prerequisites: true,
          pruefungsart: "Projekt",
          sws: 3,
        }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-module", "mod-1"] });
    });
  });
  
  it("handles editing module (Sad Path - Fallbacks)", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    
    // Clear nullable fields to test fallbacks to null
    await user.clear(screen.getByDisplayValue("MAT1"));
    await user.clear(screen.getByDisplayValue("Klausur"));
    
    const numberInputs = screen.getAllByRole("spinbutton");
    await user.clear(numberInputs[0]); // ECTS -> falls back to 5
    await user.clear(numberInputs[1]); // Sem Empf -> falls back to null
    await user.clear(numberInputs[2]); // Max Versuche -> falls back to 3
    await user.clear(numberInputs[3]); // Gewichtung -> falls back to 1
    await user.clear(numberInputs[4]); // SWS -> falls back to null

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules/mod-1", "PATCH", {
        body: expect.objectContaining({
          kuerzel: null,
          ects: 5, // fallback
          semester_empfehlung: null,
          max_versuche: 3, // fallback
          gewichtung: 1, // fallback
          pruefungsart: null,
          sws: null,
        })
      });
    });
  });

  it("handles cancel in edit modal", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButtons[0]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Name PH")).not.toBeInTheDocument();
    });
  });

  it("handles creating prerequisite (Type: MODULE)", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Create Prereq" }));
    
    // Sad Path (empty submit)
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(adminMutate).not.toHaveBeenCalled();

    // Happy Path
    await user.type(screen.getByPlaceholderText("Desc PH"), "Need MAT0");
    await user.selectOptions(screen.getByRole("combobox"), "MODULE");
    await user.type(screen.getByPlaceholderText("UUID"), "mod-0");

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("prerequisites", "POST", {
        body: {
          module_id: "mod-1",
          prerequisite_type: "MODULE",
          description: "Need MAT0",
          required_module_id: "mod-0",
          minimum_ects: null,
          required_semesters: null
        }
      });
    });
  });

  it("handles creating prerequisite (Type: ECTS_THRESHOLD)", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Create Prereq" }));
    await user.type(screen.getByPlaceholderText("Desc PH"), "Need 30 ECTS");
    await user.selectOptions(screen.getByRole("combobox"), "ECTS_THRESHOLD");
    await user.type(screen.getByRole("spinbutton"), "30");

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("prerequisites", "POST", {
        body: expect.objectContaining({
          prerequisite_type: "ECTS_THRESHOLD",
          minimum_ects: 30,
        })
      });
    });
  });

  it("handles creating prerequisite (Type: SEMESTER_COMPLETE)", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Create Prereq" }));
    await user.type(screen.getByPlaceholderText("Desc PH"), "Need Semester 1 and 2");
    await user.selectOptions(screen.getByRole("combobox"), "SEMESTER_COMPLETE");
    fireEvent.change(screen.getByPlaceholderText("Req Sems PH"), { target: { value: '["WS23", "SS24"]' } });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("prerequisites", "POST", {
        body: expect.objectContaining({
          prerequisite_type: "SEMESTER_COMPLETE",
          required_semesters: ["WS23", "SS24"],
        })
      });
    });
  });
  
  it("handles creating prerequisite with invalid JSON for SEMESTER_COMPLETE", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Create Prereq" }));
    await user.type(screen.getByPlaceholderText("Desc PH"), "Bad JSON");
    await user.selectOptions(screen.getByRole("combobox"), "SEMESTER_COMPLETE");
    fireEvent.change(screen.getByPlaceholderText("Req Sems PH"), { target: { value: 'invalid-json' } });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("prerequisites", "POST", {
        body: expect.objectContaining({
          required_semesters: null,
        })
      });
    });
  });

  it("handles cancel in prereq modal", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Create Prereq" }));
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Desc PH")).not.toBeInTheDocument();
    });
  });

  it("handles deleting prerequisite", async () => {
    renderPage();

    // Click delete icon (Trash2)
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("prerequisites/pre-1", "DELETE", { adminToken: "fake-token" });
    });
  });

  it("handles archive and restore", async () => {
    const { rerender } = renderPage();

    // Archive flow
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    
    // Inside dialog
    fireEvent.click(screen.getByTestId("confirm-archive"));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules/mod-1/archive", "POST", {
        body: { reason: "Veraltet" },
        adminToken: "fake-token"
      });
    });

    // Re-render with archived state
    (useAdminModule as jest.Mock).mockReturnValue({ 
      data: { ...mockModule, is_archived: true, archive_reason: "Veraltet" }, 
      isLoading: false, error: null 
    });
    
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminModuleDetailPage params={{ id: "mod-1" }} />
      </NextIntlClientProvider>
    );

    // Restore flow
    expect(screen.getByText("Veraltet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules/mod-1/restore", "POST", {
        adminToken: "fake-token"
      });
    });
  });

  it("handles cancel in archive dialog", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    fireEvent.click(screen.getByTestId("cancel-archive"));
    await waitFor(() => {
      expect(screen.queryByTestId("archive-dialog")).not.toBeInTheDocument();
    });
  });

  it("handles session expiration", () => {
    (useAdminSession as jest.Mock).mockReturnValue({
      token: null,
      isActive: false,
    });
    
    renderPage();

    expect(screen.getByRole("button", { name: "Archive" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByText("Session expired")).toBeInTheDocument();
  });
});
