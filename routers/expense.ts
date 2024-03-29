import Router from "express"
import {ExpensesRecord} from "../records/expenses.record";
import {AddNewExpense, ExpenseEntity} from "../types";
import {ValidationError} from "../utils/errors";

export const expensesRouter = Router();

expensesRouter
    .get('/', async (req, res) => {
        const summary = await ExpensesRecord.getSummary();

        const allExpenses = await ExpensesRecord.listAll();

        const sortedData = allExpenses.sort(
            (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        );

        const expensesGroupedByDate: Record<string, Record<string, ExpenseEntity[]>> = sortedData.reduce(
            (acc, obj) => {
                const date = new Date(obj.month);
                const year = date.getFullYear();
                const month = date.toLocaleString('en-US', { month: 'long' });

                acc[year] = acc[year] || {};
                acc[year][month] = acc[year][month] || [];
                acc[year][month].push(obj);

                return acc;
            },
            {} as Record<string, Record<string, ExpenseEntity[]>>
        );

        const expensesGroupedByYear: Record<string, ExpenseEntity[]> = sortedData.reduce(
            (acc, obj) => {
                const date = new Date(obj.month);
                const year = date.getFullYear();

                acc[year] = acc[year] || [];
                acc[year].push(obj);

                return acc;
            },
            {} as Record<string, ExpenseEntity[]>
        );

        res.json({
            summary,
            allExpenses,
            expensesGroupedByDate,
            expensesGroupedByYear,
        });
    })

    .get('/single/:id', async (req, res) => {
        const oneExpense = await ExpensesRecord.getOne(req.params.id);

        res.json({
            oneExpense,
        });
    })

    .get('/:year', async (req, res) => {
        const summaryYear = await ExpensesRecord.getYearSummary(req.params.year);

        res.json({
            summaryYear,
        });
    })

    .get('/:year/:month', async (req, res) => {
        const summaryMonth = await ExpensesRecord.getMonthSummary(req.params.year, req.params.month);

        res.json({
            summaryMonth,
        });
    })

    .post('/', async (req, res) => {
        const newExpense = new ExpensesRecord(req.body as AddNewExpense);

        await newExpense.insert();

        res.json(newExpense);
    })

    .put('/edit/:id', async (req, res) => {
        const expense = await ExpensesRecord.getOne(req.params.id);

        if(!expense) {
            throw new ValidationError('No such expense!');
        }

        await expense.updateRecord(req.body);

        res.json({
            answer: `OK`,
            name: req.body.name,
            newExpense: expense
        });
    })

    .delete('/delete/:id', async (req, res) => {
        const expenseToDelete = await ExpensesRecord.getOne(req.params.id);

        if (!expenseToDelete) {
            throw new ValidationError('No such expense!')
        }

        await expenseToDelete.delete();

        res.json({
            answer: `OK`,
            name: req.body.name,
            newExpense: expenseToDelete,
            });
        res.end();
    })