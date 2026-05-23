import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatsCard } from "../StatsCard";

jest.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

const mockStats = {
  gpa: 2.3,
  erreichte_ects: 42,
  gesamt_ects: 180,
  fortschritt_prozent: 23.3,
  bestandene_module: 7,
  nicht_bestandene_module: 1,
  offene_module: 14,
};

function mockFetch(data: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => data,
  });
}

const createTestQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
function renderWithClient(ui: React.ReactElement) {
  return render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>);
}

describe("StatsCard", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows loading text initially", () => {
    mockFetch(mockStats);
    renderWithClient(<StatsCard />);
    expect(screen.getByText("dashboard.stats.loading")).toBeInTheDocument();
  });

  it("renders GPA after load", async () => {
    mockFetch(mockStats);
    renderWithClient(<StatsCard />);
    await waitFor(() => {
      expect(screen.getByText("2,3")).toBeInTheDocument();
    });
  });

  it("renders — when GPA is null", async () => {
    mockFetch({ ...mockStats, gpa: null });
    renderWithClient(<StatsCard />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.stats.noGpa")).toBeInTheDocument();
    });
  });

  it("renders ECTS progress", async () => {
    mockFetch(mockStats);
    renderWithClient(<StatsCard />);
    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText(/180/)).toBeInTheDocument();
    });
  });

  it("renders progress bar with correct aria values", async () => {
    mockFetch(mockStats);
    renderWithClient(<StatsCard />);
    await waitFor(() => {
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuenow", String(mockStats.fortschritt_prozent));
    });
  });

  it("shows error message on fetch failure", async () => {
    mockFetch({}, false);
    renderWithClient(<StatsCard />);
    await waitFor(() => {
      expect(screen.getByText("dashboard.stats.loadError")).toBeInTheDocument();
    });
  });

});
