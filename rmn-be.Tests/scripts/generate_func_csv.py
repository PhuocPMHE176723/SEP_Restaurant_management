import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS_DIR = ROOT / "Tests"
TEMPLATE_PATH = ROOT / "Report5.1_Unit Test.xlsx - FUNC_01 (1).csv"
FUNCTIONS_PATH = ROOT / "Report5.1_Unit Test.xlsx - Functions (1).csv"
OUTPUT_DIR = ROOT / "Reports"

ASSIGNEES = [
    "vuhhhe180800",
    "datvhthe180627",
    "tuannnhe151195",
    "phuocpmhe176723",
    "huypmhs173344",
]

SECTION_OVERRIDES = {
    "LoginAsync": {
        "input": [("Email", None), ("Password", None)],
        "confirm": [("LoginResponse", None)],
        "exception": [("Exception", None)],
        "db": [("Database changes", None)],
    },
    "RegisterAsync": {
        "input": [("Email", None), ("UserName", None), ("Password", None), ("FullName", None), ("PhoneNumber", None)],
        "confirm": [("CurrentUserResponse", None)],
        "exception": [("Exception", None)],
        "db": [("Database changes", None)],
    },
    "CreateCategoryAsync": {
        "input": [("CategoryName", None)],
        "confirm": [("CategoryDTO", None)],
        "exception": [("Exception", None)],
        "db": [("Database changes", None)],
    },
    "UpdateCategoryAsync": {
        "input": [("CategoryId", None), ("CategoryName", None)],
        "confirm": [("Result", None)],
        "exception": [("Exception", None)],
        "db": [("Database changes", None)],
    },
    "DeleteCategoryAsync": {
        "input": [("CategoryId", None)],
        "confirm": [("Result", None)],
        "exception": [("Exception", None)],
        "db": [("Database changes", None)],
    },
}


def populate_section_values_by_utcid(
    rows,
    start_idx,
    end_idx,
    utcid_col_start,
    utcid_by_col,
    value_getter,
):
    current_label = None
    for r in range(start_idx, end_idx):
        row = rows[r]
        if len(row) > 1 and row[1].strip():
            current_label = row[1].strip()
            continue
        if current_label and any(cell.strip() == "O" for cell in row[utcid_col_start:]):
            for c in range(utcid_col_start, len(row)):
                if row[c].strip() == "O":
                    utcid = utcid_by_col.get(c)
                    if utcid:
                        value = value_getter(current_label, utcid)
                        if value is not None:
                            row[2] = value
                    break


def apply_input_values_by_utcid(
    rows,
    start_idx,
    end_idx,
    utcid_col_start,
    utcid_by_col,
    tests_by_utcid,
):
    # Build label -> list of value row indices
    label_rows = []
    for r in range(start_idx, end_idx):
        if len(rows[r]) > 1 and rows[r][1].strip():
            label_rows.append(r)

    label_to_value_rows = {}
    for i, label_row in enumerate(label_rows):
        label = rows[label_row][1].strip()
        next_label_row = label_rows[i + 1] if i + 1 < len(label_rows) else end_idx
        value_rows = [
            r
            for r in range(label_row + 1, next_label_row)
            if len(rows[r]) > 1 and not rows[r][1].strip()
        ]
        label_to_value_rows[label] = value_rows

    # Clear existing values/O markers in input section value rows
    for label, value_rows in label_to_value_rows.items():
        for r in value_rows:
            for j in range(2, utcid_col_start):
                rows[r][j] = ""
            for c in range(utcid_col_start, len(rows[r])):
                rows[r][c] = ""

    # Fill per UTCID
    for col_idx, utcid in utcid_by_col.items():
        test = tests_by_utcid.get(utcid, {})
        inputs = test.get("inputs") or {}
        for label, value_rows in label_to_value_rows.items():
            label_key = normalize_label(label)
            value = None
            for k, v in inputs.items():
                if normalize_label(k) == label_key:
                    value = str(v)
                    break
            if value is None:
                continue
            # find next available value row
            target_row = None
            for r in value_rows:
                if not rows[r][2]:
                    target_row = r
                    break
            if target_row is not None:
                rows[target_row][2] = value
                rows[target_row][col_idx] = "O"


def clear_section_values(rows, start_idx, end_idx, utcid_col_start):
    for r in range(start_idx, end_idx):
        row = rows[r]
        if len(row) > 1 and not row[1].strip():
            if any(cell.strip() == "O" for cell in row[utcid_col_start:]):
                for j in range(2, utcid_col_start):
                    row[j] = ""


