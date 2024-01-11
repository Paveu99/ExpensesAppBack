import Router from "express"
import {AddNewExpense, ExpenseEntity} from "../types";
import {ValidationError} from "../utils/errors";
import {PlannedExpensesRecord} from "../records/plannedExpenses.record";
import {} from "../records/expenses.record";

export const plannedExpensesRouter =Router()

plannedExpensesRouter
    .get('/', async (req, res) => {
        const summary = await PlannedExpensesRecord.getSummary();

        const allExpenses = await PlannedExpensesRecord.listAll();

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

        res.json({
            summary,
            allExpenses,
            expensesGroupedByDate,
        });
    })

    .get('/single/:id', async (req, res) => {
        const oneExpense = await PlannedExpensesRecord.getOne(req.params.id);

        res.json({
            oneExpense,
        });
    })

    .get('/:year', async (req, res) => {
        const summaryYear = await PlannedExpensesRecord.getYearSummary(req.params.year);

        res.json({
            summaryYear,
        });
    })

    .get('/:year/:month', async (req, res) => {
        const summaryMonth = await PlannedExpensesRecord.getMonthSummary(req.params.year, req.params.month);

        res.json({
            summaryMonth,
        });
    })

    .post('/', async (req, res) => {
        const newExpense = new PlannedExpensesRecord(req.body as AddNewExpense);

        await newExpense.insert();

        res.json(newExpense);
    })

    .put('/edit/:id', async (req, res) => {
        const expense = await PlannedExpensesRecord.getOne(req.params.id);

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

    .post('/move/:id', async (req, res) => {
        await PlannedExpensesRecord.moveToExpenses(req.params.id);

        res.json({
            answer: 'OK',
            message: 'Expense was moved to past expenses',
        });
    })

    .delete('/delete/:id', async (req, res) => {
        const expenseToDelete = await PlannedExpensesRecord.getOne(req.params.id);

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
    });