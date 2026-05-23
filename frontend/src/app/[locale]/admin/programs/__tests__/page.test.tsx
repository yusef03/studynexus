import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminProgramsPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminPrograms } from "@/hooks/admin/useAdminPrograms";
import { adminMutate } from "@/lib/adminFetch";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Mocks
jest.mock("@/hooks/admin/useAdminPrograms");
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
    programs: {
      title: "Programs",
      subtitle: "Manage programs",
      create: "Create Program",
      searchPlaceholder: "Search programs...",
      filterAll: "All",
      filterActive: "Active",
      filterArchived: "Archived",
      form: {
        createTitle: "Create Program",
        name: "Name",
        namePlaceholder: "Name PH",
        abschluss: "Abschluss",
        abschlussPlaceholder: "Abschluss PH",
        regelstudienzeit: "Regelstudienzeit",
        gesamtEcts: "Gesamt ECTS",
        facultyId: "Faculty ID",
        facultyIdPlaceholder: "Faculty ID PH"
      }
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

const mockPrograms = [
  {
    id: "prog-1",
    name: "Informatik",
    abschluss: "B.Sc.",
    regelstudienzeit: 7,
    gesamt_ects: 210,
    faculty_id: "fac-1",
    is_archived: false,
    archive_reason: null
  },
  {
    id: "prog-2",
    name: "Wirtschaftsinformatik",
    abschluss: "B.Sc.",
    regelstudienzeit: 7,
    gesamt_ects: 210,
    faculty_id: "fac-1",
    is_archived: true,
    archive_reason: "Alt"
  }
];

describe("AdminProgramsPage", () => {
  const mockPush = jest.fn();
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminProgramsPage />
      </NextIntlClientProvider>
    );
  };

  it("renders loading and empty states", () => {
    (useAdminPrograms as jest.Mock).mockReturnValue({ data: [], isLoading: true });
    const { container, rerender } = render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminProgramsPage />
      </NextIntlClientProvider>
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    (useAdminPrograms as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminProgramsPage />
      </NextIntlClientProvider>
    );
    expect(screen.getAllByText("Search programs...").length).toBeGreaterThan(0);
  });

  it("renders programs and filters correctly", () => {
    (useAdminPrograms as jest.Mock).mockReturnValue({ data: mockPrograms, isLoading: false });
    renderPage();

    // Default 'all' filter shows both
    expect(screen.getByText("Informatik")).toBeInTheDocument();
    expect(screen.getByText("Wirtschaftsinformatik")).toBeInTheDocument();

    // Switch to 'active' filter
    fireEvent.click(screen.getByText("Active"));
    expect(screen.getByText("Informatik")).toBeInTheDocument();
    expect(screen.queryByText("Wirtschaftsinformatik")).not.toBeInTheDocument();

    // Switch to 'archived' filter
    fireEvent.click(screen.getByText("Archived"));
    expect(screen.queryByText("Informatik")).not.toBeInTheDocument();
    expect(screen.getByText("Wirtschaftsinformatik")).toBeInTheDocument();

    // Search input
    fireEvent.click(screen.getByText("All"));
    const searchInput = screen.getByPlaceholderText("Search programs...");
    fireEvent.change(searchInput, { target: { value: "Wirtschafts" } });
    
    expect(screen.queryByText("Informatik")).not.toBeInTheDocument();
    expect(screen.getByText("Wirtschaftsinformatik")).toBeInTheDocument();

    // Row click navigation
    fireEvent.click(screen.getByText("Wirtschaftsinformatik"));
    expect(mockPush).toHaveBeenCalledWith("/de/admin/programs/prog-2");
  });

  it("handles creating a program (Happy & Sad Path)", async () => {
    const user = userEvent.setup();
    (useAdminPrograms as jest.Mock).mockReturnValue({ data: mockPrograms, isLoading: false });
    renderPage();

    // Open Modal
    fireEvent.click(screen.getByRole("button", { name: "Create Program" }));
    expect(screen.getByText("Create Program", { selector: "h2" })).toBeInTheDocument();

    // Sad Path: Submit empty form
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(adminMutate).not.toHaveBeenCalled();

    // Happy Path: Fill form
    await user.type(screen.getByPlaceholderText("Name PH"), "Mediendesign");
    await user.type(screen.getByPlaceholderText("Abschluss PH"), "B.A.");
    const numberInputs = screen.getAllByRole("spinbutton");
    await user.clear(numberInputs[0]); // regelstudienzeit
    await user.type(numberInputs[0], "6");
    await user.clear(numberInputs[1]); // ects
    await user.type(numberInputs[1], "180");
    await user.type(screen.getByPlaceholderText("Faculty ID PH"), "fac-2");

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("programs", "POST", {
        body: {
          name: "Mediendesign",
          abschluss: "B.A.",
          regelstudienzeit: 6,
          gesamt_ects: 180,
          faculty_id: "fac-2",
        }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-programs"] });
      expect(screen.queryByText("Create Program", { selector: "h2" })).not.toBeInTheDocument();
    });
  });

  it("handles cancel in create modal", async () => {
    (useAdminPrograms as jest.Mock).mockReturnValue({ data: mockPrograms, isLoading: false });
    renderPage();

    // Open Modal
    fireEvent.click(screen.getByRole("button", { name: "Create Program" }));
    
    // Close Modal
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Name PH")).not.toBeInTheDocument();
    });
  });
});
