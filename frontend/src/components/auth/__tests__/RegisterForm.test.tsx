import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "../RegisterForm";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("RegisterForm", () => {
  it("renders all form fields", () => {
    render(<RegisterForm locale="de" />);
    expect(screen.getByLabelText("fields.fullName")).toBeInTheDocument();
    expect(screen.getByLabelText("fields.email")).toBeInTheDocument();
    expect(screen.getByLabelText("fields.password")).toBeInTheDocument();
    expect(screen.getByLabelText("fields.confirmPassword")).toBeInTheDocument();
  });

  it("toggles password field visibility", async () => {
    render(<RegisterForm locale="de" />);
    const passwordInput = screen.getByLabelText("fields.password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButtons = screen.getAllByLabelText("fields.showPassword");
    fireEvent.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("toggles confirm password field visibility independently", async () => {
    render(<RegisterForm locale="de" />);
    const confirmInput = screen.getByLabelText("fields.confirmPassword");
    expect(confirmInput).toHaveAttribute("type", "password");

    const toggleButtons = screen.getAllByLabelText("fields.showPassword");
    fireEvent.click(toggleButtons[1]);
    expect(confirmInput).toHaveAttribute("type", "text");
  });

  it("shows password mismatch error", async () => {
    render(<RegisterForm locale="de" />);

    await userEvent.type(screen.getByLabelText("fields.password"), "Password1!");
    await userEvent.type(screen.getByLabelText("fields.confirmPassword"), "Different1!");

    fireEvent.submit(screen.getByRole("button", { name: "register.submit" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("errors.passwordMismatch");
    });
  });

  it("renders link to login page", () => {
    render(<RegisterForm locale="de" />);
    expect(screen.getByRole("link", { name: "register.loginLink" })).toHaveAttribute(
      "href",
      "/de/login"
    );
  });

  it("shows backend error on failed registration", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Email already registered" }),
    });

    render(<RegisterForm locale="de" />);

    await userEvent.type(screen.getByLabelText("fields.password"), "Password1!");
    await userEvent.type(screen.getByLabelText("fields.confirmPassword"), "Password1!");

    fireEvent.submit(screen.getByRole("button", { name: "register.submit" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Email already registered");
    });
  });
});
