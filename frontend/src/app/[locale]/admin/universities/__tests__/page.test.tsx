import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUniversitiesPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminUniversities } from "@/hooks/admin/useAdminUniversities";
import { useQueryClient } from "@tanstack/react-query";
import { adminMutate } from "@/lib/adminFetch";
import { useRouter } from "next/navigation";

// Mocks
jest.mock("@/hooks/admin/useAdminUniversities");
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));
jest.mock("@/lib/adminFetch");
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

// Mock dialog component from Radix to avoid portal issues in testing if needed.
// Radix portals can sometimes be tricky, but we usually just let it render.
// We will test if userEvent can interact with the form fields.

const mockMessages = {
  admin: {
    universities: {
      title: "Hochschulen",
      subtitle: "Verwalte Hochschulen",
      create: "Erstellen",
      searchPlaceholder: "Suche Unis",
      form: {
        createTitle: "Neue Uni",
        name: "Name",
        namePlaceholder: "z.B. Hochschule Hannover",
        kuerzel: "Kürzel",
        kuerzelPlaceholder: "z.B. HsH",
        stadt: "Stadt",
        stadtPlaceholder: "z.B. Hannover",
        bundesland: "Bundesland",
        bundeslandPlaceholder: "z.B. Niedersachsen",
        typ: "Typ",
        fh: "Fachhochschule",
        uni: "Universität"
      }
    },
    formModal: {
      cancel: "Abbrechen",
      create: "Erstellen",
      save: "Speichern",
      saving: "Speichert..."
    },
    common: {
      save: "Speichern",
      cancel: "Abbrechen"
    }
  }
};

describe("AdminUniversitiesPage", () => {
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
        <AdminUniversitiesPage />
      </NextIntlClientProvider>
    );
  };

  it("renders loading state", () => {
    (useAdminUniversities as jest.Mock).mockReturnValue({ data: [], isLoading: true });
    const { container } = renderPage();
    // Check for skeleton elements
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders empty state", () => {
    (useAdminUniversities as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderPage();
    // Empty state should render the searchPlaceholder text
    expect(screen.getByText("Suche Unis")).toBeInTheDocument();
  });

  it("renders data and handles search filtering", async () => {
    (useAdminUniversities as jest.Mock).mockReturnValue({
      data: [
        { id: "1", name: "Hochschule Hannover", kuerzel: "HsH", stadt: "Hannover", typ: "FH" },
        { id: "2", name: "Leibniz Uni", kuerzel: "LUH", stadt: "Hannover", typ: "Uni" }
      ],
      isLoading: false
    });

    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Hochschule Hannover")).toBeInTheDocument();
    expect(screen.getByText("Leibniz Uni")).toBeInTheDocument();

    // Type in search
    const searchInput = screen.getByPlaceholderText("Suche Unis");
    await user.type(searchInput, "Leibniz");

    // "Hochschule Hannover" should be filtered out
    expect(screen.queryByText("Hochschule Hannover")).not.toBeInTheDocument();
    expect(screen.getByText("Leibniz Uni")).toBeInTheDocument();
  });

  it("handles navigation to detail page", () => {
    (useAdminUniversities as jest.Mock).mockReturnValue({
      data: [
        { id: "1", name: "Hochschule Hannover", kuerzel: "HsH", stadt: "Hannover", typ: "FH" }
      ],
      isLoading: false
    });

    renderPage();

    fireEvent.click(screen.getByText("Hochschule Hannover"));
    expect(mockPush).toHaveBeenCalledWith("/de/admin/universities/1");
  });

  it("handles creating a new university (Happy & Sad Path)", async () => {
    (useAdminUniversities as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (adminMutate as jest.Mock).mockResolvedValue({});

    const user = userEvent.setup();
    renderPage();

    // Open create modal
    fireEvent.click(screen.getByRole("button", { name: "Erstellen" }));
    
    // Modal should be visible
    expect(screen.getByText("Neue Uni")).toBeInTheDocument();

    // Sad Path: Try to submit empty form
    fireEvent.click(screen.getAllByRole("button", { name: "Erstellen" })[1]);
    // adminMutate should not have been called because of the early return
    expect(adminMutate).not.toHaveBeenCalled();

    // Happy Path: Fill form
    await user.type(screen.getByPlaceholderText("z.B. Hochschule Hannover"), "Test Uni");
    await user.type(screen.getByPlaceholderText("z.B. HsH"), "TU");
    await user.type(screen.getByPlaceholderText("z.B. Hannover"), "Teststadt");
    await user.type(screen.getByPlaceholderText("z.B. Niedersachsen"), "Testland");
    // Change select to "Uni"
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Uni" } });

    // Submit
    fireEvent.click(screen.getAllByRole("button", { name: "Erstellen" })[1]);

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("universities", "POST", {
        body: {
          name: "Test Uni",
          kuerzel: "TU",
          stadt: "Teststadt",
          bundesland: "Testland",
          typ: "Uni"
        }
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-universities"] });
    });

    // Modal should close (check that "Neue Uni" disappears, or handle modal state)
    await waitFor(() => {
      expect(screen.queryByText("Neue Uni")).not.toBeInTheDocument();
    });
  });

  it("handles cancel in create modal", async () => {
    (useAdminUniversities as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    
    renderPage();

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: "Erstellen" }));
    expect(screen.getByText("Neue Uni")).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getAllByRole("button", { name: "Abbrechen" })[1]);
    
    await waitFor(() => {
      expect(screen.queryByText("Neue Uni")).not.toBeInTheDocument();
    });
  });
});
