
#ifndef DATABASE_H
#define DATABASE_H

#include <string>

bool initializeDatabase();

bool addTransaction(
    const std::string& title,
    const std::string& type,
    const std::string& category,
    double amount,
    const std::string& date
);

void displayTransactions();

double getTotal(const std::string& type);

#endif
