
#include <iostream>
#include <iomanip>
#include <string>
#include "database.h"
#include <sqlite3.h>

using namespace std;

const char* DB_PATH = "backend/fintracker.db";

bool initializeDatabase() {
    sqlite3* db = nullptr;

    if (sqlite3_open(DB_PATH, &db) != SQLITE_OK) {
        cerr << "Database connection failed!" << endl;
        if (db) sqlite3_close(db);
        return false;
    }

    const char* createTableSQL =
        "CREATE TABLE IF NOT EXISTS transactions ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "title TEXT NOT NULL,"
        "type TEXT NOT NULL,"
        "category TEXT NOT NULL DEFAULT 'Other',"
        "amount REAL NOT NULL,"
        "date TEXT NOT NULL DEFAULT '',"
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
        ");";

    char* errorMessage = nullptr;

    if (sqlite3_exec(db, createTableSQL, nullptr, nullptr, &errorMessage) != SQLITE_OK) {
        cerr << "Table creation failed: "
             << (errorMessage ? errorMessage : "Unknown error") << endl;
        sqlite3_free(errorMessage);
        sqlite3_close(db);
        return false;
    }

    const char* migrations[] = {
        "ALTER TABLE transactions ADD COLUMN category TEXT NOT NULL DEFAULT 'Other';",
        "ALTER TABLE transactions ADD COLUMN date TEXT NOT NULL DEFAULT '';"
    };

    for (const char* sql : migrations) {
        char* migrationError = nullptr;

        int result = sqlite3_exec(db, sql, nullptr, nullptr, &migrationError);

        if (result != SQLITE_OK) {
            string error = migrationError ? migrationError : "";

            if (error.find("duplicate column name") == string::npos) {
                cerr << "Database update failed: " << error << endl;
                sqlite3_free(migrationError);
                sqlite3_close(db);
                return false;
            }

            sqlite3_free(migrationError);
        }
    }

    sqlite3_close(db);
    return true;
}

bool addTransaction(
    const string& title,
    const string& type,
    const string& category,
    double amount,
    const string& date
) {
    sqlite3* db = nullptr;

    if (sqlite3_open(DB_PATH, &db) != SQLITE_OK) {
        cerr << "Database connection failed!" << endl;
        if (db) sqlite3_close(db);
        return false;
    }

    const char* sql =
        "INSERT INTO transactions "
        "(title, type, category, amount, date) "
        "VALUES (?, ?, ?, ?, ?);";

    sqlite3_stmt* statement = nullptr;

    if (sqlite3_prepare_v2(db, sql, -1, &statement, nullptr) != SQLITE_OK) {
        cerr << "Insert preparation failed!" << endl;
        sqlite3_close(db);
        return false;
    }

    sqlite3_bind_text(statement, 1, title.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(statement, 2, type.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(statement, 3, category.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(statement, 4, amount);
    sqlite3_bind_text(statement, 5, date.c_str(), -1, SQLITE_TRANSIENT);

    bool success = sqlite3_step(statement) == SQLITE_DONE;

    if (!success) {
        cerr << "Insert failed: " << sqlite3_errmsg(db) << endl;
    }

    sqlite3_finalize(statement);
    sqlite3_close(db);

    return success;
}

void displayTransactions() {
    sqlite3* db = nullptr;

    if (sqlite3_open(DB_PATH, &db) != SQLITE_OK) {
        cerr << "Database connection failed!" << endl;
        if (db) sqlite3_close(db);
        return;
    }

    const char* sql =
        "SELECT id, title, type, category, amount, date "
        "FROM transactions ORDER BY id DESC;";

    sqlite3_stmt* statement = nullptr;

    if (sqlite3_prepare_v2(db, sql, -1, &statement, nullptr) == SQLITE_OK) {
        cout << fixed << setprecision(0);
        cout << "\n====== TRANSACTION HISTORY ======" << endl;

        while (sqlite3_step(statement) == SQLITE_ROW) {
            cout << "ID: " << sqlite3_column_int(statement, 0)
                 << " | " << reinterpret_cast<const char*>(sqlite3_column_text(statement, 1))
                 << " | " << reinterpret_cast<const char*>(sqlite3_column_text(statement, 2))
                 << " | " << reinterpret_cast<const char*>(sqlite3_column_text(statement, 3))
                 << " | Rp " << sqlite3_column_double(statement, 4)
                 << " | " << reinterpret_cast<const char*>(sqlite3_column_text(statement, 5))
                 << endl;
        }
    } else {
        cerr << "Transaction query failed!" << endl;
    }

    if (statement) sqlite3_finalize(statement);
    sqlite3_close(db);
}

double getTotal(const string& type) {
    sqlite3* db = nullptr;

    if (sqlite3_open(DB_PATH, &db) != SQLITE_OK) {
        cerr << "Database connection failed!" << endl;
        if (db) sqlite3_close(db);
        return 0;
    }

    const char* sql =
        "SELECT COALESCE(SUM(amount), 0) "
        "FROM transactions WHERE type = ?;";

    sqlite3_stmt* statement = nullptr;
    double total = 0;

    if (sqlite3_prepare_v2(db, sql, -1, &statement, nullptr) == SQLITE_OK) {
        sqlite3_bind_text(statement, 1, type.c_str(), -1, SQLITE_TRANSIENT);

        if (sqlite3_step(statement) == SQLITE_ROW) {
            total = sqlite3_column_double(statement, 0);
        }
    } else {
        cerr << "Summary query failed!" << endl;
    }

    if (statement) sqlite3_finalize(statement);
    sqlite3_close(db);

    return total;
}
