import csv
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS_DIR = ROOT / "Tests"
TEMPLATE_PATH = ROOT / "Report5.1_Unit Test.xlsx - FUNC_01 (1).csv"
FUNCTIONS_PATH = ROOT / "Report5.1_Unit Test.xlsx - Functions (1).csv"
OUTPUT_DIR = ROOT / "Reports"


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
    # Map: method -> list of {utcid, type}
    results = {}

    method_re = re.compile(r"\[Trait\(\"Method\",\s*\"(?P<method>[^\"]+)\"\)\]")
    utcid_re = re.compile(r"\[Trait\(\"UTCID\",\s*\"(?P<utcid>UTCID\d+)\"\)\]")
    type_re = re.compile(r"\[Trait\(\"Type\",\s*\"(?P<type>[NAB])\"\)\]")
    signature_re = re.compile(r"public\s+(?:async\s+)?(?:Task|void)\s+\w+\(")

    for path in TESTS_DIR.glob("*.cs"):
        current = {}
        with path.open(encoding="utf-8") as f:
            for line in f:
                m = method_re.search(line)
                if m:
                    current["method"] = m.group("method").strip()
                m = utcid_re.search(line)
                if m:
                    current["utcid"] = m.group("utcid").strip()
                m = type_re.search(line)
                if m:
                    current["type"] = m.group("type").strip()

                if signature_re.search(line) and current.get("method") and current.get("utcid"):
                    method = current["method"]
                    results.setdefault(method, []).append(
                        {"utcid": current.get("utcid"), "type": current.get("type", "")}
                    )
                    current = {}

    # sort by UTCID number
    for method, tests in results.items():
        tests.sort(key=lambda x: int(re.sub(r"\D", "", x["utcid"] or "0")))
    return results


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


def set_row_value(row, idx, value):
    if idx < len(row):
        row[idx] = value


def build_csv_for_function(func, tests, template_rows, max_len):
    rows = [r[:] for r in template_rows]

    # Header updates
    header_idx = find_row_index(rows, "Code Module")
    if header_idx >= 0:
        row = rows[header_idx]
        set_row_value(row, 2, func["code"])
        set_row_value(row, 10, func["method"])

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

    if utcid_header_idx >= 0:
        header_row = ["" for _ in range(max_len)]
        header_row[0:utcid_col_start] = rows[utcid_header_idx][0:utcid_col_start]
        for i, t in enumerate(tests):
            set_row_value(header_row, utcid_col_start + i, t["utcid"])
        rows[utcid_header_idx] = header_row

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

    for func in functions:
        tests = tests_by_method.get(func["method"], [])
        rows = build_csv_for_function(func, tests, template_rows, max_len)
        output_path = OUTPUT_DIR / f"Report5.1_Unit Test.xlsx - {func['sheet']}.csv"
        write_csv(output_path, rows)


if __name__ == "__main__":
    main()
