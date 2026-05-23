import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUserDetailPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminUser } from "@/hooks/admin/useAdminUser";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Mock Hooks & Modules
jest.mock("@/hooks/admin/useAdminUser");
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
    users: {
      detail: {
        notFound: "User not found",
        backToList: "Back to list",
        adminFlag: "Admin",
        infoSection: "Personal Info",
        email: "Email",
        matrikel: "Matrikelnummer",
        birthDate: "Birth Date",
        university: "University",
        gpa: "GPA",
        language: "Language",
        registeredAt: "Registered At",
        lastLogin: "Last Login",
        never: "Never",
        studySection: "Study Plan",
        program: "Program",
        startSem: "Start Sem",
        totalModules: "Total Modules",
        passedModules: "Passed Modules",
        ects: "ECTS",
        toggleActive: "Active",
        togglePremium: "Premium",
        togglePremiumDesc: "Premium desc",
        toggleVerified: "Verified",
        notesSection: "Admin Notes",
        notesPlaceholder: "Write notes...",
        saveNotes: "Save Notes",
        savingNotes: "Saving...",
        notesSaved: "Notes saved",
        notesError: "Notes error",
        dangerSection: "Danger Zone",
        resetPassword: "Reset Password",
        resetPasswordDesc: "Send reset link",
        resetPasswordLoading: "Resetting...",
        resetPasswordSuccess: "Reset success",
        resetPasswordError: "Reset error",
        noSession: "Session expired",
        deleteUser: "Delete User",
        deleteUserDesc: "Delete permanently"
      }
    }
  }
};

