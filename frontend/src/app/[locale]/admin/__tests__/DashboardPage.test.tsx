import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../page";
import { NextIntlClientProvider } from "next-intl";

jest.mock("recharts", () => {
  const OriginalRecharts = jest.requireActual("recharts");
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: () => <div data-testid="line-chart">LineChartMock</div>,
  };
});

jest.mock("@/hooks/useAdminSession", () => ({
  useAdminSession: jest.fn(() => ({ token: "fake-admin-token" })),
}));

const mockMessages = {
  admin: {
    dashboard: {
      title: "Admin Dashboard",
      subtitle: "System overview",
      management: "Management",
      dbSize: "DB Size:",
      kpi: {
        totalUsers: "Total Users",
        activeUsers: "Active Users",
        premiumUsers: "Premium Users",
        passedToday: "Passed Today",
        today: "Heute {count}",
        weekNew: "Woche {count}",
        total: "Gesamt {count}",
        universities: "Universities",
        programs: "Programs",
        catalogModules: "Modules"
      },
      growth: {
        title: "Growth",
        subtitleTotal: "Total: {total}",
        subtitle: "Loading...",
        noData: "Keine Daten vorhanden"
      },
      quickNav: {
        usersLabel: "Users",
        usersDesc: "Manage users",
        universitiesLabel: "Unis",
        universitiesDesc: "Manage unis",
        modulesLabel: "Mods",
        modulesDesc: "Manage mods",
        systemLabel: "Sys",
        systemDesc: "System stats"
      }
    }
  }
};

describe("AdminDashboardPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <DashboardPage params={{ locale: "de" }} />
      </NextIntlClientProvider>
    );
  };

  it("renders correctly and fetches data (Happy Path)", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/admin/stats/growth")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [{ date: "2026-05-20", count: 5 }],
            total: 5
          })
        });
      }
      if (url.includes("/api/admin/stats")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            total_users: 100,
            active_users_30d: 50,
            premium_users: 10,
            total_student_modules: 500,
            passed_modules_today: 5,
            new_registrations_today: 2,
            new_registrations_week: 10,
            total_universities: 1,
            total_programs: 2,
            total_modules: 30,
            db_size_mb: 12.5
          })
        });
      }
      return Promise.reject(new Error("not mocked"));
    });

    renderPage();

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();

    // Skeletons might be in the document initially
    // Let's wait for data to load
    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument(); // Total Users
    });

    expect(screen.getByText("50")).toBeInTheDocument(); // Active Users
    expect(screen.getByText("10")).toBeInTheDocument(); // Premium Users
    expect(screen.getByText("5")).toBeInTheDocument(); // Passed Modules
    expect(screen.getByText("12.5 MB")).toBeInTheDocument(); // DB Size

    expect(global.fetch).toHaveBeenCalledTimes(2);

    const firstCallArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(firstCallArgs[1].headers).toEqual({
      "x-studynexus-client": "true",
      "x-admin-token": "fake-admin-token"
    });
  });

  it("handles fetch error gracefully (Error State)", async () => {
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        json: () => Promise.reject(new Error("should not be called"))
      });
    });

    renderPage();

    // Wartet bis das Loading fertig ist
    await waitFor(() => {
      // Wenn die API fehlschlägt, fällt der State auf null zurück, was in den KPICards als "—" angezeigt wird
      const dashs = screen.getAllByText("—");
      expect(dashs.length).toBeGreaterThan(0);
    });

    // DB Size sollte nicht gerendert werden, wenn stats null ist
    expect(screen.queryByText("12.5 MB")).not.toBeInTheDocument();
  });
});
