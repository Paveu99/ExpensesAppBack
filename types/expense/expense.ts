import {ExpenseEntity} from "./expense.entity";

export type AddNewExpense = Omit<ExpenseEntity, 'id'>