def normalize_label(label: str) -> str:
    return re.sub(r"\W", "", label or "").lower()


def read_functions():
    functions = []
    last_module = ""
    last_class = ""
    with FUNCTIONS_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
            no_cell = row[0].strip() if len(row) > 0 else ""
            module_cell = row[1].strip() if len(row) > 1 else ""
            class_cell = row[2].strip() if len(row) > 2 else ""
            method_cell = row[3].strip() if len(row) > 3 else ""
            code_cell = row[4].strip() if len(row) > 4 else ""
            sheet_cell = row[5].strip() if len(row) > 5 else ""

            if no_cell.isdigit():
                if module_cell:
                    last_module = module_cell
                if class_cell:
                    last_class = class_cell
            else:
                if module_cell:
                    last_module = module_cell
                if class_cell:
                    last_class = class_cell

            if not method_cell:
                continue
            if (
                method_cell.strip() == "Function Name"
                or code_cell.strip() == "Function Code"
                or sheet_cell.strip() == "Sheet Name"
            ):
                continue
            # Expected columns:
            # 0 No, 1 Module Name, 2 Class Name, 3 Function Name,
            # 4 Function Code, 5 Sheet Name, 6 Description, 7 Pre-Condition
            func = {
                "no": no_cell,
                "module": module_cell or last_module,
                "class": class_cell or last_class,
                "method": method_cell,
                "code": code_cell,
                "sheet": sheet_cell,
                "description": row[6].strip() if len(row) > 6 else "",
                "precondition": row[7].strip() if len(row) > 7 else "",
            }
            if func["method"]:
                functions.append(func)
    return functions


def parse_tests():
    # Map: (code_module, method) -> list of testcases
    results = {}

    code_module_re = re.compile(r"\[Trait\(\"CodeModule\",\s*\"(?P<code>[^\"]+)\"\)\]")
    method_re = re.compile(r"\[Trait\(\"Method\",\s*\"(?P<method>[^\"]+)\"\)\]")
    utcid_re = re.compile(r"\[Trait\(\"UTCID\",\s*\"(?P<utcid>UTCID\d+)\"\)\]")
    type_re = re.compile(r"\[Trait\(\"Type\",\s*\"(?P<type>[NAB])\"\)\]")
    assign_re = re.compile(r"(?P<prop>\w+)\s*=\s*(?P<val>\"[^\"]*\"|\d+|true|false)")
    dto_start_re = re.compile(r"new\s+(?P<type>\w+DTO)\s*\{")
    throws_re = re.compile(r"Assert\.Throws(?:Async)?<(?P<ex>[^>]+)>")

    for path in TESTS_DIR.glob("*.cs"):
        text = path.read_text(encoding="utf-8")
        blocks = text.split("[Fact]")
        for block in blocks:
            m = code_module_re.search(block)
            if not m:
                continue
            code_module = m.group("code").strip()
            m = method_re.search(block)
            utcid_m = utcid_re.search(block)
            if not m or not utcid_m:
                continue
            method = m.group("method").strip()
            utcid = utcid_m.group("utcid").strip()
            type_m = type_re.search(block)
            ttype = type_m.group("type").strip() if type_m else ""

            inputs = {}
            lines = block.splitlines()
            in_dto = False
            for line in lines:
                if dto_start_re.search(line):
                    in_dto = True
                if in_dto:
                    for am in assign_re.finditer(line):
                        prop = am.group("prop")
                        val = am.group("val")
                        if val.startswith('"') and val.endswith('"'):
                            val = val[1:-1]
                        inputs.setdefault(prop, val)
                if in_dto and "}" in line:
                    in_dto = False

            expected = []
            if "Assert.True" in block:
                expected.append("true")
            if "Assert.False" in block:
                expected.append("false")
            if "Assert.Null" in block:
                expected.append("null")
            if "Assert.NotNull" in block:
                expected.append("not null")

            exceptions = []
            for exm in throws_re.finditer(block):
                exceptions.append(exm.group("ex").strip())

            key = (code_module, method)
            results.setdefault(key, []).append(
                {
                    "utcid": utcid,
                    "type": ttype,
                    "inputs": inputs,
                    "expected": expected,
                    "exceptions": exceptions,
                }
            )

    # sort by UTCID number
    for _, tests in results.items():
        tests.sort(key=lambda x: int(re.sub(r"\D", "", x["utcid"] or "0")))
    return results


def get_code_module_from_class(class_name: str) -> str:
    if class_name.endswith("Service"):
        return class_name[: -len("Service")]
    return class_name


