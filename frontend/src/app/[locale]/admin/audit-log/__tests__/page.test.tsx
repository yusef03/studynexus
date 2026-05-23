import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminAuditLogPage from "../page";
import { NextIntlClientProvider } from "next-intl";
import { useAdminAuditLogs } from "@/hooks/admin/useAdminAuditLog";
import { useQueryClient } from "@tanstack/react-query";

// Mocks
jest.mock("@/hooks/admin/useAdminAuditLog");
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
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
    auditLog: {
      title: "Audit Log",
      subtitle: "System actions history",
      refresh: "Refresh",
      filterEntityType: "Entity Type",
      filterAction: "Action",
      filterAll: "All",
      filterDateFrom: "From",
      filterDateTo: "To",
      filterReset: "Reset Filters",
      totalEntries: "Total {total} entries",
      loadError: "Failed to load audit logs",
      noEntries: "No audit logs found",
      oldValue: "Old",
      newValue: "New",
      byAdmin: "By {name}",
      prevPage: "Previous",
      nextPage: "Next",
      pageInfo: "Page {page} of {total}",
      actionCREATE: "CREATE",
      actionUPDATE: "UPDATE",
      actionDELETE: "DELETE",
      actionARCHIVE: "ARCHIVE",
      actionRESTORE: "RESTORE",
      actionRESET_PASSWORD: "RESET_PASSWORD",
      actionLOGIN: "LOGIN",
      actionIMPORT: "IMPORT"
    }
  }
};

const mockLogs = {
  items: [
    {
      id: "log-1",
      entity_type: "User",
      entity_label: "test@example.com",
      action: "CREATE",
      admin_name: "SuperAdmin",
      ip_address: "127.0.0.1",
      reason: null,
      old_value: null,
      new_value: { name: "Test User", role: "STUDENT" },
      created_at: "2023-10-01T12:00:00Z"
    },
    {
      id: "log-2",
      entity_type: "Module",
      entity_label: "Math 1",
      action: "UPDATE",
      admin_name: "Admin2",
      ip_address: "192.168.1.1",
      reason: null,
      old_value: { ects: 5, ist_benotet: true },
      new_value: { ects: 6, ist_benotet: true }, // ist_benotet hasn't changed, shouldn't render in diff
      created_at: "2023-10-02T14:30:00Z"
    },
    {
      id: "log-3",
      entity_type: "Program",
      entity_label: null, // Test null label
      action: "DELETE",
      admin_name: "SuperAdmin",
      ip_address: null,
      reason: "Outdated program",
      old_value: { status: "ACTIVE" },
      new_value: null,
      created_at: "2023-10-03T09:15:00Z"
    },
    {
      id: "log-4",
      entity_type: "System", // Not in standard ENTITY_TYPES array but possible in DB
      entity_label: "Login event",
      action: "LOGIN",
      admin_name: "Unknown",
      ip_address: "10.0.0.1",
      reason: null,
      old_value: null,
      new_value: null,
      created_at: "2023-10-04T08:00:00Z"
    },
    {
      id: "log-5",
      entity_type: "User",
      entity_label: "archived@example.com",
      action: "UNKNOWN_ACTION_TEST", // Test fallback ActionBadge
      admin_name: "Admin3",
      ip_address: "8.8.8.8",
      reason: null,
      old_value: null,
      new_value: null,
      created_at: "2023-10-05T08:00:00Z"
    }
  ],
  total: 50,
  page: 1,
  page_size: 25,
  total_pages: 2
};

