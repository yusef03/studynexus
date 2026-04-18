import { render, screen } from "@testing-library/react";
import { Label } from "../label";

describe("Label", () => {
  it("renders with text", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("associates with an input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
