import {ExpenseEntity} from "../types";
import {pool} from "../utils/db";
import {FieldPacket} from "mysql2"
import {v4 as uuid} from "uuid"

type ExpensesRecordResults =[ExpensesRecord[], FieldPacket[]]

export class ExpensesRecord implements ExpenseEntity {
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

    static async listAll(): Promise<ExpensesRecord[]> {
        const [results] = await pool.execute("SELECT * FROM `spendings`") as ExpensesRecordResults;
        return results.map(obj => new ExpensesRecord(obj))
    }

    async getOne(id: string): Promise<ExpensesRecord> | null {
        const [results] = await pool.execute("SELECT * FROM `spendings` WHERE `id` = :id", {
            id,
        }) as ExpensesRecordResults;
        return results.length === 0 ? null : new ExpensesRecord(results[0])
    }

    async insert(): Promise<void> {

        if(!this.id) {
            this.id = uuid()
        }
        await pool.execute("INSERT INTO `spendings` VALUES(:id, :category, :name, :cost, :month)", {
            id: this.id,
            category: this.category,
            name: this.name,
            cost: this.cost,
            month: this.month
        })
    }

    async delete(): Promise<void> {
        await pool.execute("DELETE FROM `spendings` WHERE `id` = :id", {
            id: this.id
        })
    }
}