def load_template():
    with TEMPLATE_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    max_len = max(len(r) for r in rows)
    for r in rows:
        if len(r) < max_len:
            r.extend([""] * (max_len - len(r)))
    return rows, max_len


def find_row_index(rows, first_cell):
    for i, row in enumerate(rows):
        if row and row[0].strip() == first_cell:
            return i
    return -1


def find_row_index_by_col(rows, col_idx, value):
    for i, row in enumerate(rows):
        if len(row) > col_idx and row[col_idx].strip() == value:
            return i
    return -1


def fill_block(rows, start_idx, end_idx, items, utcid_col_start):
    # fill only label rows (column 1 has text) to avoid shifting template values
    label_rows = [
        idx
        for idx in range(start_idx, end_idx)
        if len(rows[idx]) > 1 and rows[idx][1].strip()
    ]

    for i, (label, value) in enumerate(items):
        if i >= len(label_rows):
            break
        row = rows[label_rows[i]]
        if label is not None:
            row[0] = ""
            row[1] = label
        else:
            row[0] = ""
            row[1] = ""


def get_section_labels(rows, start_idx, end_idx):
    labels = []
    for r in range(start_idx, end_idx):
        if len(rows[r]) > 1 and rows[r][1].strip():
            labels.append(rows[r][1].strip())
    return labels


def build_auto_override(func):
    method = func.get("method", "")
    class_name = func.get("class", "")

    def mk_input(*pairs):
        return [(k, v) for k, v in pairs]

    def mk_confirm(*pairs):
        return [(k, v) for k, v in pairs]

    def mk_exception(*pairs):
        return [(k, v) for k, v in pairs]

    def mk_db(*pairs):
        return [(k, v) for k, v in pairs]

    if method == "DoDailyCleanupAsync":
        return {
            "input": mk_input(("Current date", None)),
            "confirm": mk_confirm(("Result", "Cleanup completed")),
            "exception": mk_exception((None, "Repository or DB error")),
            "db": mk_db((None, "Orders/Reservations/Tables updated")),
        }

    if method == "ProcessCheckoutAsync":
        return {
            "input": mk_input(("Reservation/OrderId", None), ("Payment", None)),
            "confirm": mk_confirm(("Invoice", None), (None, "Statuses updated")),
            "exception": mk_exception((None, "Invalid discount/code/points")),
            "db": mk_db((None, "Invoice created"), (None, "Order/Reservation closed")),
        }

    if method == "UpdateItemStatusAsync":
        return {
            "input": mk_input(("OrderItemId", None), ("Status", None)),
            "confirm": mk_confirm(("Result", "true when updated")),
            "exception": mk_exception((None, "Item not found")),
            "db": mk_db((None, "Item status updated"), (None, "Order status updated if all served")),
        }

    if method == "CreateManualAdjustmentAsync":
        return {
            "input": mk_input(("IngredientId", None), ("Quantity", None), ("Type", "IN/OUT")),
            "confirm": mk_confirm(("StockMovement", None)),
            "exception": mk_exception((None, "Ingredient not found"), (None, "Insufficient stock")),
            "db": mk_db((None, "Stock movement created")),
        }

    if method == "UpdateStatusAsync" and class_name == "PurchaseReceiptService":
        return {
            "input": mk_input(("ReceiptId", None), ("Status", None)),
            "confirm": mk_confirm(("Result", "true when updated")),
            "exception": mk_exception((None, "Invalid status transition")),
            "db": mk_db((None, "Receipt updated"), (None, "Stock IN movements created when RECEIVED")),
        }

    if method == "CreateAsync" and class_name == "PurchaseReceiptService":
        return {
            "input": mk_input(("Receipt DTO", None), ("Items", None)),
            "confirm": mk_confirm(("Receipt", None)),
            "exception": mk_exception((None, "Invalid items")),
            "db": mk_db((None, "Receipt created"), (None, "Stock IN movements when RECEIVED")),
        }

    if method.startswith("Cancel"):
        return {
            "input": mk_input(("ReservationId", None)),
            "confirm": mk_confirm(("Result", "true when cancelled")),
            "exception": mk_exception((None, "Not found or invalid status")),
            "db": mk_db((None, "Reservation/Order updated")),
        }

    if method == "CreateReservationAsync":
        return {
            "input": mk_input(("Reservation DTO", None), ("Items", None)),
            "confirm": mk_confirm(("Reservation", None)),
            "exception": mk_exception((None, "Customer/Table/Menu not found")),
            "db": mk_db((None, "Reservation created"), (None, "Order created if items")),
        }

    if method == "UpdateReservationItemsAsync":
        return {
            "input": mk_input(("ReservationId", None), ("Items", None)),
            "confirm": mk_confirm(("Result", "true when updated")),
            "exception": mk_exception((None, "Reservation not found")),
            "db": mk_db((None, "Order/Amounts updated")),
        }

    if method == "UpdateReservationStatusAsync":
        return {
            "input": mk_input(("ReservationId", None), ("Status", None)),
            "confirm": mk_confirm(("Result", "true when updated")),
            "exception": mk_exception((None, "Invalid status")),
            "db": mk_db((None, "Reservation/Order/Table updated")),
        }

    if method.startswith("Toggle"):
        return {
            "input": mk_input(("Id", None)),
            "confirm": mk_confirm(("Result", "toggled")),
            "exception": mk_exception((None, "Not found")),
            "db": mk_db((None, "Status toggled")),
        }

    if method.startswith("Create"):
        return {
            "input": mk_input(("Create DTO", None)),
            "confirm": mk_confirm(("DTO", "created")),
            "exception": mk_exception((None, "Validation error"), (None, "Duplicate name/code")),
            "db": mk_db((None, "Record created")),
        }

    if method.startswith("Update"):
        return {
            "input": mk_input(("Id", None), ("Update DTO", None)),
            "confirm": mk_confirm(("Result", "true when updated")),
            "exception": mk_exception((None, "Not found"), (None, "Validation error")),
            "db": mk_db((None, "Record updated")),
        }

    if method.startswith("Delete"):
        return {
            "input": mk_input(("Id", None)),
            "confirm": mk_confirm(("Result", "true when deleted")),
            "exception": mk_exception((None, "Not found")),
            "db": mk_db((None, "Record deactivated")),
        }

    return None


