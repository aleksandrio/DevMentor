import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

describe("Table", () => {
  it("renders every part with its slot inside a scroll container", () => {
    render(
      <Table className="t">
        <TableCaption className="cap">Rezerwacje</TableCaption>
        <TableHeader className="th">
          <TableRow className="tr">
            <TableHead className="h">Termin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tb">
          <TableRow>
            <TableCell className="c">Poniedziałek</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="tf">
          <TableRow>
            <TableCell>Razem: 1</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    const table = screen.getByRole("table", { name: "Rezerwacje" });
    expect(table).toHaveAttribute("data-slot", "table");
    expect(table).toHaveClass("t");
    expect(table.parentElement).toHaveAttribute("data-slot", "table-container");

    expect(screen.getByText("Rezerwacje")).toHaveAttribute("data-slot", "table-caption");
    expect(screen.getByText("Rezerwacje")).toHaveClass("cap");
    const header = screen.getByRole("columnheader", { name: "Termin" });
    expect(header).toHaveAttribute("data-slot", "table-head");
    expect(header).toHaveClass("h");
    expect(header.parentElement).toHaveAttribute("data-slot", "table-row");
    expect(header.parentElement).toHaveClass("tr");
    expect(header.parentElement?.parentElement).toHaveAttribute("data-slot", "table-header");
    expect(header.parentElement?.parentElement).toHaveClass("th");

    const cell = screen.getByRole("cell", { name: "Poniedziałek" });
    expect(cell).toHaveAttribute("data-slot", "table-cell");
    expect(cell).toHaveClass("c");
    expect(cell.closest("tbody")).toHaveAttribute("data-slot", "table-body");
    expect(cell.closest("tbody")).toHaveClass("tb");

    const footerCell = screen.getByRole("cell", { name: "Razem: 1" });
    expect(footerCell.closest("tfoot")).toHaveAttribute("data-slot", "table-footer");
    expect(footerCell.closest("tfoot")).toHaveClass("tf");
  });
});