describe("AdminAuditLogPage", () => {
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useAdminAuditLogs as jest.Mock).mockReturnValue({ data: mockLogs, isLoading: false, error: null });
  });

  const renderPage = () => {
    return render(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminAuditLogPage />
      </NextIntlClientProvider>
    );
  };

  it("renders loading, error, and empty states", () => {
    // Loading
    (useAdminAuditLogs as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null });
    const { container, rerender } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    // Error
    (useAdminAuditLogs as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: new Error("Failed") });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminAuditLogPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Failed to load audit logs")).toBeInTheDocument();

    // Empty
    (useAdminAuditLogs as jest.Mock).mockReturnValue({ data: { items: [], total: 0, total_pages: 1 }, isLoading: false, error: null });
    rerender(
      <NextIntlClientProvider locale="de" messages={mockMessages}>
        <AdminAuditLogPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("No audit logs found")).toBeInTheDocument();
  });

  it("renders timeline with various action badges and labels", () => {
    renderPage();

    // Assert total
    expect(screen.getByText("Total 50 entries")).toBeInTheDocument();

    // CREATE Action
    expect(screen.getAllByText("CREATE").length).toBeGreaterThan(0);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    
    // UPDATE Action
    expect(screen.getAllByText("UPDATE").length).toBeGreaterThan(0);
    expect(screen.getByText("Math 1")).toBeInTheDocument();

    // DELETE Action & Reason
    expect(screen.getAllByText("DELETE").length).toBeGreaterThan(0);
    expect(screen.getByText("Outdated program")).toBeInTheDocument();

    // Unknown Action Fallback
    expect(screen.getByText("admin.auditLog.actionUNKNOWN_ACTION_TEST")).toBeInTheDocument();

    // Admin names and IP
    expect(screen.getAllByText("By SuperAdmin").length).toBeGreaterThan(0);
    expect(screen.getByText("127.0.0.1")).toBeInTheDocument();
  });

  it("renders diff block correctly", () => {
    renderPage();

    // Diff 1: CREATE (only new values)
    expect(screen.getByText("name:")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("role:")).toBeInTheDocument();
    expect(screen.getByText("STUDENT")).toBeInTheDocument();

    // Diff 2: UPDATE (changed values)
    expect(screen.getByText("ects:")).toBeInTheDocument();
    expect(screen.getByText("5")).toHaveClass("line-through", "text-red-600");
    expect(screen.getByText("6")).toHaveClass("text-green-600");
    // Unchanged value shouldn't be rendered
    expect(screen.queryByText("ist_benotet:")).not.toBeInTheDocument();

    // Diff 3: DELETE (only old values)
    expect(screen.getByText("status:")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toHaveClass("line-through");
  });

  it("handles filter changes and resets page", async () => {
    renderPage();

    const entitySelect = screen.getAllByRole("combobox")[0];
    const actionSelect = screen.getAllByRole("combobox")[1];
    
    fireEvent.change(entitySelect, { target: { value: "User" } });
    fireEvent.change(actionSelect, { target: { value: "CREATE" } });

    // Since the component is controlled by state, changing filters causes a re-render.
    // The useAdminAuditLogs hook should be called with updated values.
    // We can't directly check hook arguments synchronously easily without spy, but we can verify Reset button appears.
    expect(screen.getByRole("button", { name: "Reset Filters" })).toBeInTheDocument();

    // Test Date pickers (input type="date" doesn't have combobox role, let's use placeholder or just query by label if possible, actually they don't have aria-labels, we can use container query or getByDisplayValue)
    // There are two date inputs.
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: "2023-10-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2023-10-31" } });

    // Reset
    fireEvent.click(screen.getByRole("button", { name: "Reset Filters" }));
    
    // Reset should hide the button
    expect(screen.queryByRole("button", { name: "Reset Filters" })).not.toBeInTheDocument();
    
    // Selects should be back to empty
    expect((entitySelect as HTMLSelectElement).value).toBe("");
    expect((actionSelect as HTMLSelectElement).value).toBe("");
  });

  it("handles pagination", () => {
    renderPage();

    const prevBtn = screen.getByRole("button", { name: "Previous" });
    const nextBtn = screen.getByRole("button", { name: "Next" });

    // Initial state: page 1
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Click Next
    fireEvent.click(nextBtn);
    
    // In our mock, total_pages is 2. So after clicking Next, we should be on page 2.
    // Since we don't mock the internal state update reflecting back to mockLogs immediately (it's hardcoded mock),
    // we can at least ensure the button clicks don't crash. 
    // Wait, the component state `page` becomes 2. The text "Page 2 of 2" should appear.
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    // Now prev should be enabled and next should be disabled (since we are on page 2 and total is 2)
    // Actually, after clicking next, the state changes to 2.
    // But does the DOM update the disabled attributes based on total_pages=2 and page=2? Yes.
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();

    // Click Prev
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("handles refresh button", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-audit-log"] });
  });

  it("handles missing old_value and new_value safely in DiffBlock", () => {
    (useAdminAuditLogs as jest.Mock).mockReturnValue({
      data: {
        items: [{
          id: "log-null-diff",
          entity_type: "Test",
          action: "UPDATE",
          admin_name: "Admin",
          old_value: null,
          new_value: null,
          created_at: "2023-10-01T12:00:00Z"
        }],
        total: 1,
        total_pages: 1
      },
      isLoading: false,
      error: null
    });
    
    renderPage();
    // Diff block shouldn't crash
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("handles empty object diff safely in DiffBlock", () => {
    (useAdminAuditLogs as jest.Mock).mockReturnValue({
      data: {
        items: [{
          id: "log-empty-diff",
          entity_type: "TestEmpty",
          action: "UPDATE",
          admin_name: "Admin",
          old_value: {},
          new_value: {},
          created_at: "2023-10-01T12:00:00Z"
        }],
        total: 1,
        total_pages: 1
      },
      isLoading: false,
      error: null
    });
    
    renderPage();
    // Diff block should return null for empty objects
    expect(screen.getByText("TestEmpty")).toBeInTheDocument();
  });
});
