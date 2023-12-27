import {ExpenseEntity} from "../types";
import {pool} from "../utils/db";
import {FieldPacket} from "mysql2"
import {v4 as uuid} from "uuid"

interface Summary {
    sum: number,
    category: string,
    latest: string,
    month: string
}

type ExpensesRecordResults =[ExpensesRecord[], FieldPacket[]];
type SummaryResults =[Summary[], FieldPacket[]];

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
    }

    static async getSummary(): Promise<Summary> {
        const [sum] = await pool.execute("SELECT SUM(cost) AS sum FROM `spendings`") as SummaryResults;
        const [latest] = await pool.execute("SELECT name as latest FROM `spendings` ORDER BY month DESC LIMIT 1") as SummaryResults;
        const [month] = await pool.execute("SELECT CONCAT(MONTHNAME(MAX(month)), ' ', YEAR(MAX(month))) AS month FROM `spendings` GROUP BY YEAR(month), MONTH(month) ORDER BY SUM(cost) DESC LIMIT 1") as SummaryResults;
        const [category] = await pool.execute("SELECT category AS category FROM `spendings` GROUP BY category ORDER BY SUM(cost) DESC LIMIT 1") as SummaryResults;

        return {
            ...sum[0],
            ...latest[0],
            ...category[0],
            ...month[0],
        }
    }

    static async listAll(): Promise<ExpensesRecord[]> {
        const [results] = await pool.execute("SELECT * FROM `spendings`") as ExpensesRecordResults;
        results.forEach((expense: any) => {
            const parsedDate: Date = new Date(expense.month);
            expense.month = parsedDate.toISOString().split('T')[0];
        });
        return results.map(obj => new ExpensesRecord(obj))
    }

    static async getOne(id: string): Promise<ExpensesRecord> | null {
        const [results] = await pool.execute("SELECT * FROM `spendings` WHERE `id` = :id", {
            id,
        }) as ExpensesRecordResults;
        results.forEach((expense: any) => {
            const parsedDate: Date = new Date(expense.month);
            expense.month = parsedDate.toISOString().split('T')[0];
        });
        return results.length === 0 ? null : new ExpensesRecord(results[0])
    }

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
        })
    }

    async updateRecord(body: ExpenseEntity): Promise<void> {
        await pool.execute("UPDATE `spendings` SET `category` = :category, `name` = :name, `cost` = :cost, `month` = :month, `notes` = :notes WHERE `id` = :id", {
            id: this.id,
            category: body.category,
            name: body.name,
            cost: body.cost,
            month: body.month,
            notes: body.notes,
        })
    }

    async delete(): Promise<void> {
        await pool.execute("DELETE FROM `spendings` WHERE `id` = :id", {
            id: this.id
        })
    }
}