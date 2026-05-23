import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminImportPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useAdminPrograms } from "@/hooks/admin/useAdminPrograms";
import { adminMutate } from "@/lib/adminFetch";

// Mocks
jest.mock("@/hooks/useAdminSession");
jest.mock("@/hooks/admin/useAdminPrograms");
jest.mock("@/lib/adminFetch");
jest.mock("next-intl", () => {
  const actual = jest.requireActual("next-intl");
  return {
    ...actual,
    useLocale: () => "de",
  };
});

const mockMessages = {
  admin: {
    import: {
      title: "Bulk Import",
      subtitle: "Import modules",
      jsonSection: "JSON Import",
      examRegLabel: "Exam Reg ID",
      examRegPlaceholder: "Enter UUID",
      examRegHint: "Hint: ID",
      jsonLabel: "JSON Data",
      jsonPlaceholder: "Enter JSON array",
      errorEmpty: "JSON is empty",
      errorNotArray: "JSON is not an array",
      errorInvalidJson: "Invalid JSON syntax",
      previewCount: "{count} modules parsed",
      previewMore: "+ {count} more",
      resultSuccess: "Import successful",
      resultCreated: "{count} created",
      resultSkipped: "{count} skipped",
      resultErrors: "{count} errors",
      importError: "API Error: {error}",
      validateBtn: "Validate",
      importingBtn: "Importing...",
      importBtn: "Import",
      resetBtn: "Reset",
      noSession: "Session expired",
      pdfSection: "PDF Import",
      pdfDesc: "Import from PDF",
      pdfBtn: "Upload PDF",
      pdfComingSoon: "Coming soon"
    }
  }
};

