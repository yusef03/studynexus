import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUsersPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useRouter } from "next/navigation";

// Mock Hooks
jest.mock("@/hooks/admin/useAdminUsers");
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
jest.mock("@/components/admin/AdminDataTable", () => ({
  AdminDataTable: ({ data, loading, onSearch, onPageChange, onRowClick, getRowKey }: any) => (
    <div data-testid="admin-data-table">
      {loading ? "LoadingTable" : "LoadedTable"}
      <button onClick={() => onSearch("Max")} data-testid="test-search">Search Max</button>
      <button onClick={() => onPageChange(2)} data-testid="test-page">Page 2</button>
      {data.map((row: any) => (
        <div key={getRowKey(row)} onClick={() => onRowClick(row)} data-testid={`row-${row.id}`}>
          {row.email}
        </div>
      ))}
    </div>
  )
}));

const mockMessages = {
  admin: {
    users: {
      title: "Nutzerverwaltung",
      subtitle: "Alle registrierten",
      filterAll: "Alle",
      filterActive: "Aktiv",
      filterInactive: "Inaktiv",
      filterPremium: "Premium",
      filterUnverified: "Unbestätigt",
      searchPlaceholder: "Suche...",
      colUser: "Nutzer",
      colMatrikel: "Matrikel",
      colStatus: "Status",
      colProgram: "Studiengang",
      colProgress: "Fortschritt",
      colLastLogin: "Letzter Login",
      colJoined: "Registriert am",
      noProgram: "Kein Programm",
      modules: "{passed}/{total} Module",
      ects: "{count} ECTS",
      neverLoggedIn: "Nie eingeloggt"
    },
    common: {
      noData: "Keine Einträge",
      previous: "Zurück",
      next: "Weiter"
    }
  }
};

describe("AdminUsersPage", () => {
  const mockPush = jest.fn();
  const mockUseAdminUsers = useAdminUsers as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminUsersPage />
      </NextIntlClientProvider>
    );
  };

  it("renders correctly with loading state", () => {
    mockUseAdminUsers.mockReturnValue({ data: null, isLoading: true });
    const { container } = renderPage();
    expect(screen.getByText("Nutzerverwaltung")).toBeInTheDocument();
    expect(mockUseAdminUsers).toHaveBeenCalledWith({
      page: 1,
      search: "",
      limit: 25,
      // all filters default to no extra args
    });
    // Datatable shows loading skeleton or something...
  });

  it("renders data correctly (Happy Path)", () => {
    mockUseAdminUsers.mockReturnValue({
      data: {
        items: [
          {
            id: "user-1",
            email: "test@stud.hs-hannover.de",
            full_name: "Max Mustermann",
            matrikelnummer: "12345",
            is_active: true,
            is_premium: true,
            is_verified: true,
            program_name: "Informatik",
            passed_modules: 5,
            total_modules: 30,
            erreichte_ects: 25,
            last_login_at: "2026-05-20T10:00:00Z",
            created_at: "2026-01-01T10:00:00Z"
          },
          {
            id: "user-2",
            email: "inactive@stud.hs-hannover.de",
            full_name: null,
            matrikelnummer: null,
            is_active: false,
            is_premium: false,
            is_verified: false,
            program_name: null,
            passed_modules: 0,
            total_modules: 0,
            erreichte_ects: 0,
            last_login_at: null,
            created_at: "2026-05-01T10:00:00Z"
          }
        ],
        total: 2
      },
      isLoading: false
    });

    renderPage();
    
    // Test that the mock renders the emails using the data
    expect(screen.getByText("test@stud.hs-hannover.de")).toBeInTheDocument();
    expect(screen.getByText("inactive@stud.hs-hannover.de")).toBeInTheDocument();
  });

  it("handles filter tab clicks", async () => {
    mockUseAdminUsers.mockReturnValue({ data: null, isLoading: false });
    renderPage();

    // Click Active filter
    fireEvent.click(screen.getByText("Aktiv"));
    expect(mockUseAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({
      is_active: true,
      page: 1
    }));

    // Click Inactive filter
    fireEvent.click(screen.getByText("Inaktiv"));
    expect(mockUseAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({
      is_active: false,
      page: 1
    }));

    // Click Premium filter
    fireEvent.click(screen.getByText("Premium"));
    expect(mockUseAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({
      is_premium: true,
      page: 1
    }));

    // Click Unverified filter
    fireEvent.click(screen.getByText("Unbestätigt"));
    expect(mockUseAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({
      is_verified: false,
      page: 1
    }));

    // Click All filter
    fireEvent.click(screen.getByText("Alle"));
    expect(mockUseAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 1
    }));
  });

  it("handles search input", async () => {
    mockUseAdminUsers.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    
    fireEvent.click(screen.getByTestId("test-search"));

    // The component triggers `onSearch("Max")` which calls `handleSearch("Max")` -> `setSearch("Max")`
    expect(mockUseAdminUsers).toHaveBeenCalledWith(expect.objectContaining({
      search: "Max",
      page: 1
    }));
  });

  it("handles page change", async () => {
    mockUseAdminUsers.mockReturnValue({ data: null, isLoading: false });
    renderPage();
    
    fireEvent.click(screen.getByTestId("test-page"));

    expect(mockUseAdminUsers).toHaveBeenCalledWith(expect.objectContaining({
      page: 2
    }));
  });

  it("handles row click for navigation", async () => {
    mockUseAdminUsers.mockReturnValue({
      data: {
        items: [{ id: "user-99", email: "test@test.com", created_at: "2026-05-01T10:00:00Z" }],
        total: 1
      },
      isLoading: false
    });

    renderPage();

    fireEvent.click(screen.getByTestId("row-user-99"));

    expect(mockPush).toHaveBeenCalledWith("/de/admin/users/user-99");
  });
});
