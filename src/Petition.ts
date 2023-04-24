import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn, Generated } from "typeorm";

@Entity()
export class petition {
    @PrimaryColumn()
    route: string

    @PrimaryColumn()
    type: string

    @PrimaryColumn()
    status: number

    @Column()
    number_requests: number

    @Column("decimal", { precision: 5, scale: 2 })
    average_time: number

    @PrimaryColumn()
    timestamp: number
}