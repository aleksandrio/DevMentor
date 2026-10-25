import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableColumn } from "./data-table";

interface User {
  id: string;
  email: string;
}

const columns: DataTableColumn<User>[] = [
  { id: "email", header: "E-mail", cell: (row) => row.email, className: "w-64" },
];

const emptyState = { title: "Brak użytkowników", description: "Nikt się jeszcze nie zarejestrował." };

function makeUsers(count: number): User[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    email: `user${index + 1}@example.com`,
  }));
}

function getId(row: User) {
  return row.id;
}

describe("DataTable", () => {
  it("shows the error with a retry button instead of rows", async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={makeUsers(2)}
        getRowId={getId}
        error="Nie udało się pobrać listy."
        onRetry={onRetry}
        emptyState={emptyState}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się pobrać listy.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the loading state while rows are undefined", () => {
    render(
      <DataTable columns={columns} rows={undefined} getRowId={getId} error={null} emptyState={emptyState} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Ładowanie…");
  });

  it("shows the empty state for no rows", () => {
    render(<DataTable columns={columns} rows={[]} getRowId={getId} emptyState={emptyState} />);
    expect(screen.getByText("Brak użytkowników")).toBeInTheDocument();
    expect(screen.getByText("Nikt się jeszcze nie zarejestrował.")).toBeInTheDocument();
  });

  it("renders the caption, headers and cells without actions or pagination", () => {
    render(
      <DataTable
        columns={columns}
        rows={makeUsers(2)}
        getRowId={getId}
        emptyState={emptyState}
        caption="Użytkownicy"
        rowActions={[]}
      />,
    );

    const table = screen.getByRole("table", { name: "Użytkownicy" });
    expect(within(table).getByRole("columnheader", { name: "E-mail" })).toHaveClass("w-64");
    expect(within(table).queryByRole("columnheader", { name: "Akcje" })).not.toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "user2@example.com" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Paginacja" })).not.toBeInTheDocument();
  });

  it("renders row actions and passes the row to onSelect", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={makeUsers(1)}
        getRowId={getId}
        emptyState={emptyState}
        rowActions={[
          { label: "Edytuj", onSelect: onEdit },
          { label: "Usuń", onSelect: onDelete, isDestructive: true },
        ]}
      />,
    );

    expect(screen.queryByRole("caption")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Akcje" })).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: "Usuń" });
    expect(deleteButton.className).toContain("text-destructive");
    expect(screen.getByRole("button", { name: "Edytuj" }).className).not.toContain("text-destructive");

    await userEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith({ id: "1", email: "user1@example.com" });
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("paginates with the default page size of 20", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={makeUsers(21)} getRowId={getId} emptyState={emptyState} />);

    const nav = screen.getByRole("navigation", { name: "Paginacja" });
    expect(nav).toHaveTextContent("Strona 1 z 2");
    expect(screen.getAllByRole("row")).toHaveLength(21);
    const previous = within(nav).getByRole("button", { name: "Poprzednia" });
    const next = within(nav).getByRole("button", { name: "Następna" });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);
    expect(nav).toHaveTextContent("Strona 2 z 2");
    expect(screen.getByRole("cell", { name: "user21@example.com" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "user1@example.com" })).not.toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();

    await user.click(previous);
    expect(nav).toHaveTextContent("Strona 1 z 2");
    expect(screen.getByRole("cell", { name: "user1@example.com" })).toBeInTheDocument();
  });

  it("honours a custom page size and clamps the page when rows shrink", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DataTable columns={columns} rows={makeUsers(5)} getRowId={getId} emptyState={emptyState} pageSize={2} />,
    );

    expect(screen.getByRole("navigation", { name: "Paginacja" })).toHaveTextContent("Strona 1 z 3");
    await user.click(screen.getByRole("button", { name: "Następna" }));
    await user.click(screen.getByRole("button", { name: "Następna" }));
    expect(screen.getByRole("navigation", { name: "Paginacja" })).toHaveTextContent("Strona 3 z 3");
    expect(screen.getByRole("cell", { name: "user5@example.com" })).toBeInTheDocument();

    rerender(
      <DataTable columns={columns} rows={makeUsers(3)} getRowId={getId} emptyState={emptyState} pageSize={2} />,
    );

    expect(screen.getByRole("navigation", { name: "Paginacja" })).toHaveTextContent("Strona 2 z 2");
    expect(screen.getByRole("cell", { name: "user3@example.com" })).toBeInTheDocument();
  });
});
