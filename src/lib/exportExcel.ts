import * as xlsx from "xlsx";

/**
 * Exports an array of objects to an Excel (XLSX) file.
 * Automatically formats headers, adjusting for simple camel/snake cases to Title Case.
 */
export function exportToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) {
        alert("No data to export");
        return;
    }

    // Custom formatting for headers: snake_case to Title Case
    const formatHeader = (key: string) => {
        return key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    const formattedData = data.map(row => {
        const newRow: any = {};
        for (const key in row) {
            newRow[formatHeader(key)] = row[key];
        }
        return newRow;
    });

    const worksheet = xlsx.utils.json_to_sheet(formattedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Report Data");

    // Add some simple column width auto-sizing based on header length
    const cols = Object.keys(formattedData[0]).map(key => ({
        wch: Math.max(key.length + 5, 12)
    }));
    worksheet["!cols"] = cols;

    xlsx.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