describe("AdminImportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAdminSession as jest.Mock).mockReturnValue({ token: "fake-token" });
    (useAdminPrograms as jest.Mock).mockReturnValue({ data: [] });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminImportPage />
      </NextIntlClientProvider>
    );
  };

  it("renders base structure and PDF placeholder", () => {
    renderPage();

    expect(screen.getByText("Bulk Import")).toBeInTheDocument();
    expect(screen.getByText("PDF Import")).toBeInTheDocument();
    
    // PDF button should be disabled
    const pdfBtn = screen.getByRole("button", { name: "Upload PDF" });
    expect(pdfBtn).toBeDisabled();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("renders security warning when no session", () => {
    (useAdminSession as jest.Mock).mockReturnValue({ token: null });
    renderPage();

    expect(screen.getByText("Session expired")).toBeInTheDocument();
  });

  it("handles JSON validation errors (Sad Paths)", async () => {
    const user = userEvent.setup();
    renderPage();

    const validateBtn = screen.getByRole("button", { name: "Validate" });
    const jsonInput = screen.getByPlaceholderText("Enter JSON array");

    // 1. Empty JSON error is caught (button is disabled when empty, but let's test if somehow it triggers or we can just test the function directly if needed - actually the button is disabled if empty)
    expect(validateBtn).toBeDisabled();

    // 2. Invalid JSON Syntax
    fireEvent.change(jsonInput, { target: { value: '{"bad": }' } });
    expect(validateBtn).toBeEnabled();
    fireEvent.click(validateBtn);
    expect(screen.getByText("Invalid JSON syntax")).toBeInTheDocument();

    // 3. Not an array
    await user.clear(jsonInput);
    fireEvent.change(jsonInput, { target: { value: '{"name": "Not Array"}' } });
    fireEvent.click(validateBtn);
    expect(screen.getByText("JSON is not an array")).toBeInTheDocument();
  });

  it("handles JSON validation success (Preview generation)", async () => {
    const user = userEvent.setup();
    renderPage();

    const jsonInput = screen.getByPlaceholderText("Enter JSON array");
    const validJson = Array.from({ length: 15 }, (_, i) => ({
      name: `Mod ${i}`,
      kuerzel: `M${i}`,
      ects: 5
    }));

    fireEvent.change(jsonInput, { target: { value: JSON.stringify(validJson) } });
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    // Preview
    expect(screen.getByText("15 modules parsed")).toBeInTheDocument();
    // Previews first 10
    expect(screen.getByText("1. M0 — Mod 0 (5 ECTS)")).toBeInTheDocument();
    expect(screen.getByText("10. M9 — Mod 9 (5 ECTS)")).toBeInTheDocument();
    // Previews +5 more
    expect(screen.getByText("+ 5 more")).toBeInTheDocument();
  });

  it("handles empty validation correctly (Early return trigger)", async () => {
    const user = userEvent.setup();
    renderPage();

    const jsonInput = screen.getByPlaceholderText("Enter JSON array");
    fireEvent.change(jsonInput, { target: { value: '  ' } }); // Only whitespace
    
    // The button might still be clickable if we type spaces depending on disabled state, let's see
    // "disabled={!jsonText.trim()}" -> so it will be disabled. We can't click it via UI.
    expect(screen.getByRole("button", { name: "Validate" })).toBeDisabled();
  });

  it("handles successful import workflow", async () => {
    const user = userEvent.setup();
    renderPage();

    (adminMutate as jest.Mock).mockResolvedValue({
      created: 2,
      skipped: 0,
      errors: []
    });

    const jsonInput = screen.getByPlaceholderText("Enter JSON array");
    const idInput = screen.getByPlaceholderText("Enter UUID");

    await user.type(idInput, "er-123");
    fireEvent.change(jsonInput, { target: { value: '[{"name": "A"}]' } });
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    const importBtn = screen.getByRole("button", { name: "Import" });
    expect(importBtn).toBeEnabled();

    fireEvent.click(importBtn);

    expect(screen.getByText("Importing...")).toBeInTheDocument();

    await waitFor(() => {
      expect(adminMutate).toHaveBeenCalledWith("modules/import/json", "POST", {
        body: { exam_regulation_id: "er-123", modules: [{ name: "A" }] },
        adminToken: "fake-token"
      });
      expect(screen.getByText("Import successful")).toBeInTheDocument();
      expect(screen.getByText("2 created")).toBeInTheDocument();
      expect(screen.getByText("0 skipped")).toBeInTheDocument();
    });
  });

  it("handles import errors from API", async () => {
    const user = userEvent.setup();
    renderPage();

    (adminMutate as jest.Mock).mockRejectedValue(new Error("Server Error"));

    await user.type(screen.getByPlaceholderText("Enter UUID"), "er-123");
    fireEvent.change(screen.getByPlaceholderText("Enter JSON array"), { target: { value: '[{"name": "A"}]' } });
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(screen.getByText("API Error: Server Error")).toBeInTheDocument();
    });
  });
  
  it("handles import errors string from API", async () => {
    const user = userEvent.setup();
    renderPage();

    (adminMutate as jest.Mock).mockRejectedValue("String Error");

    await user.type(screen.getByPlaceholderText("Enter UUID"), "er-123");
    fireEvent.change(screen.getByPlaceholderText("Enter JSON array"), { target: { value: '[{"name": "A"}]' } });
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(screen.getByText("API Error: String Error")).toBeInTheDocument();
    });
  });

  it("renders import result with item-level errors", async () => {
    const user = userEvent.setup();
    renderPage();

    (adminMutate as jest.Mock).mockResolvedValue({
      created: 1,
      skipped: 1,
      errors: ["Line 2: Missing kuerzel"]
    });

    await user.type(screen.getByPlaceholderText("Enter UUID"), "er-123");
    fireEvent.change(screen.getByPlaceholderText("Enter JSON array"), { target: { value: '[{"name": "A"}]' } });
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(screen.getByText("1 errors")).toBeInTheDocument();
      expect(screen.getByText("Line 2: Missing kuerzel")).toBeInTheDocument();
    });
  });

  it("handles reset workflow", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("Enter JSON array"), { target: { value: '[{"name": "A"}]' } });
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    expect(screen.getByText("1 modules parsed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.queryByText("1 modules parsed")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter JSON array")).toHaveValue("");
  });
});
