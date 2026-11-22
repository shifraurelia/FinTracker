
#include <iostream>
#include <iomanip>
#include <string>
#include <cstdlib>
#include <sqlite3.h>
#include "database.h"

using namespace std;

string escapeJSON(const string& text) {
    string result;

    for (char c : text) {
        if (c == '"') result += "\\\"";
        else if (c == '\\') result += "\\\\";
        else if (c == '\n') result += "\\n";
        else if (c == '\r') result += "\\r";
        else if (c == '\t') result += "\\t";
        else result += c;
    }

    return result;
}

int main(int argc, char* argv[]) {
    if (!initializeDatabase()) {
        cerr << "Database initialization failed." << endl;
        return 1;
    }

    if (argc < 2) {
        cerr << "Missing command." << endl;
        return 1;
    }

    string command = argv[1];

    // GET TRANSACTIONS
    if (command == "list") {
        sqlite3* db = nullptr;

        if (sqlite3_open("backend/fintracker.db", &db) != SQLITE_OK) {
            cerr << "Database connection failed." << endl;
            if (db) sqlite3_close(db);
            return 1;
        }

        const char* sql =
            "SELECT id, title, type, category, amount, date "
            "FROM transactions ORDER BY id DESC;";

        sqlite3_stmt* stmt = nullptr;

        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
            cerr << "Query failed." << endl;
            sqlite3_close(db);
            return 1;
        }

        cout << "[";

        bool first = true;

        while (sqlite3_step(stmt) == SQLITE_ROW) {
            if (!first) cout << ",";
            first = false;

            cout << "{"
                 << "\"id\":" << sqlite3_column_int(stmt, 0) << ","
                 << "\"title\":\"" << escapeJSON(
                        reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1))) << "\","
                 << "\"type\":\"" << escapeJSON(
                        reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2))) << "\","
                 << "\"category\":\"" << escapeJSON(
                        reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3))) << "\","
                 << "\"amount\":" << sqlite3_column_double(stmt, 4) << ","
                 << "\"date\":\"" << escapeJSON(
                        reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5))) << "\""
                 << "}";
        }

        cout << "]";

        sqlite3_finalize(stmt);
        sqlite3_close(db);
    }

    // ADD TRANSACTION
    else if (command == "add") {
        if (argc != 7) {
            cerr << "Invalid transaction data." << endl;
            return 1;
        }

        string title = argv[2];
        string type = argv[3];
        string category = argv[4];
        double amount;

        try {
            amount = stod(argv[5]);
        } catch (...) {
            cerr << "Invalid amount." << endl;
            return 1;
        }

        string date = argv[6];

        if (title.empty() || category.empty() ||
            amount <= 0 || date.empty() ||
            (type != "Income" && type != "Expense")) {
            cerr << "Invalid transaction details." << endl;
            return 1;
        }

        if (addTransaction(title, type, category, amount, date)) {
            cout << "{\"success\":true}";
        } else {
            cerr << "Failed to save transaction." << endl;
            return 1;
        }
    }

    // GET SUMMARY
    else if (command == "summary") {
        double income = getTotal("Income");
        double expenses = getTotal("Expense");
        double balance = income - expenses;

        cout << fixed << setprecision(2);
        cout << "{"
             << "\"income\":" << income << ","
             << "\"expenses\":" << expenses << ","
             << "\"balance\":" << balance
             << "}";
    }

    else {
        cerr << "Unknown command." << endl;
        return 1;
    }

    return 0;
}
