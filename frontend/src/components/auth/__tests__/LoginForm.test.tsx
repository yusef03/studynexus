import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "../LoginForm";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm locale="de" />);
    expect(screen.getByLabelText("fields.email")).toBeInTheDocument();
    expect(screen.getByLabelText("fields.password")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<LoginForm locale="de" />);
    expect(screen.getByRole("button", { name: "login.submit" })).toBeInTheDocument();
  });

  it("renders link to register page", () => {
    render(<LoginForm locale="de" />);
    expect(screen.getByRole("link", { name: "login.registerLink" })).toHaveAttribute(
      "href",
      "/de/register"
    );
  });

  it("shows error when login fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Invalid email or password" }),
    });

    render(<LoginForm locale="de" />);
    fireEvent.submit(screen.getByRole("button", { name: "login.submit" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password");
    });
  });

  it("toggles password visibility on eye button click", async () => {
    render(<LoginForm locale="de" />);
    const passwordInput = screen.getByLabelText("fields.password");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByLabelText("fields.showPassword"));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByLabelText("fields.hidePassword"));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows network error when fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    render(<LoginForm locale="de" />);
    fireEvent.submit(screen.getByRole("button", { name: "login.submit" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
