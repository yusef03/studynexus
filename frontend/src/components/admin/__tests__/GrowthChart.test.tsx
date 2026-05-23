import { render, screen } from "@testing-library/react";
import { GrowthChart } from "../GrowthChart";
import { NextIntlClientProvider } from "next-intl";

jest.mock("recharts", () => {
  const OriginalRecharts = jest.requireActual("recharts");
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Line: () => null,
    Tooltip: ({ formatter }: any) => {
      if (formatter) {
        const formatted = formatter(42);
        return <div data-testid="tooltip">{formatted[0]} {formatted[1]}</div>;
      }
      return <div data-testid="tooltip">Tooltip</div>;
    },
  };
});

const mockMessages = {
  admin: {
    dashboard: {
      growth: {
        noData: "Keine Daten vorhanden",
        newUsers: "Neue User"
      }
    }
  }
};

describe("GrowthChart", () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        {ui}
      </NextIntlClientProvider>
    );
  };

  it("renders a skeleton when loading is true", () => {
    const { container } = renderWithProvider(<GrowthChart data={[]} loading={true} />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders empty state message when data is empty", () => {
    renderWithProvider(<GrowthChart data={[]} loading={false} />);
    expect(screen.getByText("Keine Daten vorhanden")).toBeInTheDocument();
  });

  it("renders LineChart when data is provided", () => {
    const mockData = [
      { day: "2026-05-20", count: 10 },
      { day: "2026-05-21", count: 20 },
      { day: "invalid-date", count: 5 }, // tests the catch block in formatDay
    ];
    renderWithProvider(<GrowthChart data={mockData} loading={false} />);
    
    // Wir überprüfen, dass der gemockte Chart gerendert wird
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
