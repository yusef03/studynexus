import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "../LogoutButton";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it("renders with logout label", () => {
    render(<LogoutButton locale="de" />);
    expect(screen.getByRole("button", { name: "logout" })).toBeInTheDocument();
  });

  it("calls logout endpoint and redirects on click", async () => {
    render(<LogoutButton locale="de" />);
    await userEvent.click(screen.getByRole("button"));

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(mockPush).toHaveBeenCalledWith("/de/login");
  });
});
