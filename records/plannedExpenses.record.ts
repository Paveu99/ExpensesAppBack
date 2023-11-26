import {ExpenseEntity} from "../types";
import {pool} from "../utils/db";
import {FieldPacket} from "mysql2"
import {v4 as uuid} from "uuid"

type ExpensesRecordResults =[PlannedExpensesRecord[], FieldPacket[]]

export class PlannedExpensesRecord implements ExpenseEntity {
    public category: string;
    public cost: number;
    public id: string;
    public month: string;
    public name: string;

    constructor(obj: ExpenseEntity) {
        this.id = obj.id;
        this.category = obj.category;
        this.name = obj.name;
        this.cost = obj.cost;
        this.month = obj.month;
    }

    static async listAll(): Promise<PlannedExpensesRecord[]> {
        const [results] = await pool.execute("SELECT * FROM `plannedspendings`") as ExpensesRecordResults;
        return results.map(obj => new PlannedExpensesRecord(obj))
    }

    static async getOne(id: string): Promise<PlannedExpensesRecord> | null {
        const [results] = await pool.execute("SELECT * FROM `plannedspendings` WHERE `id` = :id", {
            id,
        }) as ExpensesRecordResults;
        return results.length === 0 ? null : new PlannedExpensesRecord(results[0])
    }

    async insert(): Promise<void> {
        if(!this.id) {
            this.id = uuid()
        }
        await pool.execute("INSERT INTO `plannedspendings` VALUES(:id, :category, :name, :cost, :month)", {
            id: this.id,
            category: this.category,
            name: this.name,
            cost: this.cost,
            month: this.month
        })
    }

    async updateRecord(body: ExpenseEntity): Promise<void> {
        await pool.execute("UPDATE `plannedspendings` SET `category` = :category, `name` = :name, `cost` = :cost, `month` = :month WHERE `id` = :id", {
            id: this.id,
            category: body.category,
            name: body.name,
            cost: body.cost,
            month: body.month,
        })
    }

    async delete(): Promise<void> {
        await pool.execute("DELETE FROM `plannedspendings` WHERE `id` = :id", {
            id: this.id
        })
    }
}