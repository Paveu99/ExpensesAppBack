import {ExpenseEntity} from "../types";
import {pool} from "../utils/db";
import {FieldPacket} from "mysql2"
import {v4 as uuid} from "uuid"
import { format } from 'date-fns';

interface SummaryMonth {
    sum: number,
    categoryMost: string,
    categoryLeast: string,
    latest: string,
    cost: number,
    maxAmountCat: number,
    minAmountCat: number,
}

interface Summary extends SummaryMonth{
    monthMost: string,
    monthLeast: string,
    maxAmountMonth: number,
    minAmountMonth: number,
}

type ExpensesRecordResults =[ExpensesRecord[], FieldPacket[]];
type SummaryResults =[Summary[], FieldPacket[]];
type SummaryResultsMonth =[SummaryMonth[], FieldPacket[]];

export class ExpensesRecord implements ExpenseEntity {
    public category: string;
    public cost: number;
    public id: string;
    public month: string;
    public name: string;
    public notes: string;

    constructor(obj: ExpenseEntity) {
        this.id = obj.id;
        this.category = obj.category;
        this.name = obj.name;
        this.cost = obj.cost;
        this.month = obj.month;
        this.notes = obj.notes;
    };

    static async getSummary(): Promise<Summary> {
        const [sum] = await pool.execute("SELECT SUM(cost) AS sum FROM `spendings`") as SummaryResults;
        const [latest] = await pool.execute("SELECT name as latest FROM `spendings` ORDER BY month DESC LIMIT 1") as SummaryResults;
        const [monthMost] = await pool.execute("SELECT CONCAT(MONTHNAME(MAX(month)), ' ', YEAR(MAX(month))) AS monthMost, SUM(cost) AS maxAmountMonth FROM `spendings` GROUP BY YEAR(month), MONTH(month) ORDER BY maxAmountMonth DESC LIMIT 1") as SummaryResults;
        const [monthLeast] = await pool.execute("SELECT CONCAT(MONTHNAME(MAX(month)), ' ', YEAR(MAX(month))) AS monthLeast, SUM(cost) AS minAmountMonth FROM `spendings` GROUP BY YEAR(month), MONTH(month) ORDER BY minAmountMonth ASC LIMIT 1") as SummaryResults;
        const [categoryMost] = await pool.execute("SELECT category AS categoryMost, SUM(cost) AS maxAmountCat FROM `spendings` GROUP BY category ORDER BY maxAmountCat DESC LIMIT 1") as SummaryResults;
        const [categoryLeast] = await pool.execute("SELECT category AS categoryLeast, SUM(cost) AS minAmountCat FROM `spendings` GROUP BY category ORDER BY minAmountCat ASC LIMIT 1") as SummaryResults;

        return {
            ...sum[0],
            ...latest[0],
            ...categoryMost[0],
            ...categoryLeast[0],
            ...monthMost[0],
            ...monthLeast[0],
        };
    };

    static async getYearSummary(year: string | undefined): Promise<Summary> {
        const [sum] = await pool.execute("SELECT SUM(cost) AS sum FROM `spendings` WHERE YEAR(month) = :year", {
            year: year,
        }) as SummaryResults;
        const [latest] = await pool.execute("SELECT name as latest FROM `spendings` WHERE YEAR(month) = :year ORDER BY month DESC LIMIT 1", {
            year: year,
        }) as SummaryResults;
        const [monthMost] = await pool.execute("SELECT MONTHNAME(MAX(month)) AS monthMost, SUM(cost) AS maxAmountMonth FROM `spendings` WHERE YEAR(month) = :year GROUP BY YEAR(month), MONTH(month) ORDER BY maxAmountMonth DESC LIMIT 1", {
            year: year,
        }) as SummaryResults;
        const [monthLeast] = await pool.execute("SELECT MONTHNAME(MAX(month)) AS monthLeast, SUM(cost) AS minAmountMonth FROM `spendings` WHERE YEAR(month) = :year GROUP BY YEAR(month), MONTH(month) ORDER BY minAmountMonth ASC LIMIT 1", {
            year: year,
        }) as SummaryResults;
        const [categoryMost] = await pool.execute("SELECT category AS categoryMost, SUM(cost) AS maxAmountCat FROM `spendings` WHERE YEAR(month) = :year GROUP BY category ORDER BY maxAmountCat DESC LIMIT 1", {
            year: year,
        }) as SummaryResults;
        const [categoryLeast] = await pool.execute("SELECT category AS categoryLeast, SUM(cost) AS minAmountCat FROM `spendings` WHERE YEAR(month) = :year GROUP BY category ORDER BY minAmountCat ASC LIMIT 1", {
            year: year,
        }) as SummaryResults;

        return {
            ...sum[0],
            ...latest[0],
            ...categoryMost[0],
            ...categoryLeast[0],
            ...monthMost[0],
            ...monthLeast[0],
        };
    };