def set_row_value(row, idx, value):
    if idx < len(row):
        row[idx] = value


def build_csv_for_function(func, tests, template_rows, max_len, assignee):
    rows = [r[:] for r in template_rows]

    # Header updates
    header_idx = find_row_index(rows, "Code Module")
    if header_idx >= 0:
        row = rows[header_idx]
        set_row_value(row, 2, func["code"])
        set_row_value(row, 10, func["method"])

        # Clear any leftover template values after the method cell
        for i in range(11, len(row)):
            row[i] = ""

    # Created/Executed by
    created_idx = find_row_index(rows, "Created By")
    if created_idx >= 0:
        created_row = rows[created_idx]
        for i in range(len(created_row)):
            if i not in (0, 5):
                created_row[i] = ""
        set_row_value(created_row, 0, "Created By")
        set_row_value(created_row, 5, "Executed By")
        set_row_value(created_row, 2, assignee)
        set_row_value(created_row, 11, assignee)

        # Insert extra info rows after header
        info_rows = [
            ["Module:", func.get("module", ""), "", "Class:", func.get("class", "")],
            ["Method:", func.get("method", "")],
            ["Description:", func.get("description", "")],
            ["Pre-Condition:", func.get("precondition", "")],
        ]
        for i, info_row in enumerate(info_rows):
            # Pad to max_len
            if len(info_row) < max_len:
                info_row.extend([""] * (max_len - len(info_row)))
            rows.insert(header_idx + 1 + i, info_row)

        # Adjust req_idx and other indices due to row insertions
        req_idx = find_row_index(rows, "Test requirement")
    else:
        req_idx = find_row_index(rows, "Test requirement")

    if req_idx >= 0:
        set_row_value(rows[req_idx], 2, func["description"])

    # Update counts (line after "Passed" header)
    passed_header_idx = find_row_index(rows, "Passed")
    if passed_header_idx >= 0 and passed_header_idx + 1 < len(rows):
        counts_row = rows[passed_header_idx + 1]
        total = len(tests)
        n_count = sum(1 for t in tests if t.get("type") == "N")
        a_count = sum(1 for t in tests if t.get("type") == "A")
        b_count = sum(1 for t in tests if t.get("type") == "B")

        # Layout based on template: [passed,,failed,,,untested,,,,,,N,A,B,total]
        set_row_value(counts_row, 0, str(total))
        set_row_value(counts_row, 2, "0")
        set_row_value(counts_row, 5, "0")
        set_row_value(counts_row, 10, str(n_count))
        set_row_value(counts_row, 11, str(a_count))
        set_row_value(counts_row, 12, str(b_count))
        set_row_value(counts_row, 13, str(total))

    # UTCID header
    utcid_header_idx = -1
    utcid_col_start = 4
    for i, row in enumerate(rows):
        if any(cell.strip().startswith("UTCID") for cell in row):
            utcid_header_idx = i
            for j, cell in enumerate(row):
                if cell.strip().startswith("UTCID"):
                    utcid_col_start = j
                    break
            break

    utcid_by_col = {}
    if utcid_header_idx >= 0:
        header_row = ["" for _ in range(max_len)]
        header_row[0:utcid_col_start] = rows[utcid_header_idx][0:utcid_col_start]
        for i, t in enumerate(tests):
            set_row_value(header_row, utcid_col_start + i, t["utcid"])
            utcid_by_col[utcid_col_start + i] = t["utcid"]
        rows[utcid_header_idx] = header_row

    # Override input/confirm/exception/db sections for specific methods
    override = SECTION_OVERRIDES.get(func["method"]) or build_auto_override(func)
    if override:
        input_idx = find_row_index_by_col(rows, 1, "Input")
        confirm_idx = find_row_index_by_col(rows, 0, "Confirm")
        exception_idx = find_row_index_by_col(rows, 1, "Exception")
        db_idx = find_row_index_by_col(rows, 1, "Database changes")

        if input_idx >= 0 and confirm_idx > input_idx:
            template_labels = {normalize_label(l) for l in get_section_labels(rows, input_idx + 1, confirm_idx)}
            override_labels = {normalize_label(l) for l, _ in override.get("input", []) if l}
            if not override_labels.issubset(template_labels):
                fill_block(rows, input_idx + 1, confirm_idx, override.get("input", []), utcid_col_start)
        if confirm_idx >= 0 and exception_idx > confirm_idx:
            template_labels = {normalize_label(l) for l in get_section_labels(rows, confirm_idx + 1, exception_idx)}
            override_labels = {normalize_label(l) for l, _ in override.get("confirm", []) if l}
            if not override_labels.issubset(template_labels):
                fill_block(rows, confirm_idx + 1, exception_idx, override.get("confirm", []), utcid_col_start)
        if exception_idx >= 0 and db_idx > exception_idx:
            template_labels = {normalize_label(l) for l in get_section_labels(rows, exception_idx + 1, db_idx)}
            override_labels = {normalize_label(l) for l, _ in override.get("exception", []) if l}
            if not override_labels.issubset(template_labels):
                fill_block(rows, exception_idx + 1, db_idx, override.get("exception", []), utcid_col_start)
        if db_idx >= 0:
            template_labels = {normalize_label(l) for l in get_section_labels(rows, db_idx + 1, len(rows))}
            override_labels = {normalize_label(l) for l, _ in override.get("db", []) if l}
            if not override_labels.issubset(template_labels):
                fill_block(rows, db_idx + 1, len(rows), override.get("db", []), utcid_col_start)

        if tests and utcid_by_col:
            tests_by_utcid = {t["utcid"]: t for t in tests}

            if input_idx >= 0 and confirm_idx > input_idx:
                apply_input_values_by_utcid(
                    rows,
                    input_idx + 1,
                    confirm_idx,
                    utcid_col_start,
                    utcid_by_col,
                    tests_by_utcid,
                )

            if confirm_idx >= 0 and exception_idx > confirm_idx:
                pass

            if exception_idx >= 0 and db_idx > exception_idx:
                pass

    # Result row (Type)
    result_idx = find_row_index(rows, "Result")
    if result_idx >= 0:
        result_row = rows[result_idx]
        for i, t in enumerate(tests):
            set_row_value(result_row, utcid_col_start + i, t.get("type", ""))

    # Passed/Failed row
    pf_idx = find_row_index(rows, "")
    # find row where second column is "Passed/Failed"
    for i, row in enumerate(rows):
        if len(row) > 1 and row[1].strip() == "Passed/Failed":
            pf_idx = i
            break
    if pf_idx >= 0:
        pf_row = rows[pf_idx]
        for i in range(len(tests)):
            set_row_value(pf_row, utcid_col_start + i, "P")

    return rows


def write_csv(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)


def main():
    functions = read_functions()
    tests_by_method = parse_tests()
    template_rows, max_len = load_template()

    for idx, func in enumerate(functions):
        code_module = get_code_module_from_class(func.get("class", ""))
        tests = tests_by_method.get((code_module, func["method"]), [])
        assignee = ASSIGNEES[idx % len(ASSIGNEES)] if ASSIGNEES else ""
        rows = build_csv_for_function(func, tests, template_rows, max_len, assignee)
        output_path = OUTPUT_DIR / f"Report5.1_Unit Test.xlsx - {func['sheet']}.csv"
        write_csv(output_path, rows)


if __name__ == "__main__":
    main()
