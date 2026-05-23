import { render, screen, fireEvent } from "@testing-library/react";
import AdminModulesPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminModules } from "@/hooks/admin/useAdminModules";
import { useRouter } from "next/navigation";

// Mocks
jest.mock("@/hooks/admin/useAdminModules");
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
    modules: {
      title: "Modules",
      subtitle: "Manage modules",
      searchPlaceholder: "Search modules...",
      filterAll: "All",
      filterActive: "Active",
      filterArchived: "Archived",
      colKuerzel: "Kürzel",
      colName: "Name",
      colEcts: "ECTS",
      colSem: "Semester",
      colTyp: "Typ",
      colPA: "Prüfungsart",
      colStatus: "Status"
    },
    status: {
      active: "Active",
      archived: "Archived"
    }
  }
};

const mockModules = [
  {
    id: "mod-1",
    name: "Mathematik 1",
    kuerzel: "MAT1",
    ects: 5,
    semester_empfehlung: 1,
    modul_typ: "PFLICHT",
    pruefungsart: "Klausur",
    is_archived: false,
    archive_reason: null
  },
  {
    id: "mod-2",
    name: "Web Development",
    kuerzel: "WEB",
    ects: 5,
    semester_empfehlung: 3,
    modul_typ: "WAHLPFLICHT",
    pruefungsart: "Projekt",
    is_archived: true,
    archive_reason: "Alt"
  },
  {
    id: "mod-3",
    name: "Soft Skills",
    kuerzel: null, // Null kürzel for edge case
    ects: 3,
    semester_empfehlung: null, // Null semester for edge case
    modul_typ: "ERGAENZEND",
    pruefungsart: null,
    is_archived: false,
    archive_reason: null
  }
];

describe("AdminModulesPage", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminModulesPage />
      </NextIntlClientProvider>
    );
  };

  it("renders loading and empty states", () => {
    (useAdminModules as jest.Mock).mockReturnValue({ data: [], isLoading: true });
    const { container, rerender } = render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminModulesPage />
      </NextIntlClientProvider>
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    (useAdminModules as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminModulesPage />
      </NextIntlClientProvider>
    );
    expect(screen.getAllByText("Search modules...").length).toBeGreaterThan(0);
  });

  it("renders modules, typ badges and null fallbacks correctly", () => {
    (useAdminModules as jest.Mock).mockReturnValue({ data: mockModules, isLoading: false });
    renderPage();

    expect(screen.getByText("Mathematik 1")).toBeInTheDocument();
    expect(screen.getByText("MAT1")).toBeInTheDocument();
    expect(screen.getByText("PFLICHT")).toBeInTheDocument();
    
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("WAHLPFLICHT")).toBeInTheDocument();

    expect(screen.getByText("Soft Skills")).toBeInTheDocument();
    expect(screen.getByText("ERGAENZEND")).toBeInTheDocument();
    // Null fallbacks render "—"
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("handles filters and search", () => {
    (useAdminModules as jest.Mock).mockReturnValue({ data: mockModules, isLoading: false });
    renderPage();

    // Default 'all' filter shows both
    expect(screen.getByText("Mathematik 1")).toBeInTheDocument();
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("Soft Skills")).toBeInTheDocument();

    // Switch to 'active' filter
    fireEvent.click(screen.getByText("Active"));
    expect(screen.getByText("Mathematik 1")).toBeInTheDocument();
    expect(screen.getByText("Soft Skills")).toBeInTheDocument();
    expect(screen.queryByText("Web Development")).not.toBeInTheDocument();

    // Switch to 'archived' filter
    fireEvent.click(screen.getByText("Archived"));
    expect(screen.queryByText("Mathematik 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Soft Skills")).not.toBeInTheDocument();
    expect(screen.getByText("Web Development")).toBeInTheDocument();

    // Search input (by name)
    fireEvent.click(screen.getByText("All"));
    const searchInput = screen.getByPlaceholderText("Search modules...");
    fireEvent.change(searchInput, { target: { value: "Soft" } });
    
    expect(screen.queryByText("Mathematik 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Web Development")).not.toBeInTheDocument();
    expect(screen.getByText("Soft Skills")).toBeInTheDocument();

    // Search input (by kuerzel)
    fireEvent.change(searchInput, { target: { value: "MAT" } });
    expect(screen.getByText("Mathematik 1")).toBeInTheDocument();
    expect(screen.queryByText("Soft Skills")).not.toBeInTheDocument();
  });

  it("handles navigation on row click", () => {
    (useAdminModules as jest.Mock).mockReturnValue({ data: mockModules, isLoading: false });
    renderPage();

    fireEvent.click(screen.getByText("Web Development"));
    expect(mockPush).toHaveBeenCalledWith("/de/admin/modules/mod-2");
  });
});
