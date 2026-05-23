import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUniversityDetailPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminUniversity } from "@/hooks/admin/useAdminUniversities";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Mocks
jest.mock("@/hooks/admin/useAdminUniversities");
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
jest.mock("@/components/admin/DeleteDialog", () => ({
  DeleteDialog: ({ open, onConfirm, onClose }: any) => {
    if (!open) return null;
    return (
      <div data-testid="delete-dialog">
        <button onClick={onConfirm} data-testid="confirm-delete">Confirm</button>
        <button onClick={onClose} data-testid="cancel-delete">Cancel</button>
      </div>
    );
  }
}));

const mockMessages = {
  admin: {
    universities: {
      detail: {
        notFound: "Uni not found",
        back: "Back",
        infoSection: "Info",
        name: "Name",
        kuerzel: "Kürzel",
        stadt: "Stadt",
        bundesland: "Bundesland",
        typ: "Typ",
        facultiesSection: "Faculties",
        noFaculties: "No faculties",
        colFacultyActions: "Delete Faculty",
        addFaculty: "Add Faculty",
        deleteUni: "Delete Uni",
        deleteUniDesc: "Danger delete uni",
      },
      form: {
        editTitle: "Edit Uni",
        name: "Name",
        namePlaceholder: "Name PH",
        kuerzel: "Kürzel",
        kuerzelPlaceholder: "Kürzel PH",
        stadt: "Stadt",
        stadtPlaceholder: "Stadt PH",
        bundesland: "Bundesland",
        bundeslandPlaceholder: "Bundesland PH",
        typ: "Typ",
        fh: "FH",
        uni: "Uni",
      },
      facultyForm: {
        createTitle: "Create Faculty",
        name: "Name",
        namePlaceholder: "Name PH",
        kuerzel: "Kürzel",
        kuerzelPlaceholder: "Kürzel PH",
      }
    },
    formModal: {
      cancel: "Cancel",
      create: "Create",
      save: "Save",
      saving: "Saving..."
    },
    common: {
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      saved: "Saved successfully",
      saveError: "Save failed",
      noSession: "Session expired"
    }
  }
};

const mockUniversity = {
  id: "uni-1",
  name: "Hochschule Hannover",
  kuerzel: "HsH",
  stadt: "Hannover",
  bundesland: "Niedersachsen",
  typ: "FH",
  faculties: [
    { id: "fac-1", name: "Fakultät 1", kuerzel: "F1" }
  ]
};