describe("AdminUserDetailPage", () => {
  const mockPush = jest.fn();
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useAdminSession as jest.Mock).mockReturnValue({ token: "fake-admin-token", isActive: true });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminUserDetailPage params={{ id: "user-1" }} />
      </NextIntlClientProvider>
    );
  };

  it("renders loading state", () => {
    (useAdminUser as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null });
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders not found state", () => {
    (useAdminUser as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: true });
    renderPage();
    expect(screen.getByText("User not found")).toBeInTheDocument();
    expect(screen.getByText("Back to list")).toBeInTheDocument();
  });

  it("renders user data correctly (Happy Path)", () => {
    (useAdminUser as jest.Mock).mockReturnValue({
      data: {
        id: "user-1",
        email: "test@stud.hs-hannover.de",
        full_name: "Max Admin",
        is_admin: true,
        matrikelnummer: "12345",
        birth_date: "1995-10-10",
        university: "HsH",
        gpa: 1.3,
        preferred_language: "de",
        created_at: "2026-01-01T10:00:00Z",
        last_login_at: null,
        program_name: "Informatik",
        start_semester: "WS23",
        total_modules: 30,
        passed_modules: 5,
        erreichte_ects: 25,
        is_active: true,
        is_premium: false,
        is_verified: true,
        admin_notes: "Initial note"
      },
      isLoading: false,
      error: null
    });

    renderPage();
    expect(screen.getByText("Max Admin")).toBeInTheDocument();
    expect(screen.getAllByText("test@stud.hs-hannover.de").length).toBeGreaterThan(0);
    expect(screen.getByText("Admin")).toBeInTheDocument(); // Admin flag
    
    // Check some stats
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("1.30")).toBeInTheDocument();
    expect(screen.getByText("DE")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument(); // last login
    
    // Toggles should reflect initial state
    const activeToggle = screen.getByRole("switch", { name: "Active" });
    expect(activeToggle).toHaveAttribute("aria-checked", "true");
    
    const premiumToggle = screen.getByRole("switch", { name: "Premium" });
    expect(premiumToggle).toHaveAttribute("aria-checked", "false");
  });

  it("handles toggles correctly (Mutation)", async () => {
    (useAdminUser as jest.Mock).mockReturnValue({
      data: { id: "user-1", is_active: true },
      isLoading: false,
      error: null
    });
    (adminMutate as jest.Mock).mockResolvedValue({});

    renderPage();
    
    const activeToggle = screen.getByRole("switch", { name: "Active" });
    fireEvent.click(activeToggle);
    
    // The component disables the toggles during patchLoading, then re-enables
    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("users/user-1", "PATCH", {
        body: { is_active: false }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-user", "user-1"] });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-users"] });
    });

    // Test other toggles
    fireEvent.click(screen.getByRole("switch", { name: "Premium" }));
    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("users/user-1", "PATCH", {
        body: { is_premium: true }
      });
    });

    fireEvent.click(screen.getByRole("switch", { name: "Verified" }));
    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("users/user-1", "PATCH", {
        body: { is_verified: true }
      });
    });
  });

  it("handles saving admin notes (Happy Path & Sad Path)", async () => {
    (useAdminUser as jest.Mock).mockReturnValue({
      data: { id: "user-1", admin_notes: "Old note" },
      isLoading: false,
      error: null
    });

    const user = userEvent.setup();
    renderPage();

    const textarea = screen.getByPlaceholderText("Write notes...");
    await user.clear(textarea);
    await user.type(textarea, "New note");

    // Sad path first
    (adminMutate as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    fireEvent.click(screen.getByRole("button", { name: "Save Notes" }));
    
    await waitFor(() => {
      expect(screen.getByText("Notes error")).toBeInTheDocument();
      expect(screen.getByText("Notes error")).toHaveClass("text-red-500");
    });

    // Happy path
    (adminMutate as jest.Mock).mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Save Notes" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("users/user-1", "PATCH", {
        body: { admin_notes: "New note" }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-user", "user-1"] });
      expect(screen.getByText("Notes saved")).toBeInTheDocument();
      expect(screen.getByText("Notes saved")).toHaveClass("text-green-600");
    });
  });

  it("handles reset password (Mutation)", async () => {
    (useAdminUser as jest.Mock).mockReturnValue({
      data: { id: "user-1" },
      isLoading: false,
      error: null
    });

    renderPage();

    // Sad path
    (adminMutate as jest.Mock).mockRejectedValueOnce(new Error("Error"));
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => {
      expect(screen.getByText("Reset error")).toBeInTheDocument();
    });

    // Happy path
    (adminMutate as jest.Mock).mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("users/user-1/reset-password", "POST", {
        adminToken: "fake-admin-token"
      });
      expect(screen.getByText("Reset success")).toBeInTheDocument();
    });
  });

  it("handles delete user (Happy Path & Sad Path)", async () => {
    (useAdminUser as jest.Mock).mockReturnValue({
      data: { id: "user-1", email: "test@test.com" },
      isLoading: false,
      error: null
    });

    renderPage();

    // Sad path
    (adminMutate as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    fireEvent.click(screen.getByRole("button", { name: "Delete User" }));
    fireEvent.click(screen.getByTestId("confirm-delete"));
    
    // UI doesn't crash on delete rejection
    await waitFor(() => {
      // the dialog should still be open or deleteLoading reset
      expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    });

    // Happy path
    (adminMutate as jest.Mock).mockResolvedValueOnce({});
    // Click Delete opens modal
    fireEvent.click(screen.getByRole("button", { name: "Delete User" }));
    
    // Cancel should close it
    fireEvent.click(screen.getByTestId("cancel-delete"));
    expect(screen.queryByTestId("delete-dialog")).not.toBeInTheDocument();

    // Reopen and Confirm
    fireEvent.click(screen.getByRole("button", { name: "Delete User" }));
    fireEvent.click(screen.getByTestId("confirm-delete"));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("users/user-1", "DELETE", {
        body: { reason: "Admin-initiated delete" },
        adminToken: "fake-admin-token"
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-users"] });
      expect(mockPush).toHaveBeenCalledWith("/de/admin/users");
    });
  });

  it("disables danger zone when session is expired", () => {
    (useAdminSession as jest.Mock).mockReturnValue({ token: null, isActive: false });
    (useAdminUser as jest.Mock).mockReturnValue({
      data: { id: "user-1" },
      isLoading: false,
      error: null
    });

    renderPage();

    expect(screen.getAllByText("Session expired")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Reset Password" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete User" })).toBeDisabled();
  });
});
