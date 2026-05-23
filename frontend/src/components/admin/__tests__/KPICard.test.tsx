import { render, screen } from "@testing-library/react";
import { KPICard } from "../KPICard";
import { Users } from "lucide-react";

describe("KPICard", () => {
  it("renders label, value, and icon correctly (happy path)", () => {
    const { container } = render(
      <KPICard label="Total Users" value={420} icon={Users} />
    );

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("420")).toBeInTheDocument();
    
    // The Lucide icon is an svg element
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders sub text if provided", () => {
    render(
      <KPICard label="Total Users" value={420} icon={Users} sub="+5 today" />
    );

    expect(screen.getByText("+5 today")).toBeInTheDocument();
  });

  it("renders Skeleton when loading is true", () => {
    const { container } = render(
      <KPICard label="Total Users" value={420} icon={Users} loading={true} />
    );

    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();

    // Value should not be visible when loading
    expect(screen.queryByText("420")).not.toBeInTheDocument();
  });

  it("applies className to the container", () => {
    const { container } = render(
      <KPICard label="Users" value={10} icon={Users} className="col-span-2" />
    );

    expect(container.firstChild).toHaveClass("col-span-2");
  });

  it("renders positive trend correctly", () => {
    render(<KPICard label="Users" value={10} icon={Users} trend={5} />);
    const span = screen.getByText("+5%", { exact: false });
    expect(span).toHaveClass("text-emerald-600");
  });

  it("renders negative trend correctly", () => {
    render(<KPICard label="Users" value={10} icon={Users} trend={-3} />);
    const span = screen.getByText("-3%", { exact: false });
    expect(span).toHaveClass("text-red-500");
  });

  it("renders zero trend correctly", () => {
    render(<KPICard label="Users" value={10} icon={Users} trend={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
