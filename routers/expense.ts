import Router from "express"
import {ExpensesRecord} from "../records/expenses.record";
import {AddNewExpense, ExpenseEntity} from "../types";
import {ValidationError} from "../utils/errors";

export const expensesRouter =Router()

expensesRouter
    .get('/', async (req, res) => {
        const allExpenses = await ExpensesRecord.listAll()
        // TODO: POMYŚLEĆ O TYM CZY JAKAŚ INFORMACJA JESZCZE NIE BĘDZIE PRZYDATNA JAK SUMOWANIE
        const sortedData = allExpenses.sort(
            (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        );

        const expensesGroupedByDate: Record<string, ExpenseEntity[]> = sortedData.reduce(
            (acc, obj) => {
                const date = new Date(obj.month);
                const year = date.getFullYear();
                const month = date.toLocaleString('en-US', { month: 'long' });
                const key = `${month} ${year}`;

                acc[key] = acc[key] || [];
                acc[key].push(obj);

                return acc;
            },
            {} as Record<string, ExpenseEntity[]>
        );

        const expensesGroupedByCategory: Record<string, ExpenseEntity[]> = sortedData.reduce(
            (acc, obj) => {
                const key = obj.category;

                acc[key] = acc[key] || [];
                acc[key].push(obj);

                return acc;
            },
            {} as Record<string, ExpenseEntity[]>
        );

        res.json({
            allExpenses,
            expensesGroupedByDate,
            expensesGroupedByCategory
        })
    })

    .post('/', async (req, res) => {
        const newExpense = new ExpensesRecord(req.body as AddNewExpense)
        await newExpense.insert()

        res.json(newExpense)
    })

    .put('/edit/:id', async (req, res) => {
        const expense = await ExpensesRecord.getOne(req.params.id)
        if(!expense) {
            throw new ValidationError('No such expense!')
        }

        await expense.updateRecord(req.body)

        res.json({
            answer: `OK`,
            name: req.body.name,
        })
    })

    .delete('/:id', async (req, res) => {
        const expenseToDelete = await ExpensesRecord.getOne(req.params.id)

        if (!expenseToDelete) {
            throw new ValidationError('No such expense!')
        }

        await expenseToDelete.delete()

        res.end()
    })