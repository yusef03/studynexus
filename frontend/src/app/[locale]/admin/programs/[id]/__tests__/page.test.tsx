import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminProgramDetailPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminProgram } from "@/hooks/admin/useAdminPrograms";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Mocks
jest.mock("@/hooks/admin/useAdminPrograms");
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
    programs: {
      detail: {
        notFound: "Program not found",
        back: "Back",
        infoSection: "Info",
        name: "Name",
        abschluss: "Abschluss",
        regelstudienzeit: "Regelstudienzeit",
        gesamtEcts: "Gesamt ECTS",
        semesterSuffix: "Semester",
        students: "{count} Students",
        examRegsSection: "Exam Regulations",
        noExamRegs: "No exam regulations",
        istAktuell: "Aktuell",
        colErDate: "Gültig ab",
        openEr: "Open",
        addExamReg: "Add ExamReg"
      },
      form: {
        editTitle: "Edit Program",
        name: "Name",
        namePlaceholder: "Name PH",
        abschluss: "Abschluss",
        abschlussPlaceholder: "Abschluss PH",
        regelstudienzeit: "Regelstudienzeit",
        gesamtEcts: "Gesamt ECTS"
      },
      examRegForm: {
        createTitle: "Create ExamReg",
        version: "Version",
        versionPlaceholder: "Version PH",
        gueltigAb: "Gültig ab",
        gueltigAbPlaceholder: "Gueltig ab PH",
        istAktuell: "Ist Aktuell"
      }
    },
    common: {
      edit: "Edit",
      archive: "Archive",
      restore: "Restore",
      noSession: "Session expired"
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

const mockProgram = {
  id: "prog-1",
  name: "Informatik",
  abschluss: "B.Sc.",
  regelstudienzeit: 7,
  gesamt_ects: 210,
  faculty_id: "fac-1",
  is_archived: false,
  archive_reason: null,
  student_count: 42,
  exam_regulations: [
    {
      id: "er-1",
      version: "PO 2023",
      gueltig_ab: "2023-09-01",
      ist_aktuell: true,
      is_archived: false,
      program_id: "prog-1"
    }
  ]
};

describe("AdminProgramDetailPage", () => {
  const mockPush = jest.fn();
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useAdminSession as jest.Mock).mockReturnValue({ token: "fake-token", isActive: true });
    (useAdminProgram as jest.Mock).mockReturnValue({ data: mockProgram, isLoading: false, error: null });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminProgramDetailPage params={{ id: "prog-1" }} />
      </NextIntlClientProvider>
    );
  };

  it("renders loading and error states", () => {
    (useAdminProgram as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null });
    const { container, rerender } = render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminProgramDetailPage params={{ id: "prog-1" }} />
      </NextIntlClientProvider>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    (useAdminProgram as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: true });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminProgramDetailPage params={{ id: "prog-1" }} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Program not found")).toBeInTheDocument();
  });

  it("renders program data correctly", () => {
    renderPage();

    expect(screen.getAllByText("Informatik").length).toBeGreaterThan(0);
    expect(screen.getByText("42 Students")).toBeInTheDocument();
    expect(screen.getByText("PO 2023")).toBeInTheDocument();
    expect(screen.getByText("Gültig ab: 2023-09-01")).toBeInTheDocument();
  });

  it("handles editing program (Happy Path)", async () => {
    const user = userEvent.setup();
    renderPage();

    // Open Modal
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    
    // Check initial values
    expect(screen.getByDisplayValue("Informatik")).toBeInTheDocument();
    
    // Change value
    await user.type(screen.getByDisplayValue("Informatik"), " Update");
    
    // Change other fields to hit onChange coverage
    const numberInputs = screen.getAllByRole("spinbutton");
    await user.clear(numberInputs[0]); // regelstudienzeit
    await user.type(numberInputs[0], "6");
    await user.clear(numberInputs[1]); // gesamt_ects
    await user.type(numberInputs[1], "180");
    await user.clear(screen.getByDisplayValue("B.Sc."));
    await user.type(screen.getByDisplayValue(""), "M.Sc.");

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("programs/prog-1", "PATCH", {
        body: {
          name: "Informatik Update",
          abschluss: "M.Sc.",
          regelstudienzeit: 6,
          gesamt_ects: 180,
        }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-program", "prog-1"] });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-programs"] });
    });
  });

  it("handles cancel in edit modal", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]); // [1] because Archive Dialog has Cancel too, or just first Cancel in DOM. Actually wait, Archive dialog is closed so it returns null! 
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Name PH")).not.toBeInTheDocument();
    });
  });

  it("handles adding an exam regulation (Happy & Sad Path)", async () => {
    const user = userEvent.setup();
    renderPage();

    // Open Modal
    fireEvent.click(screen.getByRole("button", { name: "Add ExamReg" }));
    
    // Sad Path: Submit empty
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(adminMutate).not.toHaveBeenCalled();

    // Happy Path
    await user.type(screen.getByPlaceholderText("Version PH"), "PO 2024");
    await user.type(screen.getByPlaceholderText("Gueltig ab PH"), "2024-10-01");
    fireEvent.click(screen.getByRole("checkbox")); // ist_aktuell true

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("exam-regulations", "POST", {
        body: {
          program_id: "prog-1",
          version: "PO 2024",
          gueltig_ab: "2024-10-01",
          ist_aktuell: true,
        }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-program", "prog-1"] });
    });
  });

  it("handles cancel in exam reg modal", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Add ExamReg" }));
    // Depending on DOM, the cancel button might be the only one or multiple
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Version PH")).not.toBeInTheDocument();
    });
  });

  it("handles archive and restore", async () => {
    const { rerender } = renderPage();

    // Archive flow
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    
    // Inside dialog
    fireEvent.click(screen.getByTestId("confirm-archive"));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("programs/prog-1/archive", "POST", {
        body: { reason: "Veraltet" },
        adminToken: "fake-token"
      });
    });

    // Re-render with archived state
    (useAdminProgram as jest.Mock).mockReturnValue({ 
      data: { ...mockProgram, is_archived: true, archive_reason: "Veraltet" }, 
      isLoading: false, error: null 
    });
    
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminProgramDetailPage params={{ id: "prog-1" }} />
      </NextIntlClientProvider>
    );

    // Restore flow
    expect(screen.getByText("Begründung: Veraltet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("programs/prog-1/restore", "POST", {
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
    expect(screen.getByText("Session expired")).toBeInTheDocument();
  });
});
