import Router from "express"
import {ExpensesRecord} from "../records/expenses.record";
import {AddNewExpense} from "../types";
import {ValidationError} from "../utils/errors";

export const expensesRouter =Router()

expensesRouter
    .get('/', async (req, res) => {
        const allExpenses = await ExpensesRecord.listAll()

        res.json(allExpenses)
    })

    .post('/', async (req, res) => {
        const newExpense = new ExpensesRecord(req.body as AddNewExpense)
        await newExpense.insert()

        res.json(newExpense)
    })

    .delete('/:id', async (req, res) => {
        const expenseToDelete = await ExpensesRecord.getOne(req.params.id)

        if (!expenseToDelete) {
            throw new ValidationError('No such expense!')
        }

        await expenseToDelete.delete()

        res.end()
    })