describe("AdminUniversityDetailPage", () => {
  const mockPush = jest.fn();
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useAdminSession as jest.Mock).mockReturnValue({ token: "fake-token", isActive: true });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminUniversityDetailPage params={{ id: "uni-1" }} />
      </NextIntlClientProvider>
    );
  };

  it("renders loading and error states", () => {
    (useAdminUniversity as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null });
    const { container, rerender } = render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminUniversityDetailPage params={{ id: "uni-1" }} />
      </NextIntlClientProvider>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    (useAdminUniversity as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: true });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminUniversityDetailPage params={{ id: "uni-1" }} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Uni not found")).toBeInTheDocument();
  });

  it("renders university data correctly", () => {
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: {
        id: "uni-1",
        name: "Hochschule Hannover",
        kuerzel: "HsH",
        stadt: "Hannover",
        bundesland: "Niedersachsen",
        typ: "FH",
        faculties: [
          { id: "fac-1", name: "Fakultät IV", kuerzel: "F4" }
        ]
      },
      isLoading: false,
      error: null
    });

    renderPage();

    expect(screen.getAllByText("Hochschule Hannover").length).toBeGreaterThan(0);
    expect(screen.getByText("Fakultät IV")).toBeInTheDocument();
  });

  it("handles editing university (Happy & Sad Path)", async () => {
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: {
        id: "uni-1",
        name: "HsH",
        kuerzel: "H",
        stadt: "H",
        bundesland: "N",
        typ: "FH",
        faculties: []
      },
      isLoading: false,
      error: null
    });

    const user = userEvent.setup();
    renderPage();

    // Open Edit Modal
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Edit Uni")).toBeInTheDocument();

    // Sad Path (Mock Rejection)
    (adminMutate as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    
    await waitFor(() => {
      expect(screen.getByText("Save failed")).toBeInTheDocument();
      expect(screen.getByText("Save failed")).toHaveClass("text-red-500");
    });

    // Happy Path (Change type to Uni and save)
    (adminMutate as jest.Mock).mockResolvedValueOnce({});
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Uni" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("universities/uni-1", "PATCH", {
        body: { name: "HsH", kuerzel: "H", stadt: "H", bundesland: "N", typ: "Uni" }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-university", "uni-1"] });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-universities"] });
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
      // Modal should be closed
      expect(screen.queryByText("Edit Uni")).not.toBeInTheDocument();
    });
  });

  it("handles adding a faculty", async () => {
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: { id: "uni-1", faculties: [] },
      isLoading: false,
      error: null
    });
    (adminMutate as jest.Mock).mockResolvedValue({});

    const user = userEvent.setup();
    renderPage();

    // Open Add Faculty Modal
    fireEvent.click(screen.getByRole("button", { name: "Add Faculty" }));
    
    // Sad Path: Try to submit empty form
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(adminMutate).not.toHaveBeenCalled(); // due to early return

    // Happy Path: Fill form and submit
    await user.type(screen.getByPlaceholderText("Name PH"), "Fakultät I");
    await user.type(screen.getByPlaceholderText("Kürzel PH"), "F1");
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("faculties", "POST", {
        body: { university_id: "uni-1", name: "Fakultät I", kuerzel: "F1" }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-university", "uni-1"] });
      expect(screen.queryByText("Create Faculty")).not.toBeInTheDocument();
    });
  });

  it("handles deleting a faculty", async () => {
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: { id: "uni-1", faculties: [{ id: "fac-1", name: "Fakultät 1", kuerzel: "F1" }] },
      isLoading: false,
      error: null
    });
    (adminMutate as jest.Mock).mockResolvedValue({});

    renderPage();

    // Click trash icon
    fireEvent.click(screen.getByTitle("Delete Faculty"));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("faculties/fac-1", "DELETE", { adminToken: "fake-token" });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-university", "uni-1"] });
    });
  });

  it("prevents deleting university if faculties exist", () => {
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: { id: "uni-1", faculties: [{ id: "fac-1" }] },
      isLoading: false,
      error: null
    });

    renderPage();

    // Danger zone should NOT render
    expect(screen.queryByText("Delete Uni")).not.toBeInTheDocument();
  });

  it("allows deleting university if no faculties exist", async () => {
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: { id: "uni-1", name: "Test Uni", faculties: [] },
      isLoading: false,
      error: null
    });
    (adminMutate as jest.Mock).mockResolvedValue({});

    renderPage();

    // Danger zone should render
    expect(screen.getByText("Delete Uni")).toBeInTheDocument();

    // Click delete
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    // Confirm dialog
    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    
    // Test cancel
    fireEvent.click(screen.getByTestId("cancel-delete"));
    expect(screen.queryByTestId("delete-dialog")).not.toBeInTheDocument();

    // Open again and confirm
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByTestId("confirm-delete"));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("universities/uni-1", "DELETE", { adminToken: "fake-token" });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-universities"] });
      expect(mockPush).toHaveBeenCalledWith("/de/admin/universities");
    });
  });

  it("handles security guard (expired session)", () => {
    (useAdminSession as jest.Mock).mockReturnValue({ token: null, isActive: false });
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: { id: "uni-1", faculties: [{ id: "fac-1" }] },
      isLoading: false,
      error: null
    });

    const { rerender } = render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminUniversityDetailPage params={{ id: "uni-1" }} />
      </NextIntlClientProvider>
    );

    // With faculties: delete faculty button should NOT be rendered
    expect(screen.queryByTitle("Delete Faculty")).not.toBeInTheDocument();

    // Without faculties: delete uni button should be disabled
    (useAdminUniversity as jest.Mock).mockReturnValue({
      data: { id: "uni-1", faculties: [] },
      isLoading: false,
      error: null
    });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminUniversityDetailPage params={{ id: "uni-1" }} />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByText("Session expired")).toBeInTheDocument();
  });

  it("handles cancel in edit modal", async () => {
    (useAdminSession as jest.Mock).mockReturnValue({ isActive: true });
    (useAdminUniversity as jest.Mock).mockReturnValue({ data: mockUniversity, isLoading: false, isError: false });
    const user = userEvent.setup();
    renderPage();

    // Open Edit Modal
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    
    // Change a value to trigger onChange
    await user.type(screen.getByDisplayValue("Hochschule Hannover"), " Update");

    // Close Modal
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Name PH")).not.toBeInTheDocument();
    });
  });

  it("handles cancel in add faculty modal", async () => {
    (useAdminSession as jest.Mock).mockReturnValue({ isActive: true });
    (useAdminUniversity as jest.Mock).mockReturnValue({ data: mockUniversity, isLoading: false, isError: false });
    renderPage();

    // Open Add Faculty Modal
    fireEvent.click(screen.getByRole("button", { name: "Add Faculty" }));
    
    // Close Modal
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Name PH")).not.toBeInTheDocument();
    });
  });
});
