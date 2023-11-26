import Router from "express"
import {AddNewExpense, ExpenseEntity} from "../types";
import {ValidationError} from "../utils/errors";
import {PlannedExpensesRecord} from "../records/plannedExpenses.record";

export const plannedExpensesRouter =Router()

plannedExpensesRouter
    .get('/', async (req, res) => {
        const allExpenses = await PlannedExpensesRecord.listAll()
        /**
         * TODO: NA TEN MOMENT SKUPIĆ SIĘ NA CZĘŚCI ZWIĄZANEJ Z BYŁYMI WYDATKAMI, NIE TYMI KTÓRE SIĘ ODBĘDĄ, TO MOŻNA POTEM ZAIMPLEMENTOWAĆ JAKO NOWE OKNO/OPCJA NA FRONCIE JAKO NOWY TAB
         */
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
        const newExpense = new PlannedExpensesRecord(req.body as AddNewExpense)
        await newExpense.insert()

        res.json(newExpense)
    })

    .put('/edit/:id', async (req, res) => {
        const expense = await PlannedExpensesRecord.getOne(req.params.id)
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
        const expenseToDelete = await PlannedExpensesRecord.getOne(req.params.id)

        if (!expenseToDelete) {
            throw new ValidationError('No such expense!')
        }

        await expenseToDelete.delete()

        res.end()
    })