    static async getMonthSummary(year: string | undefined, month: string | undefined): Promise<SummaryMonth> {
        // const monthNumber = format(new Date(`${month} 1, ${year}`), 'M');

        const [sum] = await pool.execute(
            "SELECT SUM(cost) AS sum FROM `spendings` WHERE YEAR(month) = :year AND MONTH(month) = :month",
            { year: year, month: format(new Date(`${month} 1, ${year}`), 'M') }
        ) as SummaryResultsMonth;

        const [latest] = await pool.execute(
            "SELECT name AS latest, cost FROM `spendings` WHERE YEAR(month) = :year AND MONTH(month) = :month ORDER BY cost DESC LIMIT 1",
            { year: year, month: format(new Date(`${month} 1, ${year}`), 'M') }
        ) as SummaryResultsMonth;

        const [categoryMost] = await pool.execute(
            "SELECT category AS categoryMost, SUM(cost) AS maxAmountCat FROM `spendings` WHERE YEAR(month) = :year AND MONTH(month) = :month GROUP BY category ORDER BY maxAmountCat DESC LIMIT 1",
            { year: year, month: format(new Date(`${month} 1, ${year}`), 'M') }
        ) as SummaryResultsMonth;

        const [categoryLeast] = await pool.execute(
            "SELECT category AS categoryLeast, SUM(cost) AS minAmountCat FROM `spendings` WHERE YEAR(month) = :year AND MONTH(month) = :month GROUP BY category ORDER BY minAmountCat ASC LIMIT 1",
            { year: year, month: format(new Date(`${month} 1, ${year}`), 'M') }
        ) as SummaryResultsMonth;

        return {
            ...sum[0],
            ...latest[0],
            ...categoryMost[0],
            ...categoryLeast[0],
        };
    };


static async listAll(): Promise<ExpensesRecord[]> {
        const [results] = await pool.execute("SELECT * FROM `spendings`") as ExpensesRecordResults;

        results.forEach((expense: any) => {
            const parsedDate: Date = new Date(expense.month);
            expense.month = parsedDate.toISOString().split('T')[0];
        });

        return results.map(obj => new ExpensesRecord(obj));
    };

    static async getOne(id: string): Promise<ExpensesRecord> | null {
        const [results] = await pool.execute("SELECT * FROM `spendings` WHERE `id` = :id", {
            id,
        }) as ExpensesRecordResults;

        results.forEach((expense: any) => {
            const parsedDate: Date = new Date(expense.month);
            expense.month = parsedDate.toISOString().split('T')[0];
        });

        return results.length === 0 ? null : new ExpensesRecord(results[0])
    };

    async insert(): Promise<void> {
        if(!this.id) {
            this.id = uuid()
        }

        await pool.execute("INSERT INTO `spendings` VALUES(:id, :category, :name, :cost, :month, :notes)", {
            id: this.id,
            category: this.category,
            name: this.name,
            cost: this.cost,
            month: this.month,
            notes: this.notes,
        });
    };

    async updateRecord(body: ExpenseEntity): Promise<void> {
        await pool.execute("UPDATE `spendings` SET `category` = :category, `name` = :name, `cost` = :cost, `month` = :month, `notes` = :notes WHERE `id` = :id", {
            id: this.id,
            category: body.category,
            name: body.name,
            cost: body.cost,
            month: body.month,
            notes: body.notes,
        });
    }

    async delete(): Promise<void> {
        await pool.execute("DELETE FROM `spendings` WHERE `id` = :id", {
            id: this.id
        });
    };
}